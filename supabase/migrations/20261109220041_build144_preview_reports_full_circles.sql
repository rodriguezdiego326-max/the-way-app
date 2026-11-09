/*
# Build 144 - Preview reports full Circles

## Plain-English summary
When a Circle has already reached its 12-member limit, the invitation preview now
says so before the recipient taps Join, instead of showing a joinable preview.

## Modified functions
- public.preview_circle_invitation(text): adds a "full" status when the Circle has 12 members.
  Nothing else changes; no new data is returned.

## Security notes
- Same grants and SECURITY DEFINER settings as before (search_path fixed, EXECUTE limited to authenticated).
*/

CREATE OR REPLACE FUNCTION public.preview_circle_invitation(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_code text := lower(btrim(coalesce(p_code, '')));
  v_inv public.circle_invitations;
  v_circle public.circles;
  v_count integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;
  IF v_code !~ '^[0-9a-f]{24}$' THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  SELECT * INTO v_inv FROM public.circle_invitations WHERE invite_code = v_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  SELECT * INTO v_circle FROM public.circles WHERE id = v_inv.circle_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.circle_members cm
    WHERE cm.circle_id = v_circle.id AND cm.profile_id = v_uid
  ) THEN
    RETURN jsonb_build_object('status', 'already_member', 'circle_id', v_circle.id, 'circle_name', v_circle.name);
  END IF;

  IF v_inv.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'revoked');
  END IF;
  IF v_inv.accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'used');
  END IF;
  IF v_inv.expires_at IS NOT NULL AND v_inv.expires_at <= now() THEN
    RETURN jsonb_build_object('status', 'expired');
  END IF;

  SELECT count(*)::integer INTO v_count FROM public.circle_members cm WHERE cm.circle_id = v_circle.id;

  IF v_count >= 12 THEN
    RETURN jsonb_build_object('status', 'full', 'circle_name', v_circle.name);
  END IF;

  RETURN jsonb_build_object(
    'status', 'valid',
    'circle_name', v_circle.name,
    'circle_type', v_circle.circle_type,
    'description', v_circle.description,
    'member_count', v_count,
    'max_members', 12,
    'expires_at', v_inv.expires_at
  );
END;
$$;
