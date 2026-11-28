-- Minimal relational fixture with pre-change policies/functions captured from the deployed schema.
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE SCHEMA auth; CREATE SCHEMA private;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.uid',true),'')::uuid $$;
GRANT USAGE ON SCHEMA auth,private TO authenticated;
CREATE TABLE public.profiles(id uuid PRIMARY KEY,display_name text);
CREATE TABLE public.church_profiles(id uuid PRIMARY KEY,name text,city text,website text,user_id uuid);
CREATE TABLE public.church_memberships(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),profile_id uuid NOT NULL REFERENCES profiles(id),church_id uuid NOT NULL REFERENCES church_profiles(id),personal_role text NOT NULL DEFAULT 'Regular Attender',verified_church_role text,created_at timestamptz DEFAULT now(), UNIQUE(profile_id,church_id), CONSTRAINT church_memberships_verified_church_role_check CHECK(verified_church_role IN ('PASTOR','CHURCH_ADMIN','ELDER','LEADER')));
CREATE TABLE public.church_admin_claims(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),profile_id uuid DEFAULT auth.uid(),church_id uuid,requested_role text,status text DEFAULT 'pending',created_at timestamptz DEFAULT now(),updated_at timestamptz,reviewed_at timestamptz,reviewed_by_profile_id uuid,evidence_staff_url text,evidence_church_contact text,pastor_verification_status text DEFAULT 'not_required',pastor_verification_checks text[],pastor_verification_note text,pastor_verified_at timestamptz,pastor_verified_by_profile_id uuid,CONSTRAINT church_admin_claims_requested_role_check CHECK(requested_role IN ('PASTOR','CHURCH_ADMIN','ELDER','LEADER')));
CREATE TABLE private.church_admin_audit_log(actor_profile_id uuid,action text,claim_id uuid,membership_id uuid,target_profile_id uuid,church_id uuid,verified_role text,CONSTRAINT church_admin_audit_log_verified_role_check CHECK(verified_role IN ('PASTOR','CHURCH_ADMIN','ELDER','LEADER')));
CREATE FUNCTION private.is_admin() RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
CREATE TABLE public.church_studies(id uuid PRIMARY KEY,church_id uuid,status text,title text);
CREATE TABLE public.church_study_assignments(id uuid PRIMARY KEY,church_study_id uuid);
CREATE TABLE public.church_prayer_items(id uuid PRIMARY KEY,church_id uuid,title text);
CREATE TABLE public.church_groups(id uuid PRIMARY KEY,church_id uuid,leader_profile_id uuid,name text);
CREATE TABLE public.church_group_memberships(id uuid DEFAULT gen_random_uuid(),group_id uuid,profile_id uuid,status text DEFAULT 'joined',CONSTRAINT church_group_memberships_group_id_profile_id_key UNIQUE(group_id,profile_id));
CREATE TABLE private.church_group_invites(group_id uuid,invite_code text,rotated_at timestamptz);
CREATE TABLE public.group_discussions(id uuid PRIMARY KEY,group_id uuid,user_id uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
REVOKE INSERT,UPDATE ON public.church_memberships FROM authenticated;
GRANT INSERT(profile_id,church_id,personal_role),UPDATE(personal_role) ON public.church_memberships TO authenticated;
REVOKE INSERT,UPDATE ON public.church_group_memberships FROM authenticated;
CREATE OR REPLACE FUNCTION public.revoke_church_admin_access(p_membership_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_profile_id uuid;
  v_church_id uuid;
  v_role text;
  v_claim_id uuid;
BEGIN
  IF v_actor IS NULL OR NOT private.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT cm.profile_id, cm.church_id, cm.verified_church_role
  INTO v_profile_id, v_church_id, v_role
  FROM public.church_memberships cm
  WHERE cm.id = p_membership_id
  FOR UPDATE;

  IF NOT FOUND OR v_role IS NULL THEN
    RAISE EXCEPTION 'Verified access not found';
  END IF;

  UPDATE public.church_memberships
  SET verified_church_role = NULL
  WHERE id = p_membership_id;

  SELECT c.id
  INTO v_claim_id
  FROM public.church_admin_claims c
  WHERE c.profile_id = v_profile_id
    AND c.church_id = v_church_id
    AND c.status = 'approved'
  ORDER BY c.reviewed_at DESC NULLS LAST, c.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_claim_id IS NOT NULL THEN
    UPDATE public.church_admin_claims
    SET status = 'revoked',
        reviewed_at = now(),
        reviewed_by_profile_id = v_actor
    WHERE id = v_claim_id;
  END IF;

  INSERT INTO private.church_admin_audit_log (
    actor_profile_id,
    action,
    claim_id,
    membership_id,
    target_profile_id,
    church_id,
    verified_role
  )
  VALUES (
    v_actor,
    'revoked',
    v_claim_id,
    p_membership_id,
    v_profile_id,
    v_church_id,
    v_role
  );
END;
$function$
;
CREATE OR REPLACE FUNCTION private.can_perform_church_admin_action(check_church_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.church_profiles cp
      WHERE cp.id = check_church_id
        AND cp.user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.church_memberships cm
      WHERE cm.church_id = check_church_id
        AND cm.profile_id = (SELECT auth.uid())
        AND cm.verified_church_role IN ('CHURCH_ADMIN','PASTOR','ELDER','LEADER')
    );
$function$
;
CREATE OR REPLACE FUNCTION private.can_delegate_church_role(check_church_id uuid)
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
      AND cm.verified_church_role IN ('PASTOR','CHURCH_ADMIN')
  );
$function$
;
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
  IF v_claim.requested_role NOT IN ('CHURCH_ADMIN','ELDER','LEADER') THEN
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
    SET verified_church_role = v_claim.requested_role
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
    SET verified_church_role = v_claim.requested_role
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
      AND cm.verified_church_role IN ('PASTOR','CHURCH_ADMIN','ELDER','LEADER')
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
    WHERE cg.id = check_group_id
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
      AND cm.church_id = v_church_id
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
CREATE OR REPLACE FUNCTION public.is_verified_church_publisher(p_church_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.church_memberships cm
    WHERE cm.church_id = p_church_id
      AND cm.profile_id = (SELECT auth.uid())
      AND cm.verified_church_role = 'PASTOR'
  );
$function$
;
CREATE OR REPLACE FUNCTION public.is_church_member(p_church_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
SELECT EXISTS (
SELECT 1 FROM public.church_memberships cm
WHERE cm.church_id = p_church_id AND cm.profile_id = auth.uid()
);
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
  WHERE cm.verified_church_role IN ('CHURCH_ADMIN', 'PASTOR', 'ELDER', 'LEADER')
  ORDER BY cp.name, p.display_name NULLS LAST, cm.created_at;
END;
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

  IF v_group.leader_profile_id IS DISTINCT FROM v_uid THEN
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
ALTER TABLE public.church_admin_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_prayer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_study_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY insert_own_church_admin_claims ON public.church_admin_claims AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((profile_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM church_memberships cm
  WHERE ((cm.church_id = church_admin_claims.church_id) AND (cm.profile_id = ( SELECT auth.uid() AS uid))))) AND (((requested_role = 'PASTOR'::text) AND (pastor_verification_status = 'pending'::text) AND (NULLIF(btrim(evidence_staff_url), ''::text) IS NOT NULL) AND (NULLIF(btrim(evidence_church_contact), ''::text) IS NOT NULL) AND (COALESCE(array_length(pastor_verification_checks, 1), 0) = 0) AND (pastor_verified_at IS NULL) AND (pastor_verified_by_profile_id IS NULL)) OR ((requested_role = ANY (ARRAY['CHURCH_ADMIN'::text, 'ELDER'::text, 'LEADER'::text])) AND (pastor_verification_status = 'not_required'::text) AND (pastor_verified_at IS NULL) AND (pastor_verified_by_profile_id IS NULL)))));
