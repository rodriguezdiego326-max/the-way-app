/*
# Phase 13.4: Secure RLS Helpers in Private Schema

## Blockers Fixed

### BLOCKER 1: Broken is_admin()
The public.is_admin() function checked if app_settings table exists in
information_schema — which is always true. This made every authenticated
user an admin. There is no real admin authority source in the database
(no admin table, no role column, no admin claim in app_metadata).

Fix: private.is_admin() returns FALSE for all users until a real admin
authorization model is implemented. This fails closed.

### BLOCKER 2: RLS Recursion
public.is_circle_member() and public.is_circle_leader() were SECURITY INVOKER
and queried public.circle_members. RLS policies on circle_members call
is_circle_member(), creating circular evaluation:
  circle_members RLS -> is_circle_member -> circle_members -> RLS

Fix: Move helpers to a non-exposed `private` schema with SECURITY DEFINER.
SECURITY DEFINER runs as the function owner (postgres), bypassing RLS on
circle_members, breaking the recursion.

## Changes
1. Create `private` schema (NOT exposed via PostgREST)
2. Create hardened helpers in private schema:
   - private.is_admin() — returns FALSE (no admin model exists)
   - private.is_circle_member(circle_id uuid) — uses auth.uid() internally
   - private.is_circle_leader(circle_id uuid) — uses auth.uid() internally
   - private.can_perform_church_admin_action(church_id uuid) — uses auth.uid()
3. All helpers: SECURITY DEFINER, search_path = '', schema-qualified relations
4. Grant EXECUTE to authenticated only (needed for RLS evaluation)
5. Update all RLS policies to call private.* helpers
6. Drop old public.* helper functions
*/

-- =========================================================
-- STEP 1: Create private schema (NOT exposed via PostgREST)
-- =========================================================
CREATE SCHEMA IF NOT EXISTS private;

-- =========================================================
-- STEP 2: Create hardened helpers in private schema
-- =========================================================

-- private.is_admin() — FAILS CLOSED
-- No admin authority source exists in the database.
-- Returns FALSE for all users until a real admin model is implemented.
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT false::boolean;
$function$;

-- private.is_circle_member(circle_id uuid)
-- Derives identity from auth.uid() — does NOT accept a profile_id argument.
-- SECURITY DEFINER bypasses RLS on circle_members, preventing recursion.
CREATE OR REPLACE FUNCTION private.is_circle_member(check_circle_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE public.circle_members.circle_id = check_circle_id
    AND public.circle_members.profile_id = (select auth.uid())
  );
$function$;

-- private.is_circle_leader(circle_id uuid)
-- Derives identity from auth.uid() internally.
CREATE OR REPLACE FUNCTION private.is_circle_leader(check_circle_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE public.circle_members.circle_id = check_circle_id
    AND public.circle_members.profile_id = (select auth.uid())
    AND public.circle_members.role IN ('OWNER', 'LEADER', 'PASTOR', 'CHURCH_LEADER')
  );
$function$;

-- private.can_perform_church_admin_action(church_id uuid)
-- Derives identity from auth.uid() internally.
CREATE OR REPLACE FUNCTION private.can_perform_church_admin_action(check_church_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.church_memberships
    WHERE public.church_memberships.profile_id = (select auth.uid())
    AND public.church_memberships.church_id = check_church_id
    AND public.church_memberships.verified_church_role IS NOT NULL
  );
$function$;

