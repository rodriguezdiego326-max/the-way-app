/*
# Build 144 - Real Circle connections (invitations, join, member summaries)

## Plain-English summary
Circle invitations become a safe, one-time, server-enforced way for a second
SOLAPATH account to join a Circle. Creating a Circle, creating invitations,
joining, revoking, and removing members all go through narrow database
functions that check the caller on the server. Direct client writes that
previously allowed self-insertion into any Circle and self-promotion of
membership role are removed.

## New functions
1. private.is_circle_owner(uuid) - true when the caller is the OWNER of the Circle.
2. public.create_circle(name, circle_type, description) - creates a Circle and its OWNER row atomically.
3. public.create_circle_invitation(circle_id, expires_in_hours) - owner-only; generates a 96-bit random code; expiry 24h, 168h, or none.
4. public.preview_circle_invitation(code) - returns only safe Circle metadata for a valid code.
5. public.accept_circle_invitation(code) - locks the invitation and the Circle, enforces one-time use, the 12-member cap, and inserts a MEMBER row.
6. public.get_circle_member_summaries(circle_id) - members of a Circle see only display names, roles, and join dates.
7. public.revoke_circle_invitation(invitation_id) - owner-only; marks an unused invitation revoked.

## Security changes
- circle_members: direct INSERT and UPDATE removed. A member can no longer add themselves to a Circle or change a role.
  DELETE allowed only for (a) a member removing their own non-OWNER row, or (b) the OWNER removing a non-OWNER row.
- circle_invitations: direct INSERT, UPDATE, and DELETE removed. SELECT limited to the Circle OWNER.
- circles: direct INSERT removed (use create_circle). UPDATE column-restricted to name, circle_type, description,
  so ownership and privacy cannot be changed by a client.
- All new functions: SECURITY DEFINER with search_path = '', EXECUTE revoked from PUBLIC and anon, granted to authenticated.
- RLS remains enabled on all three tables. profiles RLS is not changed.

## Important notes
1. Invitation codes keep their existing 96-bit random format.
2. Redemption locks the invitation row and then the Circle row, so one code cannot be used twice and
   concurrent joins cannot exceed 12 members.
3. Expired, revoked, and used invitations never create a membership.
*/

CREATE OR REPLACE FUNCTION private.is_circle_owner(check_circle_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.circle_members cm
    WHERE cm.circle_id = check_circle_id
      AND cm.profile_id = (SELECT auth.uid())
      AND cm.role = 'OWNER'
  );
$$;

REVOKE EXECUTE ON FUNCTION private.is_circle_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_circle_owner(uuid) TO authenticated;

-- Direct client writes are replaced by the functions below.
DROP POLICY IF EXISTS insert_own_circles ON public.circles;
DROP POLICY IF EXISTS insert_circle_members ON public.circle_members;
DROP POLICY IF EXISTS update_circle_members ON public.circle_members;
DROP POLICY IF EXISTS delete_circle_members ON public.circle_members;
DROP POLICY IF EXISTS insert_circle_invitations ON public.circle_invitations;
DROP POLICY IF EXISTS update_circle_invitations ON public.circle_invitations;
DROP POLICY IF EXISTS delete_circle_invitations ON public.circle_invitations;
DROP POLICY IF EXISTS select_circle_invitations ON public.circle_invitations;

CREATE POLICY delete_circle_members ON public.circle_members
  FOR DELETE TO authenticated
  USING (
    role <> 'OWNER'
    AND (profile_id = (SELECT auth.uid()) OR private.is_circle_owner(circle_id))
  );

CREATE POLICY select_circle_invitations ON public.circle_invitations
  FOR SELECT TO authenticated
  USING (private.is_circle_owner(circle_id));

REVOKE ALL ON public.circles, public.circle_members, public.circle_invitations FROM anon, authenticated;
GRANT SELECT, DELETE ON public.circles TO authenticated;
GRANT UPDATE (name, circle_type, description) ON public.circles TO authenticated;
GRANT SELECT, DELETE ON public.circle_members TO authenticated;
GRANT SELECT ON public.circle_invitations TO authenticated;

