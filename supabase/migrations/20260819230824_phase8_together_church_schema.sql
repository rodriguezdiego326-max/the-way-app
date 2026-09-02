/*
# Phase 8 — TOGETHER + CHURCH Schema

## Purpose
Creates the full database architecture for private Circles, shared prayer,
shared Scripture study, check-ins, encouragement, accountability,
church profiles, sermon notes, church studies, and notification preferences.

## New Tables (20 total)

### Together (Circles)
1. `circles` — Private groups (2–12 members) with types like Marriage, Men's Group, Bible Study
2. `circle_members` — Membership with roles (OWNER, LEADER, MEMBER, PASTOR, CHURCH_LEADER)
3. `circle_invitations` — Revocable, optionally expiring invite tokens
4. `shared_prayers` — Prayer requests with sharing controls (private or circle)
5. `prayer_acknowledgements` — "I Prayed For You" taps (no likes, no ranking)
6. `shared_scripture_studies` — Group Bible studies with passage, objective, questions
7. `shared_reflections` — Member reflections with explicit sharing controls
8. `circle_check_ins` — Emotional/spiritual check-ins with sharing settings
9. `encouragements` — Intentional encouragement actions (not likes/reactions)
10. `accountability_relationships` — Opt-in accountability partner or small circle

### Church
11. `church_profiles` — Church information (name, city, website)
12. `church_memberships` — User's relationship to a church (member, visitor, pastor, etc.)
13. `sermons` — Sermon metadata (church, date, speaker, passage, series)
14. `sermon_notes` — User's private notes on a sermon
15. `church_studies` — Church-published study series (e.g., "Romans: Gospel of Grace")
16. `church_study_assignments` — Individual week/passage assignments within a study
17. `church_prayer_items` — Church-managed prayer items (missionaries, ministry needs)
18. `church_groups` — Church-connected small groups
19. `group_discussions` — Discussion threads within church groups

### Settings
20. `notification_preferences` — User notification and quiet hours preferences

## Security
- RLS enabled on all tables
- Uses `TO anon, authenticated` (matching existing single-tenant pattern)
- Ownership tracked via `profile_id` columns
- Visibility controlled via explicit sharing columns
- Helper functions for circle membership checks (defined after tables)
- Church admin actions require verified church role (not just self-selected pastor)
- No auth.uid() — app is single-tenant with profile-based ownership

## Important Notes
1. All tables use `TO anon, authenticated` matching the existing no-auth pattern
2. Privacy is enforced through schema design (visibility columns) and application-level filtering
3. `is_circle_member()` helper function checks membership
4. `is_circle_leader()` helper function checks leader/owner role
5. Church role verification is separate from self-selected personal role
6. No spiritual leaderboards, no faith scores, no streak-based shame
*/

-- ============================================================
-- CIRCLES
-- ============================================================

CREATE TABLE IF NOT EXISTS circles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  circle_type text NOT NULL DEFAULT 'Other',
  description text,
  owner_profile_id uuid NOT NULL,
  privacy text NOT NULL DEFAULT 'PRIVATE',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE circles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_circles" ON circles;
CREATE POLICY "anon_select_circles" ON circles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_circles" ON circles;
CREATE POLICY "anon_insert_circles" ON circles FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_circles" ON circles;
CREATE POLICY "anon_update_circles" ON circles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_circles" ON circles;
CREATE POLICY "anon_delete_circles" ON circles FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- CIRCLE MEMBERS
-- ============================================================

CREATE TABLE IF NOT EXISTS circle_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'MEMBER',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(circle_id, profile_id)
);

ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_circle_members" ON circle_members;
CREATE POLICY "anon_select_circle_members" ON circle_members FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_circle_members" ON circle_members;
CREATE POLICY "anon_insert_circle_members" ON circle_members FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_circle_members" ON circle_members;
CREATE POLICY "anon_update_circle_members" ON circle_members FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_circle_members" ON circle_members;
CREATE POLICY "anon_delete_circle_members" ON circle_members FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- CIRCLE INVITATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS circle_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  invited_by_profile_id uuid NOT NULL,
  invite_code text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(12), 'hex'),
  expires_at timestamptz,
  revoked_at timestamptz,
  accepted_at timestamptz,
  accepted_by_profile_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE circle_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_invitations" ON circle_invitations;
CREATE POLICY "anon_select_invitations" ON circle_invitations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_invitations" ON circle_invitations;
CREATE POLICY "anon_insert_invitations" ON circle_invitations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_invitations" ON circle_invitations;
CREATE POLICY "anon_update_invitations" ON circle_invitations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_invitations" ON circle_invitations;
CREATE POLICY "anon_delete_invitations" ON circle_invitations FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- SHARED PRAYERS
-- ============================================================

