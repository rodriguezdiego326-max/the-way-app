/*
# Phase 13.2: Fix function EXECUTE privileges for RLS policy evaluation

## Problem
Phase 13.1 revoked EXECUTE on all 4 SECURITY DEFINER helper functions from
anon, authenticated, and PUBLIC. However, RLS policies on circles, 
circle_members, circle_invitations, shared_prayers, shared_reflections,
shared_scripture_studies, app_settings, feature_flags, and admin tables
call these functions (is_circle_member, is_circle_leader, is_admin,
can_perform_church_admin_action) as part of their USING/WITH CHECK expressions.

When an authenticated user queries these tables, PostgreSQL evaluates the
RLS policy as the authenticated role, which requires EXECUTE privilege on
the called functions. Without it, queries fail with "permission denied
for function".

## Fix
Grant EXECUTE on the 4 helper functions to authenticated ONLY.
Do NOT grant to anon or PUBLIC.

## Security Impact
- authenticated users can now execute these functions, but:
  - is_circle_member/check_circle_id, check_profile_id: only checks if the
    given profile_id is a member of the given circle. A user could call this
    via RPC with arbitrary IDs, but the function only returns a boolean —
    it does not return any private data.
  - is_circle_leader: same — boolean only, no data leakage.
  - is_admin: checks if app_settings table exists (always true) — this is
    a weak admin check but does not leak data.
  - can_perform_church_admin_action: checks church_memberships for a given
    profile_id + church_id — boolean only, no data leakage.
- anon still has NO execute on any function.
- PUBLIC still has NO execute.
*/

GRANT EXECUTE ON FUNCTION is_circle_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_circle_leader(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION can_perform_church_admin_action(uuid, uuid) TO authenticated;
