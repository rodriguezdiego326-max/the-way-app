-- App Owner is a separate, server-verified authority; do not fabricate church membership or pastor titles.
CREATE FUNCTION private.is_app_owner() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM private.app_admins
 WHERE profile_id=auth.uid() AND role='APP_OWNER' AND active=true);
$$;
REVOKE ALL ON FUNCTION private.is_app_owner() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.is_app_owner() TO authenticated;

CREATE POLICY app_owner_church_prayer ON public.church_prayer_items FOR ALL TO authenticated
 USING (private.is_app_owner()) WITH CHECK (private.is_app_owner());
CREATE POLICY app_owner_read_church ON public.church_profiles FOR SELECT TO authenticated
 USING (private.is_app_owner());
CREATE OR REPLACE FUNCTION private.can_delegate_church_role(check_church_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT private.is_app_owner() OR EXISTS (
    SELECT 1
    FROM public.church_memberships cm
    WHERE cm.church_id = check_church_id
      AND cm.profile_id = (SELECT auth.uid())
      AND cm.verified_church_role IN ('PASTOR','CHURCH_ADMIN')
  );
$function$
;
CREATE OR REPLACE FUNCTION public.delete_owned_church_group(p_group_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_group public.church_groups%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT cg.*
  INTO v_group
  FROM public.church_groups cg
  WHERE cg.id = p_group_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('deleted', false, 'reason', 'not_found');
  END IF;

  IF NOT private.is_app_owner() AND (v_group.leader_profile_id IS DISTINCT FROM v_uid OR NOT public.is_church_member(v_group.church_id)) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.church_groups
  WHERE id = v_group.id;

  RETURN jsonb_build_object(
    'deleted', true,
    'group_id', v_group.id,
    'church_id', v_group.church_id,
    'name', v_group.name
  );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.is_church_member(p_church_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 SELECT private.is_app_owner() OR EXISTS (SELECT 1 FROM public.church_memberships cm WHERE cm.church_id=p_church_id
 AND cm.profile_id=auth.uid() AND cm.membership_status='member');
$function$
;
CREATE OR REPLACE FUNCTION private.is_verified_church_leadership(check_church_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT private.is_app_owner() OR EXISTS (
    SELECT 1
    FROM public.church_memberships cm
    WHERE cm.church_id = check_church_id
      AND cm.profile_id = (SELECT auth.uid())
      AND cm.verified_church_role IN ('PASTOR','CHURCH_ADMIN','ELDER','DEACON','LEADER')
  );
$function$
;
CREATE OR REPLACE FUNCTION public.is_verified_church_publisher(p_church_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT private.is_app_owner() OR EXISTS (
    SELECT 1
    FROM public.church_memberships cm
    WHERE cm.church_id = p_church_id
      AND cm.profile_id = (SELECT auth.uid())
      AND cm.verified_church_role = 'PASTOR'
  );
$function$
;
CREATE OR REPLACE FUNCTION public.respond_church_member_invitation(p_invitation_id uuid, p_accept boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE i private.church_member_invitations%ROWTYPE; m public.church_memberships%ROWTYPE;
BEGIN
 IF auth.uid() IS NULL OR p_accept IS NULL THEN RAISE EXCEPTION 'Invalid response'; END IF;
 -- Lock membership before invitation, matching send/revoke lock order.
 SELECT cm.* INTO m FROM public.church_memberships cm JOIN private.church_member_invitations ci ON ci.membership_id=cm.id
 WHERE ci.id=p_invitation_id AND cm.profile_id=auth.uid() FOR UPDATE OF cm;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invitation unavailable'; END IF;
 SELECT * INTO i FROM private.church_member_invitations WHERE id=p_invitation_id FOR UPDATE;
 IF i.status<>'pending' OR i.expires_at<=now() THEN RAISE EXCEPTION 'Invitation expired or already answered'; END IF;
 IF p_accept AND NOT EXISTS(SELECT 1 FROM private.app_admins owner WHERE owner.profile_id=i.invited_by AND owner.role='APP_OWNER' AND owner.active=true) AND NOT EXISTS(SELECT 1 FROM public.church_memberships sender WHERE sender.church_id=m.church_id
 AND sender.profile_id=i.invited_by AND sender.membership_status='member' AND sender.verified_church_role IN ('PASTOR','CHURCH_ADMIN')) THEN
 RAISE EXCEPTION 'Ask a current pastor or church admin for a new invitation'; END IF;
 UPDATE private.church_member_invitations SET status=CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END,responded_at=now() WHERE id=i.id;
 IF p_accept THEN UPDATE public.church_memberships SET membership_status='member',personal_role='Member' WHERE id=m.id; END IF;
END; $function$
;
