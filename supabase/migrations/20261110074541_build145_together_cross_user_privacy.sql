/*
# Build 145: Together cross-user privacy and shared interaction fixes

1. Summary
Build 144 device testing found that private Circle prayers were readable by other Circle members,
Circle-shared Check-Ins were unreadable by other members, and direct encouragements were unreadable
by their recipient. Scripture reflection privacy had the same class of defect as prayers.

2. Modified tables and policies
- shared_prayers: SELECT now requires the prayer to be owned by the caller, or to be visibility = 'circle'
  AND carry a circle_id the caller belongs to. Circle membership alone no longer exposes a private prayer.
  INSERT and UPDATE require the caller as profile_id, a valid visibility, and Circle membership when a Circle is used.
- shared_reflections: same SELECT model as shared_prayers. INSERT and UPDATE enforce ownership,
  valid visibility, and Circle membership.
- circle_check_ins: SELECT is visibility-aware (owner, Circle members for 'circle', Circle leaders for
  'leader_only'). INSERT requires user_id and profile_id to equal the caller and Circle membership for shared rows.
  UPDATE keeps creator-only control and applies the same write checks. DELETE is unchanged (creator only).
- encouragements: SELECT is limited to the sender and the intended recipient. INSERT requires the caller as
  sender, a recipient in the same Circle, and a Circle the caller belongs to. UPDATE and DELETE are unchanged.
- prayer_acknowledgements: INSERT requires the caller as user_id and profile_id, and a prayer the caller can read.

3. New function
- get_prayer_acknowledgement_counts(uuid[]): returns only per-prayer counts for prayers the caller can read.
  It does not expose who acknowledged a prayer or any profile data. It runs with definer rights so
  counts are accurate across accounts, and it is granted to signed-in users only.

4. Security notes
- No table is made readable by anon. No table is made readable to every Circle member except Circle check-ins
  marked 'circle' and prayers/reflections marked 'circle'.
- No user content is deleted or altered. Only policies and one read-only function change.
- Existing data was checked before this migration: no Circle-visible rows lack a Circle ID,
  and no check-ins or encouragements have a user_id that differs from the sender or owner.
*/

-- SHARED PRAYERS
DROP POLICY IF EXISTS select_shared_prayers ON public.shared_prayers;
CREATE POLICY select_shared_prayers ON public.shared_prayers
  FOR SELECT TO authenticated
  USING (
    (select auth.uid()) = profile_id
    OR (visibility = 'circle' AND circle_id IS NOT NULL AND private.is_circle_member(circle_id))
  );

DROP POLICY IF EXISTS insert_shared_prayers ON public.shared_prayers;
CREATE POLICY insert_shared_prayers ON public.shared_prayers
  FOR INSERT TO authenticated
  WITH CHECK (
    (select auth.uid()) = profile_id
    AND visibility IN ('private', 'circle')
    AND (circle_id IS NULL OR private.is_circle_member(circle_id))
    AND (visibility = 'private' OR (circle_id IS NOT NULL AND private.is_circle_member(circle_id)))
  );

DROP POLICY IF EXISTS update_shared_prayers ON public.shared_prayers;
CREATE POLICY update_shared_prayers ON public.shared_prayers
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = profile_id)
  WITH CHECK (
    (select auth.uid()) = profile_id
    AND visibility IN ('private', 'circle')
    AND (circle_id IS NULL OR private.is_circle_member(circle_id))
    AND (visibility = 'private' OR (circle_id IS NOT NULL AND private.is_circle_member(circle_id)))
  );

-- SHARED REFLECTIONS
DROP POLICY IF EXISTS select_shared_reflections ON public.shared_reflections;
CREATE POLICY select_shared_reflections ON public.shared_reflections
  FOR SELECT TO authenticated
  USING (
    (select auth.uid()) = profile_id
    OR (visibility = 'circle' AND circle_id IS NOT NULL AND private.is_circle_member(circle_id))
  );

DROP POLICY IF EXISTS insert_shared_reflections ON public.shared_reflections;
CREATE POLICY insert_shared_reflections ON public.shared_reflections
  FOR INSERT TO authenticated
  WITH CHECK (
    (select auth.uid()) = profile_id
    AND visibility IN ('private', 'circle')
    AND (circle_id IS NULL OR private.is_circle_member(circle_id))
    AND (visibility = 'private' OR (circle_id IS NOT NULL AND private.is_circle_member(circle_id)))
  );

