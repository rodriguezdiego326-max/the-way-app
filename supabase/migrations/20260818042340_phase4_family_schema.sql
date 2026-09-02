-- ============================================================
-- THE WAY Phase 4 — Family Schema
-- Family profiles, members, walks, catechism, prayers, journey
-- ============================================================

-- Family Profiles (parent-controlled, private)
CREATE TABLE family_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  family_name TEXT,
  current_study TEXT,
  memory_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE family_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_family" ON family_profiles FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_own_family" ON family_profiles FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_own_family" ON family_profiles FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_own_family" ON family_profiles FOR DELETE
  TO authenticated USING (true);

-- Family Members (children — heightened privacy, no real names required)
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_profile_id UUID REFERENCES family_profiles(id) ON DELETE CASCADE,
  nickname TEXT,
  age_range TEXT NOT NULL DEFAULT '6-8',
  relationship TEXT,
  learning_preferences TEXT,
  discussion_level TEXT DEFAULT 'simple',
  current_topics TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_family_members" ON family_members FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_own_family_members" ON family_members FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_own_family_members" ON family_members FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_own_family_members" ON family_members FOR DELETE
  TO authenticated USING (true);

-- Family Walks (evening discipleship walks)
CREATE TABLE family_walks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_profile_id UUID REFERENCES family_profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  passage_reference TEXT NOT NULL,
  reading_instruction TEXT,
  parent_prep TEXT,
  main_truth TEXT,
  biblical_context TEXT,
  reformed_foundation TEXT,
  words_children_may_ask TEXT,
  common_misunderstanding TEXT,
  one_thing_to_emphasize TEXT,
  age_questions JSONB,
  application TEXT,
  prayer_guide TEXT,
  estimated_minutes INTEGER DEFAULT 10,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE family_walks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_family_walks" ON family_walks FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_own_family_walks" ON family_walks FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_own_family_walks" ON family_walks FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_own_family_walks" ON family_walks FOR DELETE
  TO authenticated USING (true);

-- Catechism Progress
CREATE TABLE catechism_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_profile_id UUID REFERENCES family_profiles(id) ON DELETE CASCADE,
  catechism_type TEXT NOT NULL DEFAULT 'westminster_shorter',
  question_number INTEGER NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  scripture_basis TEXT,
  explanation TEXT,
  discussion_question TEXT,
  family_application TEXT,
  prayer TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE catechism_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_catechism" ON catechism_progress FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_own_catechism" ON catechism_progress FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_own_catechism" ON catechism_progress FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_own_catechism" ON catechism_progress FOR DELETE
  TO authenticated USING (true);

-- Family Prayers (private, parent-controlled)
CREATE TABLE family_prayers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_profile_id UUID REFERENCES family_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  related_scripture TEXT,
  status TEXT DEFAULT 'praying',
  started_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE family_prayers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_family_prayers" ON family_prayers FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_own_family_prayers" ON family_prayers FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_own_family_prayers" ON family_prayers FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_own_family_prayers" ON family_prayers FOR DELETE
  TO authenticated USING (true);

-- Family Prayer Updates
CREATE TABLE family_prayer_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_prayer_id UUID REFERENCES family_prayers(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE family_prayer_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_family_prayer_updates" ON family_prayer_updates FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_own_family_prayer_updates" ON family_prayer_updates FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "delete_own_family_prayer_updates" ON family_prayer_updates FOR DELETE
  TO authenticated USING (true);

-- Family Journey Progress (curriculum pathway)
CREATE TABLE family_journey_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_profile_id UUID REFERENCES family_profiles(id) ON DELETE CASCADE,
  pathway TEXT NOT NULL DEFAULT 'foundations',
  lesson_number INTEGER NOT NULL,
  lesson_title TEXT NOT NULL,
  status TEXT DEFAULT 'not_started',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE family_journey_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_journey" ON family_journey_progress FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_own_journey" ON family_journey_progress FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_own_journey" ON family_journey_progress FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_own_journey" ON family_journey_progress FOR DELETE
  TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_family_members_profile ON family_members(family_profile_id);
CREATE INDEX idx_family_walks_profile ON family_walks(family_profile_id);
CREATE INDEX idx_catechism_progress_profile ON catechism_progress(family_profile_id);
CREATE INDEX idx_family_prayers_profile ON family_prayers(family_profile_id);
CREATE INDEX idx_family_journey_profile ON family_journey_progress(family_profile_id);
