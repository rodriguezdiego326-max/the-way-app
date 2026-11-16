CREATE OR REPLACE FUNCTION public.push_claim_activity(p_activity_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  n public.activity_notifications%ROWTYPE;
  v_enabled boolean;
  v_allowed boolean;
  v_devices jsonb;
BEGIN
  SELECT * INTO n FROM public.activity_notifications WHERE id = p_activity_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT pp.push_enabled INTO v_enabled
  FROM public.push_preferences pp
  WHERE pp.profile_id = n.recipient_profile_id;
  IF NOT COALESCE(v_enabled, false) THEN
    RETURN jsonb_build_object('status', 'suppressed', 'devices', '[]'::jsonb);
  END IF;

  IF n.family_profile_id IS NOT NULL THEN
    v_allowed := EXISTS (
      SELECT 1 FROM public.family_account_memberships m
      WHERE m.family_profile_id = n.family_profile_id
        AND m.profile_id = n.recipient_profile_id
    );
  ELSIF n.circle_id IS NOT NULL THEN
    v_allowed := EXISTS (
      SELECT 1 FROM public.circle_members c
      WHERE c.circle_id = n.circle_id
        AND c.profile_id = n.recipient_profile_id
    );
  ELSE
    v_allowed := false;
  END IF;
  IF NOT COALESCE(v_allowed, false) THEN
    RETURN jsonb_build_object('status', 'suppressed', 'devices', '[]'::jsonb);
  END IF;

  WITH ins AS (
    INSERT INTO public.push_deliveries (activity_notification_id, push_device_id, status)
    SELECT n.id, pd.id, 'pending'
    FROM public.push_devices pd
    WHERE pd.profile_id = n.recipient_profile_id
      AND pd.enabled
    ON CONFLICT (activity_notification_id, push_device_id) DO NOTHING
    RETURNING id, push_device_id
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'delivery_id', ins.id,
    'token', pd.token,
    'environment', pd.environment
  )), '[]'::jsonb)
  INTO v_devices
  FROM ins
  JOIN public.push_devices pd ON pd.id = ins.push_device_id;

  RETURN jsonb_build_object(
    'status', 'ready',
    'activity_id', n.id,
    'event_type', n.event_type,
    'actor_label', n.actor_label,
    'scope_label', n.scope_label,
    'devices', v_devices
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.push_claim_activity(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.push_claim_activity(uuid) TO service_role;