DROP POLICY IF EXISTS update_shared_reflections ON public.shared_reflections;
CREATE POLICY update_shared_reflections ON public.shared_reflections
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = profile_id)
  WITH CHECK (
    (select auth.uid()) = profile_id
    AND visibility IN ('private', 'circle')
    AND (circle_id IS NULL OR private.is_circle_member(circle_id))
    AND (visibility = 'private' OR (circle_id IS NOT NULL AND private.is_circle_member(circle_id)))
  );

-- CIRCLE CHECK-INS
DROP POLICY IF EXISTS select_own_circle_check_ins ON public.circle_check_ins;
DROP POLICY IF EXISTS select_circle_check_ins ON public.circle_check_ins;
CREATE POLICY select_circle_check_ins ON public.circle_check_ins
  FOR SELECT TO authenticated
  USING (
    (select auth.uid()) = profile_id
    OR (visibility = 'circle' AND circle_id IS NOT NULL AND private.is_circle_member(circle_id))
    OR (visibility = 'leader_only' AND circle_id IS NOT NULL AND private.is_circle_leader(circle_id))
  );

DROP POLICY IF EXISTS insert_own_circle_check_ins ON public.circle_check_ins;
CREATE POLICY insert_own_circle_check_ins ON public.circle_check_ins
  FOR INSERT TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    AND (select auth.uid()) = profile_id
    AND visibility IN ('private', 'circle', 'leader_only')
    AND (circle_id IS NULL OR private.is_circle_member(circle_id))
    AND (visibility = 'private' OR (circle_id IS NOT NULL AND private.is_circle_member(circle_id)))
  );

DROP POLICY IF EXISTS update_own_circle_check_ins ON public.circle_check_ins;
CREATE POLICY update_own_circle_check_ins ON public.circle_check_ins
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id AND (select auth.uid()) = profile_id)
  WITH CHECK (
    (select auth.uid()) = user_id
    AND (select auth.uid()) = profile_id
    AND visibility IN ('private', 'circle', 'leader_only')
    AND (circle_id IS NULL OR private.is_circle_member(circle_id))
    AND (visibility = 'private' OR (circle_id IS NOT NULL AND private.is_circle_member(circle_id)))
  );

-- ENCOURAGEMENTS
DROP POLICY IF EXISTS select_own_encouragements ON public.encouragements;
CREATE POLICY select_own_encouragements ON public.encouragements
  FOR SELECT TO authenticated
  USING (
    (select auth.uid()) = from_profile_id
    OR (select auth.uid()) = to_profile_id
  );

DROP POLICY IF EXISTS insert_own_encouragements ON public.encouragements;
CREATE POLICY insert_own_encouragements ON public.encouragements
  FOR INSERT TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    AND (select auth.uid()) = from_profile_id
    AND to_profile_id <> from_profile_id
    AND circle_id IS NOT NULL
    AND private.is_circle_member(circle_id)
    AND EXISTS (
      SELECT 1 FROM public.circle_members cm
      WHERE cm.circle_id = public.encouragements.circle_id
        AND cm.profile_id = public.encouragements.to_profile_id
    )
  );

-- PRAYER ACKNOWLEDGEMENTS
DROP POLICY IF EXISTS insert_own_prayer_acknowledgements ON public.prayer_acknowledgements;
CREATE POLICY insert_own_prayer_acknowledgements ON public.prayer_acknowledgements
  FOR INSERT TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    AND (select auth.uid()) = profile_id
    AND EXISTS (
      SELECT 1 FROM public.shared_prayers sp
      WHERE sp.id = public.prayer_acknowledgements.shared_prayer_id
    )
  );

CREATE OR REPLACE FUNCTION public.get_prayer_acknowledgement_counts(p_prayer_ids uuid[])
RETURNS TABLE (shared_prayer_id uuid, ack_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT pa.shared_prayer_id, count(*)::bigint AS ack_count
  FROM public.prayer_acknowledgements pa
  JOIN public.shared_prayers sp ON sp.id = pa.shared_prayer_id
  WHERE pa.shared_prayer_id = ANY (p_prayer_ids)
    AND (
      sp.profile_id = (select auth.uid())
      OR (sp.visibility = 'circle' AND sp.circle_id IS NOT NULL AND private.is_circle_member(sp.circle_id))
    )
  GROUP BY pa.shared_prayer_id;
$$;

REVOKE EXECUTE ON FUNCTION public.get_prayer_acknowledgement_counts(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_prayer_acknowledgement_counts(uuid[]) TO authenticated;
