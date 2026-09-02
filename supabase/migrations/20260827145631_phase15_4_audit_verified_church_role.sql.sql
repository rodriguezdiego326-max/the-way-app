-- Phase 15.4: Audit and harden verified_church_role authorization
--
-- PROBLEM 1: verified_church_role is unconstrained text — any non-null string
-- passes the IS NOT NULL check in can_perform_church_admin_action.
--
-- PROBLEM 2: The UPDATE policy on church_memberships allows users to update
-- their own row, meaning they could self-assign verified_church_role to any
-- value and gain admin privileges — bypassing the "verified" intent entirely.
--
-- PROBLEM 3: The UI for Church Prayer creation only checks isChurchOwner (owner
-- only), but the RLS allows owner OR any non-null verified_church_role. This
-- is an authorization mismatch.
--
-- FIX:
-- 1. Add a CHECK constraint on verified_church_role to an explicit allowlist
--    of trusted administrative roles (or NULL).
-- 2. Tighten the UPDATE policy on church_memberships to prevent users from
--    modifying verified_church_role themselves — only allow updating other
--    columns (personal_role).
-- 3. Narrow can_perform_church_admin_action to OWNER ONLY for church prayer
--    creation, matching the UI. The verified-leader branch is removed until
--    a proper approval workflow exists.
-- 4. Preserve all other RLS policies.

-- ============================================================
-- 1. Add CHECK constraint on verified_church_role
-- ============================================================

ALTER TABLE public.church_memberships
  DROP CONSTRAINT IF EXISTS church_memberships_verified_church_role_check;

ALTER TABLE public.church_memberships
  ADD CONSTRAINT church_memberships_verified_church_role_check
  CHECK (
    verified_church_role IS NULL
    OR verified_church_role IN ('CHURCH_ADMIN', 'PASTOR', 'ELDER', 'LEADER')
  );

-- ============================================================
-- 2. Tighten UPDATE policy on church_memberships
--    Users can update their own personal_role but NOT verified_church_role.
-- ============================================================

DROP POLICY IF EXISTS update_church_memberships ON public.church_memberships;
DROP POLICY IF EXISTS update_own_church_memberships ON public.church_memberships;

-- Allow users to update their own row, but only personal_role — not verified_church_role.
-- The WITH CHECK ensures verified_church_role cannot be changed by the user.
CREATE POLICY update_church_memberships ON public.church_memberships
  FOR UPDATE TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (
    auth.uid() = profile_id
    AND (
      -- verified_church_role must be unchanged (old value = new value)
      verified_church_role IS NOT DISTINCT FROM (
        SELECT cm_old.verified_church_role FROM public.church_memberships cm_old
        WHERE cm_old.id = church_memberships.id
      )
    )
  );

-- ============================================================
-- 3. Narrow can_perform_church_admin_action to OWNER ONLY
--    The verified-leader branch is removed until a proper approval
--    workflow exists. This matches the current UI (isChurchOwner only).
-- ============================================================

CREATE OR REPLACE FUNCTION private.can_perform_church_admin_action(check_church_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  -- Church owner only (created the church profile)
  SELECT EXISTS (
    SELECT 1 FROM public.church_profiles
    WHERE public.church_profiles.id = check_church_id
      AND public.church_profiles.user_id = (SELECT auth.uid())
  )
$function$;

-- Ensure authenticated role can still execute
GRANT EXECUTE ON FUNCTION private.can_perform_church_admin_action(uuid) TO authenticated;
