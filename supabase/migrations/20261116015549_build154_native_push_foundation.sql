CREATE TABLE IF NOT EXISTS public.push_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  installation_id uuid NOT NULL,
  platform text NOT NULL DEFAULT 'ios' CHECK (platform = 'ios'),
  token text NOT NULL CHECK (token ~ '^[0-9a-fA-F]{32,256}$'),
  environment text NOT NULL CHECK (environment IN ('sandbox', 'production')),
  enabled boolean NOT NULL DEFAULT true,
  app_build integer CHECK (app_build IS NULL OR app_build BETWEEN 1 AND 100000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_registered_at timestamptz NOT NULL DEFAULT now(),
  invalidated_at timestamptz,
  last_error_code text,
  CONSTRAINT push_devices_installation_profile_env_key UNIQUE (installation_id, profile_id, environment)
);

CREATE UNIQUE INDEX IF NOT EXISTS push_devices_active_token_key
  ON public.push_devices (platform, environment, token) WHERE enabled;
CREATE INDEX IF NOT EXISTS push_devices_profile_active_idx
  ON public.push_devices (profile_id) WHERE enabled;

CREATE TABLE IF NOT EXISTS public.push_preferences (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  push_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.push_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_notification_id uuid NOT NULL REFERENCES public.activity_notifications(id) ON DELETE CASCADE,
  push_device_id uuid NOT NULL REFERENCES public.push_devices(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'invalid_token')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  apns_id uuid,
  last_error_code text,
  last_attempt_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_deliveries_activity_device_key UNIQUE (activity_notification_id, push_device_id)
);

CREATE INDEX IF NOT EXISTS push_deliveries_push_device_idx ON public.push_deliveries (push_device_id);

ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_deliveries ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.push_devices FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.push_deliveries FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.push_preferences FROM PUBLIC, anon;
REVOKE ALL ON public.push_preferences FROM authenticated;
GRANT SELECT ON public.push_preferences TO authenticated;
GRANT ALL ON public.push_devices, public.push_preferences, public.push_deliveries TO service_role;

CREATE POLICY "select_own_push_preference" ON public.push_preferences
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = profile_id);

CREATE OR REPLACE FUNCTION public.register_push_device(
  p_installation_id uuid,
  p_token text,
  p_environment text,
  p_app_build integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_other_active integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_installation_id IS NULL THEN
    RAISE EXCEPTION 'invalid_installation' USING ERRCODE = '22023';
  END IF;
  IF p_token IS NULL OR p_token !~ '^[0-9a-fA-F]{32,256}$' THEN
    RAISE EXCEPTION 'invalid_token' USING ERRCODE = '22023';
  END IF;
  IF p_environment IS NULL OR p_environment NOT IN ('sandbox', 'production') THEN
    RAISE EXCEPTION 'invalid_environment' USING ERRCODE = '22023';
  END IF;
  IF p_app_build IS NOT NULL AND (p_app_build < 1 OR p_app_build > 100000) THEN
    RAISE EXCEPTION 'invalid_build' USING ERRCODE = '22023';
  END IF;

  UPDATE public.push_devices
     SET enabled = false, invalidated_at = now(), updated_at = now()
   WHERE platform = 'ios'
     AND environment = p_environment
     AND token = p_token
     AND enabled
     AND NOT (profile_id = v_uid AND installation_id = p_installation_id);

  UPDATE public.push_devices
     SET enabled = false, invalidated_at = now(), updated_at = now()
   WHERE installation_id = p_installation_id
     AND environment = p_environment
     AND token <> p_token
     AND enabled;

  SELECT count(*) INTO v_other_active
    FROM public.push_devices
   WHERE profile_id = v_uid
     AND enabled
     AND NOT (installation_id = p_installation_id AND environment = p_environment);

  IF v_other_active > 9 THEN
    UPDATE public.push_devices
       SET enabled = false, invalidated_at = now(), updated_at = now()
     WHERE id IN (
       SELECT id FROM public.push_devices
        WHERE profile_id = v_uid
          AND enabled
          AND NOT (installation_id = p_installation_id AND environment = p_environment)
        ORDER BY last_registered_at ASC
        LIMIT v_other_active - 9
     );
  END IF;

  INSERT INTO public.push_devices (
    profile_id, installation_id, platform, token, environment, enabled,
    app_build, created_at, updated_at, last_registered_at, invalidated_at, last_error_code
  ) VALUES (
    v_uid, p_installation_id, 'ios', p_token, p_environment, true,
    p_app_build, now(), now(), now(), NULL, NULL
  )
  ON CONFLICT (installation_id, profile_id, environment) DO UPDATE
     SET token = EXCLUDED.token,
         enabled = true,
         app_build = EXCLUDED.app_build,
         updated_at = now(),
         last_registered_at = now(),
         invalidated_at = NULL,
         last_error_code = NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.deactivate_push_device(p_installation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_installation_id IS NULL THEN
    RAISE EXCEPTION 'invalid_installation' USING ERRCODE = '22023';
  END IF;

  UPDATE public.push_devices
     SET enabled = false, invalidated_at = now(), updated_at = now()
   WHERE profile_id = v_uid
     AND installation_id = p_installation_id
     AND enabled;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_push_enabled(p_enabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_enabled IS NULL THEN
    RAISE EXCEPTION 'invalid_value' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.push_preferences (profile_id, push_enabled, updated_at)
  VALUES (v_uid, p_enabled, now())
  ON CONFLICT (profile_id) DO UPDATE
     SET push_enabled = EXCLUDED.push_enabled,
         updated_at = now();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.register_push_device(uuid, text, text, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.deactivate_push_device(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_push_enabled(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_push_device(uuid, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_push_device(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_push_enabled(boolean) TO authenticated;
