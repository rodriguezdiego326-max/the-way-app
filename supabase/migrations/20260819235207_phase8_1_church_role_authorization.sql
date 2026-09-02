/*
# Phase 8.1 — Church Role Authorization

## Purpose
Creates a SECURITY DEFINER function that enforces verified church role
authorization for privileged church operations. This is the backend
authorization boundary that prevents self-selected personal roles
(e.g., "Pastor") from granting administrative privileges.

## New Database Objects
1. `can_perform_church_admin_action(profile_id uuid, church_id uuid)` — SECURITY DEFINER function
   that returns true only when the user has a non-null `verified_church_role`
   in `church_memberships` for the given church. Self-selected `personal_role`
   (e.g., "Pastor") does NOT satisfy this check.

## Security
- SECURITY DEFINER so it runs with elevated privileges
- Stable, read-only
- Checks `verified_church_role IS NOT NULL` — only approved roles pass
- `personal_role` is explicitly NOT checked — it is user-mutable and self-selected

## Important Notes
1. This function is the canonical backend authorization for privileged church operations
2. A user selecting "Pastor" as personal_role gets NO privileges
3. Only a verified_church_role (set through a separate approval process) grants access
4. The function is stable and can be used in policies or application-level checks
*/

CREATE OR REPLACE FUNCTION can_perform_church_admin_action(check_profile_id uuid, check_church_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM church_memberships
    WHERE church_memberships.profile_id = check_profile_id
    AND church_memberships.church_id = check_church_id
    AND church_memberships.verified_church_role IS NOT NULL
  );
$$;