CREATE POLICY select_own_church_admin_claims ON public.church_admin_claims AS PERMISSIVE FOR SELECT TO authenticated USING ((profile_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY withdraw_own_pending_church_admin_claims ON public.church_admin_claims AS PERMISSIVE FOR UPDATE TO authenticated USING (((profile_id = ( SELECT auth.uid() AS uid)) AND (status = 'pending'::text))) WITH CHECK (((profile_id = ( SELECT auth.uid() AS uid)) AND (status = 'withdrawn'::text)));
CREATE POLICY delete_own_church_group_memberships ON public.church_group_memberships AS PERMISSIVE FOR DELETE TO authenticated USING ((profile_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY select_church_group_memberships ON public.church_group_memberships AS PERMISSIVE FOR SELECT TO authenticated USING ((profile_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY delete_owned_church_groups ON public.church_groups AS PERMISSIVE FOR DELETE TO authenticated USING ((leader_profile_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY insert_church_groups ON public.church_groups AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((private.is_verified_church_leadership(church_id) AND (leader_profile_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY select_church_groups ON public.church_groups AS PERMISSIVE FOR SELECT TO authenticated USING (((leader_profile_id = ( SELECT auth.uid() AS uid)) OR private.is_verified_church_leadership(church_id) OR (EXISTS ( SELECT 1
   FROM church_group_memberships cgm
  WHERE ((cgm.group_id = church_groups.id) AND (cgm.profile_id = ( SELECT auth.uid() AS uid)) AND (cgm.status = 'joined'::text))))));
CREATE POLICY update_church_groups ON public.church_groups AS PERMISSIVE FOR UPDATE TO authenticated USING (private.is_verified_church_leadership(church_id)) WITH CHECK (private.is_verified_church_leadership(church_id));
CREATE POLICY delete_own_church_memberships ON public.church_memberships AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = profile_id));
CREATE POLICY insert_church_memberships ON public.church_memberships AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = profile_id));
CREATE POLICY insert_own_church_memberships ON public.church_memberships AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = profile_id));
CREATE POLICY select_own_church_memberships ON public.church_memberships AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = profile_id));
CREATE POLICY update_church_memberships ON public.church_memberships AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = profile_id)) WITH CHECK (((auth.uid() = profile_id) AND (NOT (verified_church_role IS DISTINCT FROM ( SELECT cm_old.verified_church_role
   FROM church_memberships cm_old
  WHERE (cm_old.id = church_memberships.id))))));
CREATE POLICY delete_church_prayer_items ON public.church_prayer_items AS PERMISSIVE FOR DELETE TO authenticated USING (private.can_perform_church_admin_action(church_id));
CREATE POLICY insert_church_prayer_items ON public.church_prayer_items AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (private.can_perform_church_admin_action(church_id));
CREATE POLICY select_church_prayer_items ON public.church_prayer_items AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM church_memberships cm
  WHERE ((cm.church_id = church_prayer_items.church_id) AND (cm.profile_id = auth.uid())))));