-- =========================================================
-- STEP 3: Grant EXECUTE to authenticated only
-- =========================================================
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_circle_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_circle_leader(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_perform_church_admin_action(uuid) TO authenticated;

-- Revoke from anon and PUBLIC
REVOKE EXECUTE ON FUNCTION private.is_admin() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION private.is_circle_member(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION private.is_circle_leader(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION private.can_perform_church_admin_action(uuid) FROM anon, PUBLIC;

-- =========================================================
-- STEP 4: Update all RLS policies to use private.* helpers
-- =========================================================

-- Drop and recreate policies that called public helpers

-- circles: SELECT uses is_circle_member
DROP POLICY IF EXISTS "select_own_circles" ON circles;
CREATE POLICY "select_own_circles" ON circles FOR SELECT
  TO authenticated USING (auth.uid() = owner_profile_id OR private.is_circle_member(id));

-- circle_members: SELECT uses is_circle_member, DELETE uses is_circle_leader
DROP POLICY IF EXISTS "select_circle_members" ON circle_members;
CREATE POLICY "select_circle_members" ON circle_members FOR SELECT
  TO authenticated USING (auth.uid() = profile_id OR private.is_circle_member(circle_id));

DROP POLICY IF EXISTS "delete_circle_members" ON circle_members;
CREATE POLICY "delete_circle_members" ON circle_members FOR DELETE
  TO authenticated USING (auth.uid() = profile_id OR private.is_circle_leader(circle_id));

-- circle_invitations: SELECT and DELETE use is_circle_leader
DROP POLICY IF EXISTS "select_circle_invitations" ON circle_invitations;
CREATE POLICY "select_circle_invitations" ON circle_invitations FOR SELECT
  TO authenticated USING (auth.uid() = invited_by_profile_id OR auth.uid() = accepted_by_profile_id OR private.is_circle_leader(circle_id));

DROP POLICY IF EXISTS "delete_circle_invitations" ON circle_invitations;
CREATE POLICY "delete_circle_invitations" ON circle_invitations FOR DELETE
  TO authenticated USING (auth.uid() = invited_by_profile_id OR private.is_circle_leader(circle_id));

-- shared_prayers: SELECT uses is_circle_member
DROP POLICY IF EXISTS "select_shared_prayers" ON shared_prayers;
CREATE POLICY "select_shared_prayers" ON shared_prayers FOR SELECT
  TO authenticated USING (auth.uid() = profile_id OR private.is_circle_member(circle_id));

-- shared_reflections: SELECT uses is_circle_member
DROP POLICY IF EXISTS "select_shared_reflections" ON shared_reflections;
CREATE POLICY "select_shared_reflections" ON shared_reflections FOR SELECT
  TO authenticated USING (auth.uid() = profile_id OR private.is_circle_member(circle_id));

-- shared_scripture_studies: SELECT uses is_circle_member
DROP POLICY IF EXISTS "select_shared_scripture_studies" ON shared_scripture_studies;
CREATE POLICY "select_shared_scripture_studies" ON shared_scripture_studies FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR private.is_circle_member(circle_id));

-- app_settings: UPDATE uses is_admin
DROP POLICY IF EXISTS "update_app_settings" ON app_settings;
CREATE POLICY "update_app_settings" ON app_settings FOR UPDATE
  TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

-- feature_flags: UPDATE uses is_admin
DROP POLICY IF EXISTS "update_feature_flags" ON feature_flags;
CREATE POLICY "update_feature_flags" ON feature_flags FOR UPDATE
  TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

-- admin-only SELECT tables
DROP POLICY IF EXISTS "select_admin_audit_trail" ON audit_trail;
CREATE POLICY "select_admin_audit_trail" ON audit_trail FOR SELECT
  TO authenticated USING (private.is_admin());

DROP POLICY IF EXISTS "select_admin_regression_tests" ON regression_tests;
CREATE POLICY "select_admin_regression_tests" ON regression_tests FOR SELECT
  TO authenticated USING (private.is_admin());

DROP POLICY IF EXISTS "select_admin_release_gate" ON release_gate;
CREATE POLICY "select_admin_release_gate" ON release_gate FOR SELECT
  TO authenticated USING (private.is_admin());

DROP POLICY IF EXISTS "select_admin_retrieval_log" ON retrieval_log;
CREATE POLICY "select_admin_retrieval_log" ON retrieval_log FOR SELECT
  TO authenticated USING (private.is_admin());

DROP POLICY IF EXISTS "select_admin_system_versions" ON system_versions;
CREATE POLICY "select_admin_system_versions" ON system_versions FOR SELECT
  TO authenticated USING (private.is_admin());

DROP POLICY IF EXISTS "select_admin_theological_reviews" ON theological_reviews;
CREATE POLICY "select_admin_theological_reviews" ON theological_reviews FOR SELECT
  TO authenticated USING (private.is_admin());

-- =========================================================
-- STEP 5: Drop old public helper functions
-- =========================================================
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_circle_member(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_circle_leader(uuid, uuid);
DROP FUNCTION IF EXISTS public.can_perform_church_admin_action(uuid, uuid);