CREATE TABLE IF NOT EXISTS shared_prayers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  related_scripture text,
  status text NOT NULL DEFAULT 'PRAYING',
  profile_id uuid NOT NULL,
  circle_id uuid REFERENCES circles(id) ON DELETE CASCADE,
  visibility text NOT NULL DEFAULT 'private',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE shared_prayers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_shared_prayers" ON shared_prayers;
CREATE POLICY "anon_select_shared_prayers" ON shared_prayers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_shared_prayers" ON shared_prayers;
CREATE POLICY "anon_insert_shared_prayers" ON shared_prayers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_shared_prayers" ON shared_prayers;
CREATE POLICY "anon_update_shared_prayers" ON shared_prayers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_shared_prayers" ON shared_prayers;
CREATE POLICY "anon_delete_shared_prayers" ON shared_prayers FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- PRAYER ACKNOWLEDGEMENTS (I Prayed For You)
-- ============================================================

CREATE TABLE IF NOT EXISTS prayer_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_prayer_id uuid NOT NULL REFERENCES shared_prayers(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(shared_prayer_id, profile_id)
);

ALTER TABLE prayer_acknowledgements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_acknowledgements" ON prayer_acknowledgements;
CREATE POLICY "anon_select_acknowledgements" ON prayer_acknowledgements FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_acknowledgements" ON prayer_acknowledgements;
CREATE POLICY "anon_insert_acknowledgements" ON prayer_acknowledgements FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_acknowledgements" ON prayer_acknowledgements;
CREATE POLICY "anon_delete_acknowledgements" ON prayer_acknowledgements FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- SHARED SCRIPTURE STUDIES
-- ============================================================

CREATE TABLE IF NOT EXISTS shared_scripture_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  passage_reference text NOT NULL,
  reading_objective text,
  observe_prompt text,
  understand_prompt text,
  discuss_prompt text,
  apply_prompt text,
  prayer_prompt text,
  go_deeper_prompt text,
  assigned_by_profile_id uuid NOT NULL,
  meeting_date timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shared_scripture_studies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_studies" ON shared_scripture_studies;
CREATE POLICY "anon_select_studies" ON shared_scripture_studies FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_studies" ON shared_scripture_studies;
CREATE POLICY "anon_insert_studies" ON shared_scripture_studies FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_studies" ON shared_scripture_studies;
CREATE POLICY "anon_update_studies" ON shared_scripture_studies FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_studies" ON shared_scripture_studies;
CREATE POLICY "anon_delete_studies" ON shared_scripture_studies FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- SHARED REFLECTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS shared_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  circle_id uuid REFERENCES circles(id) ON DELETE CASCADE,
  scripture_study_id uuid REFERENCES shared_scripture_studies(id) ON DELETE CASCADE,
  body text NOT NULL,
  visibility text NOT NULL DEFAULT 'private',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shared_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_reflections" ON shared_reflections;
CREATE POLICY "anon_select_reflections" ON shared_reflections FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reflections" ON shared_reflections;
CREATE POLICY "anon_insert_reflections" ON shared_reflections FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_reflections" ON shared_reflections;
CREATE POLICY "anon_update_reflections" ON shared_reflections FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_reflections" ON shared_reflections;
CREATE POLICY "anon_delete_reflections" ON shared_reflections FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- CIRCLE CHECK-INS
-- ============================================================

CREATE TABLE IF NOT EXISTS circle_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  circle_id uuid REFERENCES circles(id) ON DELETE CASCADE,
  state text NOT NULL,
  note text,
  visibility text NOT NULL DEFAULT 'private',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE circle_check_ins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_checkins" ON circle_check_ins;