CREATE POLICY update_church_prayer_items ON public.church_prayer_items AS PERMISSIVE FOR UPDATE TO authenticated USING (private.can_perform_church_admin_action(church_id)) WITH CHECK (private.can_perform_church_admin_action(church_id));
CREATE POLICY insert_church_studies ON public.church_studies AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (is_verified_church_publisher(church_id));
CREATE POLICY select_church_studies ON public.church_studies AS PERMISSIVE FOR SELECT TO authenticated USING ((is_verified_church_publisher(church_id) OR ((status = 'published'::text) AND is_church_member(church_id))));
CREATE POLICY update_church_studies ON public.church_studies AS PERMISSIVE FOR UPDATE TO authenticated USING (is_verified_church_publisher(church_id)) WITH CHECK (is_verified_church_publisher(church_id));
CREATE POLICY delete_church_study_assignments ON public.church_study_assignments AS PERMISSIVE FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM church_studies cs
  WHERE ((cs.id = church_study_assignments.church_study_id) AND is_verified_church_publisher(cs.church_id)))));
CREATE POLICY insert_church_study_assignments ON public.church_study_assignments AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM church_studies cs
  WHERE ((cs.id = church_study_assignments.church_study_id) AND is_verified_church_publisher(cs.church_id)))));
CREATE POLICY select_church_study_assignments ON public.church_study_assignments AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM church_studies cs
  WHERE ((cs.id = church_study_assignments.church_study_id) AND (is_verified_church_publisher(cs.church_id) OR ((cs.status = 'published'::text) AND is_church_member(cs.church_id)))))));
CREATE POLICY update_church_study_assignments ON public.church_study_assignments AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM church_studies cs
  WHERE ((cs.id = church_study_assignments.church_study_id) AND is_verified_church_publisher(cs.church_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM church_studies cs
  WHERE ((cs.id = church_study_assignments.church_study_id) AND is_verified_church_publisher(cs.church_id)))));
CREATE POLICY delete_own_visible_group_discussions ON public.group_discussions AS PERMISSIVE FOR DELETE TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) AND private.can_view_church_group(group_id)));
CREATE POLICY insert_visible_group_discussions ON public.group_discussions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND private.can_view_church_group(group_id)));
CREATE POLICY select_visible_group_discussions ON public.group_discussions AS PERMISSIVE FOR SELECT TO authenticated USING (private.can_view_church_group(group_id));
CREATE POLICY update_own_visible_group_discussions ON public.group_discussions AS PERMISSIVE FOR UPDATE TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) AND private.can_view_church_group(group_id))) WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND private.can_view_church_group(group_id)));
