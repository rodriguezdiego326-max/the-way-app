-- Phase 15.3: Harden church_prayer_items INSERT authorization
--
-- PROBLEM: The INSERT policy allowed ANY church member to insert church-managed
-- prayer items. UI restrictions are not authorization — a normal member could
-- bypass the UI and insert directly via Supabase.
--
-- FIX:
-- 1. Expand private.can_perform_church_admin_action to also return true for
--    church owners (church_profiles.user_id = auth.uid()), not just members
--    with a verified_church_role.
-- 2. Replace the INSERT policy on church_prayer_items to require either church
--    ownership OR a verified church leadership role.
-- 3. Leave SELECT/UPDATE/DELETE policies unchanged — members can still read
--    church prayer items.

-- ============================================================
-- 1. Expand the hardened helper to include church owners
-- ============================================================

CREATE OR REPLACE FUNCTION private.can_perform_church_admin_action(check_church_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  -- Church owner (created the church profile)
  SELECT EXISTS (
    SELECT 1 FROM public.church_profiles
    WHERE public.church_profiles.id = check_church_id
      AND public.church_profiles.user_id = (SELECT auth.uid())
  )
  OR
  -- Verified church leader (pastor, elder, admin, etc.)
  EXISTS (
    SELECT 1 FROM public.church_memberships
    WHERE public.church_memberships.profile_id = (SELECT auth.uid())
      AND public.church_memberships.church_id = check_church_id
      AND public.church_memberships.verified_church_role IS NOT NULL
  )
$function$;

-- Ensure authenticated role can still execute
GRANT EXECUTE ON FUNCTION private.can_perform_church_admin_action(uuid) TO authenticated;

-- ============================================================
-- 2. Replace INSERT policy on church_prayer_items
-- ============================================================

DROP POLICY IF EXISTS insert_church_prayer_items ON public.church_prayer_items;

CREATE POLICY insert_church_prayer_items ON public.church_prayer_items
  FOR INSERT TO authenticated
  WITH CHECK (private.can_perform_church_admin_action(church_id));
