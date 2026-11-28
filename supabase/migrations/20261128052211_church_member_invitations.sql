-- Adding a church creates a visitor connection, not church membership.
ALTER TABLE public.church_memberships ADD COLUMN membership_status text NOT NULL DEFAULT 'visitor'
  CHECK (membership_status IN ('visitor','member'));
ALTER TABLE public.church_memberships ALTER COLUMN personal_role SET DEFAULT 'Visitor';
-- Only independently verified leaders have evidence of approval at migration time.
UPDATE public.church_memberships SET membership_status = 'member' WHERE verified_church_role IS NOT NULL;
REVOKE INSERT, UPDATE ON public.church_memberships FROM authenticated, anon;
GRANT INSERT(profile_id,church_id,personal_role), UPDATE(personal_role) ON public.church_memberships TO authenticated;

ALTER TABLE public.church_memberships DROP CONSTRAINT church_memberships_verified_church_role_check;
ALTER TABLE public.church_memberships ADD CONSTRAINT church_memberships_verified_church_role_check
 CHECK (verified_church_role IS NULL OR verified_church_role IN ('PASTOR','CHURCH_ADMIN','ELDER','DEACON','LEADER'));
ALTER TABLE public.church_admin_claims DROP CONSTRAINT church_admin_claims_requested_role_check;
ALTER TABLE public.church_admin_claims ADD CONSTRAINT church_admin_claims_requested_role_check
 CHECK (requested_role IN ('PASTOR','CHURCH_ADMIN','ELDER','DEACON','LEADER'));

ALTER TABLE private.church_admin_audit_log DROP CONSTRAINT church_admin_audit_log_verified_role_check;
ALTER TABLE private.church_admin_audit_log ADD CONSTRAINT church_admin_audit_log_verified_role_check
 CHECK (verified_role IS NULL OR verified_role IN ('PASTOR','CHURCH_ADMIN','ELDER','DEACON','LEADER'));

CREATE OR REPLACE FUNCTION public.is_church_member(p_church_id uuid) RETURNS boolean
LANGUAGE sql STABLE SET search_path = '' AS $$
 SELECT EXISTS (SELECT 1 FROM public.church_memberships cm WHERE cm.church_id=p_church_id
 AND cm.profile_id=auth.uid() AND cm.membership_status='member');
$$;

-- These restrictive gates also cover old builds and direct API requests.
CREATE POLICY approved_member_prayers ON public.church_prayer_items AS RESTRICTIVE
 FOR ALL TO authenticated USING (public.is_church_member(church_id)) WITH CHECK (public.is_church_member(church_id));
CREATE POLICY approved_member_studies ON public.church_studies AS RESTRICTIVE
 FOR ALL TO authenticated USING (public.is_church_member(church_id)) WITH CHECK (public.is_church_member(church_id));
CREATE POLICY approved_member_groups ON public.church_groups AS RESTRICTIVE
 FOR ALL TO authenticated USING (public.is_church_member(church_id)) WITH CHECK (public.is_church_member(church_id));

