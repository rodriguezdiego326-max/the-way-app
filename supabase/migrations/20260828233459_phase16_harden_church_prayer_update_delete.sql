/*
# Harden church_prayer_items UPDATE and DELETE policies to owner-only

## Problem
The existing UPDATE and DELETE policies on church_prayer_items allow ANY
church member to edit or delete church prayer items. Only the church owner
(or a verified church leader) should be able to modify or remove these items.

## Changes
1. DROP the existing permissive UPDATE policy.
2. CREATE a new UPDATE policy requiring private.can_perform_church_admin_action(church_id).
3. DROP the existing permissive DELETE policy.
4. CREATE a new DELETE policy requiring private.can_perform_church_admin_action(church_id).
5. SELECT and INSERT policies remain unchanged — members can still read,
   and only owners/verified leaders can insert.

## Security
- UPDATE: restricted to church owners + verified church leaders via
  private.can_perform_church_admin_action().
- DELETE: restricted to church owners + verified church leaders via
  private.can_perform_church_admin_action().
- Normal members: can SELECT only, cannot UPDATE or DELETE.
- Non-members: blocked by SELECT policy (cannot even read).
- Anon: blocked (no policy grants anon access).
*/

-- ============================================================
-- 1. Replace UPDATE policy
-- ============================================================
DROP POLICY IF EXISTS update_church_prayer_items ON public.church_prayer_items;

CREATE POLICY update_church_prayer_items ON public.church_prayer_items
  FOR UPDATE TO authenticated
  USING (private.can_perform_church_admin_action(church_id))
  WITH CHECK (private.can_perform_church_admin_action(church_id));

-- ============================================================
-- 2. Replace DELETE policy
-- ============================================================
DROP POLICY IF EXISTS delete_church_prayer_items ON public.church_prayer_items;

CREATE POLICY delete_church_prayer_items ON public.church_prayer_items
  FOR DELETE TO authenticated
  USING (private.can_perform_church_admin_action(church_id));
