/*
# Build 155 — App Owner Admin + Church/Pastor Approval Center

- Adds a private app-admin registry and replaces the production-disabled private.is_admin() helper.
- Adds owner-only RPCs for listing, approving, rejecting, and revoking verified church access.
- Extends church_admin_claims with a revoked status.
- Records privileged decisions in a private audit log.
- App-owner identity is bootstrapped operationally in production after this migration; no user UUID is committed to source control.
*/

CREATE TABLE IF NOT EXISTS private.app_admins (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('APP_OWNER', 'APP_ADMIN')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON TABLE private.app_admins FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.church_admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('approved', 'rejected', 'revoked')),
  claim_id uuid REFERENCES public.church_admin_claims(id) ON DELETE SET NULL,
  membership_id uuid REFERENCES public.church_memberships(id) ON DELETE SET NULL,
  target_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  church_id uuid REFERENCES public.church_profiles(id) ON DELETE SET NULL,
  verified_role text CHECK (verified_role IS NULL OR verified_role IN ('CHURCH_ADMIN', 'PASTOR', 'ELDER', 'LEADER')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_church_admin_audit_log_created_at
  ON private.church_admin_audit_log (created_at DESC);

REVOKE ALL ON TABLE private.church_admin_audit_log FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM private.app_admins aa
      WHERE aa.profile_id = auth.uid()
        AND aa.active = true
    );
$$;

REVOKE EXECUTE ON FUNCTION private.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_app_admin_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT aa.role
  FROM private.app_admins aa
  WHERE aa.profile_id = auth.uid()
    AND aa.active = true
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_app_admin_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_app_admin_role() TO authenticated;

CREATE OR REPLACE FUNCTION public.list_church_admin_claims_for_review(p_status text DEFAULT 'pending')
RETURNS TABLE (
  claim_id uuid,
  profile_id uuid,
  claimant_name text,
  church_id uuid,
  church_name text,
  church_city text,
  requested_role text,
  status text,
  created_at timestamptz,
  reviewed_at timestamptz
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
  SELECT c.id, c.profile_id, p.display_name, c.church_id, cp.name, cp.city,
         c.requested_role, c.status, c.created_at, c.reviewed_at
  FROM public.church_admin_claims c
  JOIN public.profiles p ON p.id = c.profile_id
  JOIN public.church_profiles cp ON cp.id = c.church_id
  WHERE p_status IS NULL OR c.status = p_status
  ORDER BY c.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_church_admin_claims_for_review(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_church_admin_claims_for_review(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_church_admin_access_for_review()
RETURNS TABLE (
  membership_id uuid,
  profile_id uuid,
  member_name text,
  church_id uuid,
  church_name text,
  church_city text,
  verified_role text,
  granted_at timestamptz
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

  RETURN QUERY
  SELECT
    cm.id, cm.profile_id, p.display_name, cm.church_id, cp.name, cp.city,
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
$$;

REVOKE EXECUTE ON FUNCTION public.list_church_admin_access_for_review() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_church_admin_access_for_review() TO authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.church_admin_claims'::regclass
      AND conname = 'church_admin_claims_status_check'
  ) THEN
    ALTER TABLE public.church_admin_claims DROP CONSTRAINT church_admin_claims_status_check;
  END IF;

  ALTER TABLE public.church_admin_claims
    ADD CONSTRAINT church_admin_claims_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn', 'revoked'));
END $$;

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
  IF v_actor IS NULL OR NOT private.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid decision';
  END IF;

  SELECT * INTO v_claim
  FROM public.church_admin_claims
  WHERE id = p_claim_id AND status = 'pending'
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Claim is not pending';
  END IF;

  IF v_claim.profile_id = v_actor THEN
    RAISE EXCEPTION 'Self-review is not allowed';
  END IF;

  SELECT cm.id INTO v_membership_id
  FROM public.church_memberships cm
  WHERE cm.profile_id = v_claim.profile_id
    AND cm.church_id = v_claim.church_id
  FOR UPDATE;
  IF v_membership_id IS NULL THEN
    RAISE EXCEPTION 'Claimant is not a member of this church';
  END IF;

  IF p_decision = 'approved' THEN
    UPDATE public.church_memberships
    SET verified_church_role = v_claim.requested_role
    WHERE id = v_membership_id;
  END IF;

  UPDATE public.church_admin_claims
  SET status = p_decision,
      reviewed_at = now(),
      reviewed_by_profile_id = v_actor
  WHERE id = p_claim_id;

  INSERT INTO private.church_admin_audit_log (
    actor_profile_id, action, claim_id, membership_id,
    target_profile_id, church_id, verified_role
  )
  VALUES (
    v_actor, p_decision, v_claim.id, v_membership_id,
    v_claim.profile_id, v_claim.church_id, v_claim.requested_role
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.review_church_admin_claim(uuid, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.review_church_admin_claim(uuid, text)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.revoke_church_admin_access(p_membership_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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

  SELECT c.id INTO v_claim_id
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
    actor_profile_id, action, claim_id, membership_id,
    target_profile_id, church_id, verified_role
  )
  VALUES (
    v_actor, 'revoked', v_claim_id, p_membership_id,
    v_profile_id, v_church_id, v_role
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.revoke_church_admin_access(uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.revoke_church_admin_access(uuid)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.list_church_admin_audit()
RETURNS TABLE (
  audit_id uuid,
  action text,
  actor_profile_id uuid,
  actor_name text,
  target_profile_id uuid,
  target_name text,
  church_id uuid,
  church_name text,
  verified_role text,
  created_at timestamptz
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

  RETURN QUERY
  SELECT a.id, a.action, a.actor_profile_id, actor.display_name,
         a.target_profile_id, target.display_name, a.church_id,
         cp.name, a.verified_role, a.created_at
  FROM private.church_admin_audit_log a
  LEFT JOIN public.profiles actor ON actor.id = a.actor_profile_id
  LEFT JOIN public.profiles target ON target.id = a.target_profile_id
  LEFT JOIN public.church_profiles cp ON cp.id = a.church_id
  ORDER BY a.created_at DESC
  LIMIT 100;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_church_admin_audit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_church_admin_audit() TO authenticated;
