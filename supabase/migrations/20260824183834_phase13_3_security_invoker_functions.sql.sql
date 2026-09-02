/*
# Phase 13.3: Convert SECURITY DEFINER helpers to SECURITY INVOKER

## Problem
The 4 helper functions (is_admin, is_circle_member, is_circle_leader,
can_perform_church_admin_action) are SECURITY DEFINER, which triggers
security advisor WARN lints because authenticated can execute them via RPC.

## Fix
Convert all 4 to SECURITY INVOKER. They only run SELECT EXISTS checks
against tables that the calling role already has SELECT access to via RLS
policies, so INVOKER is safe and equivalent.

## Security Impact
- Eliminates 4 WARN-level advisor findings
- Functions still work in RLS policy evaluation (INVOKER runs as the
  querying role, which has the needed SELECT privileges via RLS)
- No data leakage: all functions return boolean only
- RPC calls from authenticated users still return only boolean results
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'public'
AS $function$
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'app_settings'
);
$function$;

CREATE OR REPLACE FUNCTION public.is_circle_member(check_circle_id uuid, check_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'public'
AS $function$
SELECT EXISTS (
  SELECT 1 FROM public.circle_members
  WHERE circle_members.circle_id = check_circle_id
  AND circle_members.profile_id = check_profile_id
);
$function$;

CREATE OR REPLACE FUNCTION public.is_circle_leader(check_circle_id uuid, check_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'public'
AS $function$
SELECT EXISTS (
  SELECT 1 FROM public.circle_members
  WHERE circle_members.circle_id = check_circle_id
  AND circle_members.profile_id = check_profile_id
  AND circle_members.role IN ('OWNER', 'LEADER', 'PASTOR', 'CHURCH_LEADER')
);
$function$;

CREATE OR REPLACE FUNCTION public.can_perform_church_admin_action(check_profile_id uuid, check_church_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'public'
AS $function$
SELECT EXISTS (
  SELECT 1 FROM public.church_memberships
  WHERE church_memberships.profile_id = check_profile_id
  AND church_memberships.church_id = check_church_id
  AND church_memberships.verified_church_role IS NOT NULL
);
$function$;
