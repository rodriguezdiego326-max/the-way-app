/*
# Build 158 — Verified Pastor + Delegated Church Leadership

Pastor access requires two app-admin verification checks before approval:
1. Official church staff/pastor source confirms the identity and role.
2. The church independently confirms the identity/role through an official contact channel.

Verified Pastors and Church Admins may approve Church Admin, Elder, and Leader access
for their own church. Pastor access can never be delegated by church leadership.

Verified Church Admin, Pastor, Elder, and Leader roles may manage church prayer and
create/update church small groups. Normal membership or a self-selected title does not
grant these permissions.
*/

ALTER TABLE public.church_admin_claims
  ADD COLUMN IF NOT EXISTS evidence_staff_url text,
  ADD COLUMN IF NOT EXISTS evidence_church_contact text,
  ADD COLUMN IF NOT EXISTS pastor_verification_status text NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS pastor_verification_checks text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS pastor_verification_note text,
  ADD COLUMN IF NOT EXISTS pastor_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS pastor_verified_by_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

UPDATE public.church_admin_claims
SET pastor_verification_status = CASE
  WHEN requested_role = 'PASTOR' AND status = 'approved' THEN 'verified'
  WHEN requested_role = 'PASTOR' THEN 'pending'
  ELSE 'not_required'
END
WHERE pastor_verification_status = 'not_required'
  AND requested_role = 'PASTOR';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.church_admin_claims'::regclass
      AND conname='church_admin_claims_pastor_verification_status_check'
  ) THEN
    ALTER TABLE public.church_admin_claims
      DROP CONSTRAINT church_admin_claims_pastor_verification_status_check;
  END IF;

  ALTER TABLE public.church_admin_claims
    ADD CONSTRAINT church_admin_claims_pastor_verification_status_check
    CHECK (pastor_verification_status IN ('not_required','pending','verified','failed'));
END $$;

CREATE INDEX IF NOT EXISTS idx_church_admin_claims_pastor_verification
  ON public.church_admin_claims (requested_role, pastor_verification_status)
  WHERE requested_role = 'PASTOR';

CREATE OR REPLACE FUNCTION private.can_perform_church_admin_action(check_church_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION private.can_delegate_church_role(check_church_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.church_memberships cm
    WHERE cm.church_id = check_church_id
      AND cm.profile_id = (SELECT auth.uid())
      AND cm.verified_church_role IN ('PASTOR','CHURCH_ADMIN')
  );
$$;

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
      requested_role IN ('CHURCH_ADMIN','ELDER','LEADER')
      AND pastor_verification_status = 'not_required'
      AND pastor_verified_at IS NULL
      AND pastor_verified_by_profile_id IS NULL
    )
  )
);

DROP POLICY IF EXISTS insert_church_groups ON public.church_groups;
CREATE POLICY insert_church_groups
ON public.church_groups
FOR INSERT
TO authenticated
WITH CHECK (
  private.can_perform_church_admin_action(church_id)
  AND leader_profile_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS update_church_groups ON public.church_groups;
CREATE POLICY update_church_groups
ON public.church_groups
FOR UPDATE
TO authenticated
USING (private.can_perform_church_admin_action(church_id))
WITH CHECK (private.can_perform_church_admin_action(church_id));

DROP FUNCTION IF EXISTS public.list_church_admin_claims_for_review(text);

CREATE FUNCTION public.list_church_admin_claims_for_review(p_status text DEFAULT 'pending')
RETURNS TABLE (
  claim_id uuid,
  profile_id uuid,
  claimant_name text,
  church_id uuid,
  church_name text,
  church_city text,
  church_website text,
  requested_role text,
  status text,
  created_at timestamptz,
  reviewed_at timestamptz,
  evidence_staff_url text,
  evidence_church_contact text,
  pastor_verification_status text,
  pastor_verification_checks text[],
  pastor_verification_note text,
  pastor_verified_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT private.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_status IS NOT NULL
     AND p_status NOT IN ('pending', 'approved', 'rejected', 'withdrawn', 'revoked') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  RETURN QUERY
  SELECT
    c.id, c.profile_id, p.display_name, c.church_id, cp.name, cp.city, cp.website,
    c.requested_role, c.status, c.created_at, c.reviewed_at,
    c.evidence_staff_url, c.evidence_church_contact,
    c.pastor_verification_status, c.pastor_verification_checks,
    c.pastor_verification_note, c.pastor_verified_at
  FROM public.church_admin_claims c
  JOIN public.profiles p ON p.id = c.profile_id
  JOIN public.church_profiles cp ON cp.id = c.church_id
  WHERE p_status IS NULL OR c.status = p_status
  ORDER BY CASE WHEN c.requested_role = 'PASTOR' THEN 0 ELSE 1 END, c.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_church_admin_claims_for_review(text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.list_church_admin_claims_for_review(text)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.verify_pastor_claim(
  p_claim_id uuid,
  p_staff_page_confirmed boolean,
  p_direct_church_confirmation boolean,
  p_note text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_claim public.church_admin_claims%ROWTYPE;
BEGIN
  IF v_actor IS NULL OR NOT private.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_claim
  FROM public.church_admin_claims
  WHERE id = p_claim_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Claim is not pending'; END IF;
  IF v_claim.requested_role <> 'PASTOR' THEN
    RAISE EXCEPTION 'Only pastor claims use pastor verification';
  END IF;
  IF nullif(btrim(v_claim.evidence_staff_url), '') IS NULL
     OR nullif(btrim(v_claim.evidence_church_contact), '') IS NULL THEN
    RAISE EXCEPTION 'Pastor evidence is incomplete';
  END IF;
  IF p_staff_page_confirmed IS NOT TRUE OR p_direct_church_confirmation IS NOT TRUE THEN
    RAISE EXCEPTION 'Both pastor verification checks are required';
  END IF;
  IF nullif(btrim(p_note), '') IS NULL THEN
    RAISE EXCEPTION 'Verification note is required';
  END IF;

  UPDATE public.church_admin_claims
  SET pastor_verification_status = 'verified',
      pastor_verification_checks = ARRAY['OFFICIAL_STAFF_PAGE_CONFIRMED','DIRECT_CHURCH_CONFIRMATION'],
      pastor_verification_note = btrim(p_note),
      pastor_verified_at = now(),
      pastor_verified_by_profile_id = v_actor,
      updated_at = now()
  WHERE id = p_claim_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_pastor_claim(uuid, boolean, boolean, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.verify_pastor_claim(uuid, boolean, boolean, text)
  TO authenticated;

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
    AND c.requested_role IN ('CHURCH_ADMIN','ELDER','LEADER')
  ORDER BY c.created_at ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_church_role_claims_for_delegation(uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.list_church_role_claims_for_delegation(uuid)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.review_church_role_claim_as_leader(
  p_claim_id uuid,
  p_decision text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

REVOKE EXECUTE ON FUNCTION public.review_church_role_claim_as_leader(uuid, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.review_church_role_claim_as_leader(uuid, text)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.review_church_admin_claim(p_claim_id uuid, p_decision text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

REVOKE EXECUTE ON FUNCTION public.review_church_admin_claim(uuid, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.review_church_admin_claim(uuid, text)
  TO authenticated;
