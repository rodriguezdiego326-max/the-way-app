ALTER TABLE public.push_devices DROP CONSTRAINT IF EXISTS push_devices_token_check;
ALTER TABLE public.push_devices ADD CONSTRAINT push_devices_token_check
  CHECK (char_length(token) BETWEEN 32 AND 255 AND token ~ '^[0-9a-fA-F]+$');

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
  IF p_token IS NULL OR char_length(p_token) NOT BETWEEN 32 AND 255 OR p_token !~ '^[0-9a-fA-F]+$' THEN
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