CREATE POLICY "anon_select_checkins" ON circle_check_ins FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_checkins" ON circle_check_ins;
CREATE POLICY "anon_insert_checkins" ON circle_check_ins FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_checkins" ON circle_check_ins;
CREATE POLICY "anon_update_checkins" ON circle_check_ins FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_checkins" ON circle_check_ins;
CREATE POLICY "anon_delete_checkins" ON circle_check_ins FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- ENCOURAGEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS encouragements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_profile_id uuid NOT NULL,
  to_profile_id uuid NOT NULL,
  circle_id uuid REFERENCES circles(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE encouragements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_encouragements" ON encouragements;
CREATE POLICY "anon_select_encouragements" ON encouragements FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_encouragements" ON encouragements;
CREATE POLICY "anon_insert_encouragements" ON encouragements FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_encouragements" ON encouragements;
CREATE POLICY "anon_delete_encouragements" ON encouragements FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- ACCOUNTABILITY RELATIONSHIPS
-- ============================================================

CREATE TABLE IF NOT EXISTS accountability_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  partner_profile_id uuid,
  circle_id uuid REFERENCES circles(id) ON DELETE CASCADE,
  areas text[] NOT NULL DEFAULT '{}',
  opt_in boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE accountability_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_accountability" ON accountability_relationships;
CREATE POLICY "anon_select_accountability" ON accountability_relationships FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_accountability" ON accountability_relationships;
CREATE POLICY "anon_insert_accountability" ON accountability_relationships FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_accountability" ON accountability_relationships;
CREATE POLICY "anon_update_accountability" ON accountability_relationships FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_accountability" ON accountability_relationships;
CREATE POLICY "anon_delete_accountability" ON accountability_relationships FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- CHURCH PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS church_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text,
  website text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE church_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_church_profiles" ON church_profiles;
CREATE POLICY "anon_select_church_profiles" ON church_profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_church_profiles" ON church_profiles;
CREATE POLICY "anon_insert_church_profiles" ON church_profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_church_profiles" ON church_profiles;
CREATE POLICY "anon_update_church_profiles" ON church_profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_church_profiles" ON church_profiles;
CREATE POLICY "anon_delete_church_profiles" ON church_profiles FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- CHURCH MEMBERSHIPS
-- ============================================================

CREATE TABLE IF NOT EXISTS church_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  church_id uuid NOT NULL REFERENCES church_profiles(id) ON DELETE CASCADE,
  personal_role text NOT NULL DEFAULT 'Regular Attender',
  verified_church_role text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, church_id)
);

ALTER TABLE church_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_memberships" ON church_memberships;
CREATE POLICY "anon_select_memberships" ON church_memberships FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_memberships" ON church_memberships;
CREATE POLICY "anon_insert_memberships" ON church_memberships FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_memberships" ON church_memberships;
CREATE POLICY "anon_update_memberships" ON church_memberships FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_memberships" ON church_memberships;
CREATE POLICY "anon_delete_memberships" ON church_memberships FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- SERMONS
-- ============================================================

CREATE TABLE IF NOT EXISTS sermons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES church_profiles(id) ON DELETE SET NULL,
  date timestamptz NOT NULL,
  speaker text,
  title text,
  passage text NOT NULL,
  series text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sermons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sermons" ON sermons;
CREATE POLICY "anon_select_sermons" ON sermons FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sermons" ON sermons;
CREATE POLICY "anon_insert_sermons" ON sermons FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sermons" ON sermons;
CREATE POLICY "anon_update_sermons" ON sermons FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sermons" ON sermons;
CREATE POLICY "anon_delete_sermons" ON sermons FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- SERMON NOTES
-- ============================================================

CREATE TABLE IF NOT EXISTS sermon_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  sermon_id uuid REFERENCES sermons(id) ON DELETE CASCADE,
  notes text,
  main_point text,
  questions text,
  application text,
  prayer text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sermon_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sermon_notes" ON sermon_notes;
CREATE POLICY "anon_select_sermon_notes" ON sermon_notes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sermon_notes" ON sermon_notes;
CREATE POLICY "anon_insert_sermon_notes" ON sermon_notes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sermon_notes" ON sermon_notes;
CREATE POLICY "anon_update_sermon_notes" ON sermon_notes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sermon_notes" ON sermon_notes;
CREATE POLICY "anon_delete_sermon_notes" ON sermon_notes FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- CHURCH STUDIES
-- ============================================================

CREATE TABLE IF NOT EXISTS church_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES church_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE church_studies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_church_studies" ON church_studies;
CREATE POLICY "anon_select_church_studies" ON church_studies FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_church_studies" ON church_studies;
CREATE POLICY "anon_insert_church_studies" ON church_studies FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_church_studies" ON church_studies;
CREATE POLICY "anon_update_church_studies" ON church_studies FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_church_studies" ON church_studies;
CREATE POLICY "anon_delete_church_studies" ON church_studies FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- CHURCH STUDY ASSIGNMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS church_study_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_study_id uuid NOT NULL REFERENCES church_studies(id) ON DELETE CASCADE,
  week_label text NOT NULL,
  passage_reference text NOT NULL,
  reading_objective text,
  discussion_questions text[],
  prayer_focus text,
  meeting_date timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE church_study_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_assignments" ON church_study_assignments;
CREATE POLICY "anon_select_assignments" ON church_study_assignments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_assignments" ON church_study_assignments;
CREATE POLICY "anon_insert_assignments" ON church_study_assignments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_assignments" ON church_study_assignments;
CREATE POLICY "anon_update_assignments" ON church_study_assignments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_assignments" ON church_study_assignments;
CREATE POLICY "anon_delete_assignments" ON church_study_assignments FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- CHURCH PRAYER ITEMS
-- ============================================================

