-- ============================================================
-- Phase 4.1 — Fix Family RLS Policies
-- The app uses anon-key (no auth session). Family tables were
-- created with TO authenticated only, blocking all access.
-- This migration replaces those policies with TO anon, authenticated
-- to match the rest of the app's security model.
-- ============================================================

-- family_profiles
DROP POLICY IF EXISTS "select_own_family" ON family_profiles;
DROP POLICY IF EXISTS "insert_own_family" ON family_profiles;
DROP POLICY IF EXISTS "update_own_family" ON family_profiles;
DROP POLICY IF EXISTS "delete_own_family" ON family_profiles;

CREATE POLICY "anon_select_family_profiles" ON family_profiles FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_family_profiles" ON family_profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_family_profiles" ON family_profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_family_profiles" ON family_profiles FOR DELETE
  TO anon, authenticated USING (true);

-- family_members
DROP POLICY IF EXISTS "select_own_family_members" ON family_members;
DROP POLICY IF EXISTS "insert_own_family_members" ON family_members;
DROP POLICY IF EXISTS "update_own_family_members" ON family_members;
DROP POLICY IF EXISTS "delete_own_family_members" ON family_members;

CREATE POLICY "anon_select_family_members" ON family_members FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_family_members" ON family_members FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_family_members" ON family_members FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_family_members" ON family_members FOR DELETE
  TO anon, authenticated USING (true);

-- family_walks
DROP POLICY IF EXISTS "select_own_family_walks" ON family_walks;
DROP POLICY IF EXISTS "insert_own_family_walks" ON family_walks;
DROP POLICY IF EXISTS "update_own_family_walks" ON family_walks;
DROP POLICY IF EXISTS "delete_own_family_walks" ON family_walks;

CREATE POLICY "anon_select_family_walks" ON family_walks FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_family_walks" ON family_walks FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_family_walks" ON family_walks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_family_walks" ON family_walks FOR DELETE
  TO anon, authenticated USING (true);

-- catechism_progress
DROP POLICY IF EXISTS "select_own_catechism" ON catechism_progress;
DROP POLICY IF EXISTS "insert_own_catechism" ON catechism_progress;
DROP POLICY IF EXISTS "update_own_catechism" ON catechism_progress;
DROP POLICY IF EXISTS "delete_own_catechism" ON catechism_progress;

CREATE POLICY "anon_select_catechism" ON catechism_progress FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_catechism" ON catechism_progress FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_catechism" ON catechism_progress FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_catechism" ON catechism_progress FOR DELETE
  TO anon, authenticated USING (true);

-- family_prayers
DROP POLICY IF EXISTS "select_own_family_prayers" ON family_prayers;
DROP POLICY IF EXISTS "insert_own_family_prayers" ON family_prayers;
DROP POLICY IF EXISTS "update_own_family_prayers" ON family_prayers;
DROP POLICY IF EXISTS "delete_own_family_prayers" ON family_prayers;

CREATE POLICY "anon_select_family_prayers" ON family_prayers FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_family_prayers" ON family_prayers FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_family_prayers" ON family_prayers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_family_prayers" ON family_prayers FOR DELETE
  TO anon, authenticated USING (true);

-- family_prayer_updates
DROP POLICY IF EXISTS "select_own_family_prayer_updates" ON family_prayer_updates;
DROP POLICY IF EXISTS "insert_own_family_prayer_updates" ON family_prayer_updates;
DROP POLICY IF EXISTS "delete_own_family_prayer_updates" ON family_prayer_updates;

CREATE POLICY "anon_select_family_prayer_updates" ON family_prayer_updates FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_family_prayer_updates" ON family_prayer_updates FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_family_prayer_updates" ON family_prayer_updates FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_family_prayer_updates" ON family_prayer_updates FOR DELETE
  TO anon, authenticated USING (true);

-- family_journey_progress
DROP POLICY IF EXISTS "select_own_journey" ON family_journey_progress;
DROP POLICY IF EXISTS "insert_own_journey" ON family_journey_progress;
DROP POLICY IF EXISTS "update_own_journey" ON family_journey_progress;
DROP POLICY IF EXISTS "delete_own_journey" ON family_journey_progress;

CREATE POLICY "anon_select_journey" ON family_journey_progress FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_journey" ON family_journey_progress FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_journey" ON family_journey_progress FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_journey" ON family_journey_progress FOR DELETE
  TO anon, authenticated USING (true);