CREATE TABLE private.church_member_invitations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 membership_id uuid NOT NULL REFERENCES public.church_memberships(id) ON DELETE CASCADE,
 invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','declined','revoked')),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '14 days',
 responded_at timestamptz
);
CREATE UNIQUE INDEX church_member_invitation_pending ON private.church_member_invitations(membership_id) WHERE status='pending';
CREATE INDEX church_member_invitation_sender ON private.church_member_invitations(invited_by);
ALTER TABLE private.church_member_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.church_member_invitations FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.list_church_membership_connections(p_church_id uuid)
RETURNS TABLE(membership_id uuid,display_name text,membership_status text,invitation_id uuid,invitation_expires_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 RETURN QUERY SELECT cm.id,p.display_name,cm.membership_status,i.id,i.expires_at
 FROM public.church_memberships cm JOIN public.profiles p ON p.id=cm.profile_id
 LEFT JOIN private.church_member_invitations i ON i.membership_id=cm.id AND i.status='pending' AND i.expires_at>now()
 WHERE cm.church_id=p_church_id AND (cm.profile_id=auth.uid() OR private.can_delegate_church_role(p_church_id))
 ORDER BY p.display_name,cm.id;
END; $$;

CREATE FUNCTION public.invite_church_member(p_membership_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE m public.church_memberships%ROWTYPE;
BEGIN
 SELECT * INTO m FROM public.church_memberships WHERE id=p_membership_id FOR UPDATE;
 IF NOT FOUND OR auth.uid() IS NULL OR NOT private.can_delegate_church_role(m.church_id) THEN RAISE EXCEPTION 'Only a pastor or church admin can invite members'; END IF;
 IF m.profile_id=auth.uid() OR m.membership_status='member' THEN RAISE EXCEPTION 'This person is already a member'; END IF;
 UPDATE private.church_member_invitations SET status='revoked',responded_at=now()
 WHERE membership_id=m.id AND status='pending' AND expires_at<=now();
 INSERT INTO private.church_member_invitations(membership_id,invited_by) VALUES(m.id,auth.uid())
 ON CONFLICT (membership_id) WHERE status='pending' DO NOTHING;
END; $$;

CREATE FUNCTION public.respond_church_member_invitation(p_invitation_id uuid,p_accept boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE i private.church_member_invitations%ROWTYPE; m public.church_memberships%ROWTYPE;
BEGIN
 IF auth.uid() IS NULL OR p_accept IS NULL THEN RAISE EXCEPTION 'Invalid response'; END IF;
 -- Lock membership before invitation, matching send/revoke lock order.
 SELECT cm.* INTO m FROM public.church_memberships cm JOIN private.church_member_invitations ci ON ci.membership_id=cm.id
 WHERE ci.id=p_invitation_id AND cm.profile_id=auth.uid() FOR UPDATE OF cm;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invitation unavailable'; END IF;
 SELECT * INTO i FROM private.church_member_invitations WHERE id=p_invitation_id FOR UPDATE;
 IF i.status<>'pending' OR i.expires_at<=now() THEN RAISE EXCEPTION 'Invitation expired or already answered'; END IF;
 IF p_accept AND NOT EXISTS(SELECT 1 FROM public.church_memberships sender WHERE sender.church_id=m.church_id
 AND sender.profile_id=i.invited_by AND sender.membership_status='member' AND sender.verified_church_role IN ('PASTOR','CHURCH_ADMIN')) THEN
 RAISE EXCEPTION 'Ask a current pastor or church admin for a new invitation'; END IF;
 UPDATE private.church_member_invitations SET status=CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END,responded_at=now() WHERE id=i.id;
 IF p_accept THEN UPDATE public.church_memberships SET membership_status='member',personal_role='Member' WHERE id=m.id; END IF;
END; $$;

CREATE FUNCTION public.revoke_church_member_invitation(p_membership_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE m public.church_memberships%ROWTYPE;
BEGIN
 SELECT * INTO m FROM public.church_memberships WHERE id=p_membership_id FOR UPDATE;
 IF NOT FOUND OR auth.uid() IS NULL OR NOT private.can_delegate_church_role(m.church_id) THEN RAISE EXCEPTION 'Not authorized'; END IF;
 UPDATE private.church_member_invitations SET status='revoked',responded_at=now() WHERE membership_id=m.id AND status='pending';
END; $$;

REVOKE ALL ON FUNCTION public.list_church_membership_connections(uuid),public.invite_church_member(uuid),public.respond_church_member_invitation(uuid,boolean),public.revoke_church_member_invitation(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_church_membership_connections(uuid),public.invite_church_member(uuid),public.respond_church_member_invitation(uuid,boolean),public.revoke_church_member_invitation(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.review_church_role_claim_as_leader(p_claim_id uuid, p_decision text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_claim public.church_admin_claims%ROWTYPE;
  v_membership_id uuid;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_decision NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'Invalid decision'; END IF;

  SELECT * INTO v_claim
  FROM public.church_admin_claims
  WHERE id = p_claim_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Claim is not pending'; END IF;
  IF v_claim.requested_role NOT IN ('CHURCH_ADMIN','ELDER','DEACON','LEADER') THEN
    RAISE EXCEPTION 'Pastor access can only be approved by SOLAPATH App Admin after verification';
  END IF;
  IF NOT private.can_delegate_church_role(v_claim.church_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF v_claim.profile_id = v_actor THEN RAISE EXCEPTION 'Self-review is not allowed'; END IF;

  SELECT cm.id INTO v_membership_id
  FROM public.church_memberships cm
  WHERE cm.profile_id = v_claim.profile_id AND cm.church_id = v_claim.church_id
  FOR UPDATE;

  IF v_membership_id IS NULL THEN RAISE EXCEPTION 'Claimant is not a member of this church'; END IF;

  IF p_decision = 'approved' THEN
    UPDATE public.church_memberships
    SET membership_status = 'member', verified_church_role = v_claim.requested_role
    WHERE id = v_membership_id;
  END IF;

  UPDATE public.church_admin_claims
  SET status = p_decision, reviewed_at = now(), reviewed_by_profile_id = v_actor, updated_at = now()
  WHERE id = p_claim_id;

  INSERT INTO private.church_admin_audit_log (
    actor_profile_id, action, claim_id, membership_id, target_profile_id, church_id, verified_role
  )
  VALUES (
    v_actor, p_decision, v_claim.id, v_membership_id, v_claim.profile_id, v_claim.church_id, v_claim.requested_role
  );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.review_church_admin_claim(p_claim_id uuid, p_decision text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_claim public.church_admin_claims%ROWTYPE;
  v_membership_id uuid;
BEGIN
  IF v_actor IS NULL OR NOT private.is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_decision NOT IN ('approved', 'rejected') THEN RAISE EXCEPTION 'Invalid decision'; END IF;

  SELECT * INTO v_claim
  FROM public.church_admin_claims
  WHERE id = p_claim_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Claim is not pending'; END IF;
  IF v_claim.profile_id = v_actor THEN RAISE EXCEPTION 'Self-review is not allowed'; END IF;

  IF p_decision = 'approved'
     AND v_claim.requested_role = 'PASTOR'
     AND v_claim.pastor_verification_status <> 'verified' THEN
    RAISE EXCEPTION 'Pastor must be verified before approval';
  END IF;

  SELECT cm.id INTO v_membership_id
  FROM public.church_memberships cm
  WHERE cm.profile_id = v_claim.profile_id AND cm.church_id = v_claim.church_id
  FOR UPDATE;

  IF v_membership_id IS NULL THEN RAISE EXCEPTION 'Claimant is not a member of this church'; END IF;

  IF p_decision = 'approved' THEN
    UPDATE public.church_memberships
    SET membership_status = 'member', verified_church_role = v_claim.requested_role
    WHERE id = v_membership_id;
  ELSIF v_claim.requested_role = 'PASTOR' THEN
    UPDATE public.church_admin_claims
    SET pastor_verification_status = 'failed'
    WHERE id = p_claim_id;
  END IF;

  UPDATE public.church_admin_claims
  SET status = p_decision, reviewed_at = now(), reviewed_by_profile_id = v_actor, updated_at = now()
  WHERE id = p_claim_id;

  INSERT INTO private.church_admin_audit_log (
    actor_profile_id, action, claim_id, membership_id, target_profile_id, church_id, verified_role
  )
  VALUES (
    v_actor, p_decision, v_claim.id, v_membership_id, v_claim.profile_id, v_claim.church_id, v_claim.requested_role
  );
END;
$function$
;
CREATE OR REPLACE FUNCTION private.is_verified_church_leadership(check_church_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.church_memberships cm
    WHERE cm.church_id = check_church_id
      AND cm.profile_id = (SELECT auth.uid())
      AND cm.verified_church_role IN ('PASTOR','CHURCH_ADMIN','ELDER','DEACON','LEADER')
  );
$function$
;
CREATE OR REPLACE FUNCTION private.can_view_church_group(check_group_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.church_groups cg
    WHERE cg.id = check_group_id AND public.is_church_member(cg.church_id)
      AND (
        cg.leader_profile_id = (SELECT auth.uid())
        OR private.is_verified_church_leadership(cg.church_id)
        OR EXISTS (
          SELECT 1
          FROM public.church_group_memberships cgm
          WHERE cgm.group_id = cg.id
            AND cgm.profile_id = (SELECT auth.uid())
            AND cgm.status = 'joined'
        )
      )
  );
$function$
;
CREATE OR REPLACE FUNCTION public.join_church_group_by_code(p_invite_code text)
 RETURNS TABLE(group_id uuid, group_name text, church_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_group_id uuid;
  v_group_name text;
  v_church_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT cg.id, cg.name, cg.church_id
  INTO v_group_id, v_group_name, v_church_id
  FROM private.church_group_invites cgi
  JOIN public.church_groups cg ON cg.id = cgi.group_id
  WHERE cgi.invite_code = upper(btrim(p_invite_code))
  LIMIT 1;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.church_memberships cm
    WHERE cm.profile_id = v_uid
      AND cm.church_id = v_church_id AND cm.membership_status = 'member'
  ) THEN
    RAISE EXCEPTION 'You must belong to this church before joining the group';
  END IF;

  INSERT INTO public.church_group_memberships(group_id, profile_id)
  VALUES (v_group_id, v_uid)
  ON CONFLICT ON CONSTRAINT church_group_memberships_group_id_profile_id_key
  DO NOTHING;

  RETURN QUERY SELECT v_group_id, v_group_name, v_church_id;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.list_church_admin_access_for_review()
 RETURNS TABLE(membership_id uuid, profile_id uuid, member_name text, church_id uuid, church_name text, church_city text, verified_role text, granted_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT private.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    cm.id,
    cm.profile_id,
    p.display_name,
    cm.church_id,
    cp.name,
    cp.city,
    cm.verified_church_role,
    (
      SELECT c.reviewed_at
      FROM public.church_admin_claims c
      WHERE c.profile_id = cm.profile_id
        AND c.church_id = cm.church_id
        AND c.status = 'approved'
      ORDER BY c.reviewed_at DESC NULLS LAST, c.created_at DESC
      LIMIT 1
    )
  FROM public.church_memberships cm
  JOIN public.profiles p ON p.id = cm.profile_id
  JOIN public.church_profiles cp ON cp.id = cm.church_id
  WHERE cm.verified_church_role IN ('CHURCH_ADMIN', 'PASTOR', 'ELDER', 'DEACON', 'LEADER')
  ORDER BY cp.name, p.display_name NULLS LAST, cm.created_at;
END;
$function$
;
DROP POLICY IF EXISTS insert_church_admin_claims ON public.church_admin_claims;
DROP POLICY IF EXISTS insert_own_church_admin_claims ON public.church_admin_claims;
CREATE POLICY insert_own_church_admin_claims
ON public.church_admin_claims
FOR INSERT
TO authenticated
WITH CHECK (
  profile_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.church_memberships cm
    WHERE cm.church_id = church_admin_claims.church_id
      AND cm.profile_id = (SELECT auth.uid())
  )
  AND (
    (
      requested_role = 'PASTOR'
      AND pastor_verification_status = 'pending'
      AND nullif(btrim(evidence_staff_url), '') IS NOT NULL
      AND nullif(btrim(evidence_church_contact), '') IS NOT NULL
      AND coalesce(array_length(pastor_verification_checks, 1), 0) = 0
      AND pastor_verified_at IS NULL
      AND pastor_verified_by_profile_id IS NULL
    )
    OR
    (
      requested_role IN ('CHURCH_ADMIN','ELDER','DEACON','LEADER')
      AND pastor_verification_status = 'not_required'
      AND pastor_verified_at IS NULL
      AND pastor_verified_by_profile_id IS NULL
    )
  )
);


CREATE OR REPLACE FUNCTION public.list_church_role_claims_for_delegation(p_church_id uuid)
RETURNS TABLE (
  claim_id uuid,
  profile_id uuid,
  claimant_name text,
  requested_role text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT private.can_delegate_church_role(p_church_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT c.id, c.profile_id, p.display_name, c.requested_role, c.created_at
  FROM public.church_admin_claims c
  JOIN public.profiles p ON p.id = c.profile_id
  WHERE c.church_id = p_church_id
    AND c.status = 'pending'
    AND c.requested_role IN ('CHURCH_ADMIN','ELDER','DEACON','LEADER')
  ORDER BY c.created_at ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_church_role_claims_for_delegation(uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.list_church_role_claims_for_delegation(uuid)
  TO authenticated;


CREATE OR REPLACE FUNCTION private.can_perform_church_admin_action(check_church_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT private.is_verified_church_leadership(check_church_id);
$$;

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

  IF v_group.leader_profile_id IS DISTINCT FROM v_uid OR NOT public.is_church_member(v_group.church_id) THEN
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
CREATE OR REPLACE FUNCTION public.get_church_group_invite_code(p_group_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_church_id uuid;
  v_leader uuid;
  v_code text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT cg.church_id, cg.leader_profile_id
  INTO v_church_id, v_leader
  FROM public.church_groups cg
  WHERE cg.id = p_group_id;

  IF v_church_id IS NULL THEN
    RAISE EXCEPTION 'Group not found';
  END IF;

  IF NOT public.is_church_member(v_church_id) THEN RAISE EXCEPTION 'Church membership required'; END IF;

  IF v_leader IS DISTINCT FROM v_uid
     AND NOT private.is_verified_church_leadership(v_church_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT cgi.invite_code
  INTO v_code
  FROM private.church_group_invites cgi
  WHERE cgi.group_id = p_group_id;

  RETURN v_code;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.rotate_church_group_invite_code(p_group_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_church_id uuid;
  v_leader uuid;
  v_code text := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT cg.church_id, cg.leader_profile_id
  INTO v_church_id, v_leader
  FROM public.church_groups cg
  WHERE cg.id = p_group_id;

  IF v_church_id IS NULL THEN
    RAISE EXCEPTION 'Group not found';
  END IF;

  IF NOT public.is_church_member(v_church_id) THEN RAISE EXCEPTION 'Church membership required'; END IF;

  IF v_leader IS DISTINCT FROM v_uid
     AND NOT private.is_verified_church_leadership(v_church_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE private.church_group_invites
  SET invite_code = v_code,
      rotated_at = now()
  WHERE group_id = p_group_id;

  RETURN v_code;
END;
$function$
;