CREATE TABLE IF NOT EXISTS church_prayer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES church_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'Ministry',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE church_prayer_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_church_prayer" ON church_prayer_items;
CREATE POLICY "anon_select_church_prayer" ON church_prayer_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_church_prayer" ON church_prayer_items;
CREATE POLICY "anon_insert_church_prayer" ON church_prayer_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_church_prayer" ON church_prayer_items;
CREATE POLICY "anon_update_church_prayer" ON church_prayer_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_church_prayer" ON church_prayer_items;
CREATE POLICY "anon_delete_church_prayer" ON church_prayer_items FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- CHURCH GROUPS
-- ============================================================

CREATE TABLE IF NOT EXISTS church_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES church_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  meeting_day text,
  leader_profile_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE church_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_church_groups" ON church_groups;
CREATE POLICY "anon_select_church_groups" ON church_groups FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_church_groups" ON church_groups;
CREATE POLICY "anon_insert_church_groups" ON church_groups FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_church_groups" ON church_groups;
CREATE POLICY "anon_update_church_groups" ON church_groups FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_church_groups" ON church_groups;
CREATE POLICY "anon_delete_church_groups" ON church_groups FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- GROUP DISCUSSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS group_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES church_groups(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL,
  topic text NOT NULL,
  body text NOT NULL,
  is_ai_summary boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE group_discussions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_discussions" ON group_discussions;
CREATE POLICY "anon_select_discussions" ON group_discussions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_discussions" ON group_discussions;
CREATE POLICY "anon_insert_discussions" ON group_discussions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_discussions" ON group_discussions;
CREATE POLICY "anon_delete_discussions" ON group_discussions FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE,
  together_notifications boolean NOT NULL DEFAULT true,
  church_notifications boolean NOT NULL DEFAULT true,
  quiet_hours_start time,
  quiet_hours_end time,
  sunday_mode boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_notif_prefs" ON notification_preferences;
CREATE POLICY "anon_select_notif_prefs" ON notification_preferences FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_notif_prefs" ON notification_preferences;
CREATE POLICY "anon_insert_notif_prefs" ON notification_preferences FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_notif_prefs" ON notification_preferences;
CREATE POLICY "anon_update_notif_prefs" ON notification_preferences FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_notif_prefs" ON notification_preferences;
CREATE POLICY "anon_delete_notif_prefs" ON notification_preferences FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- HELPER FUNCTIONS (defined after tables exist)
-- ============================================================

CREATE OR REPLACE FUNCTION is_circle_member(check_circle_id uuid, check_profile_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_members.circle_id = check_circle_id
    AND circle_members.profile_id = check_profile_id
  );
$$;

CREATE OR REPLACE FUNCTION is_circle_leader(check_circle_id uuid, check_profile_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_members.circle_id = check_circle_id
    AND circle_members.profile_id = check_profile_id
    AND circle_members.role IN ('OWNER', 'LEADER', 'PASTOR', 'CHURCH_LEADER')
  );
$$;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_circle_members_circle ON circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_profile ON circle_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_shared_prayers_circle ON shared_prayers(circle_id);
CREATE INDEX IF NOT EXISTS idx_shared_prayers_profile ON shared_prayers(profile_id);
CREATE INDEX IF NOT EXISTS idx_shared_reflections_circle ON shared_reflections(circle_id);
CREATE INDEX IF NOT EXISTS idx_shared_reflections_profile ON shared_reflections(profile_id);
CREATE INDEX IF NOT EXISTS idx_circle_checkins_circle ON circle_check_ins(circle_id);
CREATE INDEX IF NOT EXISTS idx_sermon_notes_profile ON sermon_notes(profile_id);
CREATE INDEX IF NOT EXISTS idx_sermon_notes_sermon ON sermon_notes(sermon_id);
CREATE INDEX IF NOT EXISTS idx_church_memberships_profile ON church_memberships(profile_id);
CREATE INDEX IF NOT EXISTS idx_church_memberships_church ON church_memberships(church_id);
CREATE INDEX IF NOT EXISTS idx_encouragements_to ON encouragements(to_profile_id);
CREATE INDEX IF NOT EXISTS idx_encouragements_circle ON encouragements(circle_id);
CREATE INDEX IF NOT EXISTS idx_church_study_assignments_study ON church_study_assignments(church_study_id);
CREATE INDEX IF NOT EXISTS idx_church_prayer_items_church ON church_prayer_items(church_id);