CREATE OR REPLACE FUNCTION public.create_circle(
  p_name text,
  p_circle_type text,
  p_description text DEFAULT NULL
)
RETURNS public.circles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_circle public.circles;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;
  IF btrim(coalesce(p_name, '')) = '' OR char_length(btrim(p_name)) > 80 THEN
    RAISE EXCEPTION 'invalid_name' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.circles (name, circle_type, description, owner_profile_id, privacy)
  VALUES (
    btrim(p_name),
    coalesce(nullif(btrim(coalesce(p_circle_type, '')), ''), 'Other'),
    nullif(btrim(coalesce(p_description, '')), ''),
    v_uid,
    'PRIVATE'
  )
  RETURNING * INTO v_circle;

  INSERT INTO public.circle_members (circle_id, profile_id, role)
  VALUES (v_circle.id, v_uid, 'OWNER');

  RETURN v_circle;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_circle_invitation(
  p_circle_id uuid,
  p_expires_in_hours integer DEFAULT NULL
)
RETURNS public.circle_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_invitation public.circle_invitations;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;
  IF NOT private.is_circle_owner(p_circle_id) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;
  IF p_expires_in_hours IS NOT NULL AND p_expires_in_hours NOT IN (24, 168) THEN
    RAISE EXCEPTION 'invalid_expiration' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.circle_invitations (circle_id, invited_by_profile_id, invite_code, expires_at)
  VALUES (
    p_circle_id,
    v_uid,
    encode(extensions.gen_random_bytes(12), 'hex'),
    CASE WHEN p_expires_in_hours IS NULL THEN NULL
         ELSE now() + make_interval(hours => p_expires_in_hours) END
  )
  RETURNING * INTO v_invitation;

  RETURN v_invitation;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_circle_invitation(p_invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_circle_id uuid;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT ci.circle_id INTO v_circle_id
  FROM public.circle_invitations ci
  WHERE ci.id = p_invitation_id;

  IF v_circle_id IS NULL OR NOT private.is_circle_owner(v_circle_id) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  UPDATE public.circle_invitations
  SET revoked_at = now()
  WHERE id = p_invitation_id
    AND revoked_at IS NULL
    AND accepted_at IS NULL;
END;
$$;

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

CREATE OR REPLACE FUNCTION public.accept_circle_invitation(p_code text)
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

  SELECT * INTO v_inv FROM public.circle_invitations WHERE invite_code = v_code FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  SELECT * INTO v_circle FROM public.circles WHERE id = v_inv.circle_id FOR UPDATE;
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
    RETURN jsonb_build_object('status', 'full');
  END IF;

  INSERT INTO public.circle_members (circle_id, profile_id, role)
  VALUES (v_circle.id, v_uid, 'MEMBER');

  UPDATE public.circle_invitations
  SET accepted_at = now(), accepted_by_profile_id = v_uid
  WHERE id = v_inv.id;

  RETURN jsonb_build_object(
    'status', 'joined',
    'circle_id', v_circle.id,
    'circle_name', v_circle.name,
    'circle_type', v_circle.circle_type
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_circle_member_summaries(p_circle_id uuid)
RETURNS TABLE (
  member_profile_id uuid,
  member_display_name text,
  member_role text,
  member_joined_at timestamptz,
  is_current_user boolean
)
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
  IF NOT private.is_circle_member(p_circle_id) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    cm.profile_id,
    coalesce(nullif(btrim(p.display_name), ''), 'SOLAPATH Member'),
    cm.role::text,
    cm.joined_at,
    (cm.profile_id = v_uid)
  FROM public.circle_members cm
  LEFT JOIN public.profiles p ON p.id = cm.profile_id
  WHERE cm.circle_id = p_circle_id
  ORDER BY (cm.role = 'OWNER') DESC, cm.joined_at ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_circle(text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_circle_invitation(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_circle_invitation(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.preview_circle_invitation(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.accept_circle_invitation(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_circle_member_summaries(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_circle(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_circle_invitation(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_circle_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.preview_circle_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_circle_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_circle_member_summaries(uuid) TO authenticated;
