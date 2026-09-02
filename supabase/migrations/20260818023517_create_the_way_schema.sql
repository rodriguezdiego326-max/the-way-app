/*
# THE WAY — Core Schema Foundation

## Purpose
Creates the database foundation for THE WAY, a Reformed Christian discipleship app.
Single-tenant for the first milestone (no auth) so the anon-key frontend can read/write
its own data. Schema is designed to extend later to Family, Reach, Together, Church,
and Legacy systems without rebuilding the core.

## New Tables

1. `profiles` — onboarding & preferences (Life & Faith Context Engine foundation)
2. `walks` — Today's Walk sessions
3. `walk_reflections` — user reflections on a walk (text or voice transcript)
4. `prayers` — prayer threads with status
5. `prayer_updates` — updates added to a prayer thread over time
6. `ask_conversations` — Ask THE WAY threads
7. `ask_messages` — messages within an ask conversation
8. `memories` — What THE WAY Remembers (transparent & user-controlled)
9. `sources` — source integrity registry (architecture for future verified content)

## Security
- RLS enabled on every table.
- All policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because this is a single-tenant app with no sign-in. When auth is added later,
  these policies will be replaced with ownership checks on `user_id`.

## Notes
1. No `user_id` columns or `auth.uid()` references — no auth in this milestone.
2. `sources` table is architecture-only for now; no fabricated citations will be inserted.
3. Future Family/Reach/Together/Legacy tables will reference existing tables via FK
   without altering existing tables.
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text,
  life_stage text,
  season text,
  preferred_translation text DEFAULT 'ESV',
  theological_depth text NOT NULL DEFAULT 'simple' CHECK (theological_depth IN ('simple','study','deep_study')),
  learning_style text,
  available_time_minutes int DEFAULT 7,
  bible_familiarity text,
  theological_familiarity text,
  memory_enabled boolean NOT NULL DEFAULT true,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
CREATE POLICY "anon_select_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
CREATE POLICY "anon_insert_profiles" ON profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
CREATE POLICY "anon_update_profiles" ON profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_profiles" ON profiles;
CREATE POLICY "anon_delete_profiles" ON profiles FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- WALKS (Today's Walk)
-- ============================================================
CREATE TABLE IF NOT EXISTS walks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passage_reference text NOT NULL,
  reading_objective text,
  observation_prompt text,
  estimated_minutes int DEFAULT 7,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','open','reading','reflecting','complete')),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE walks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_walks" ON walks;
CREATE POLICY "anon_select_walks" ON walks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_walks" ON walks;
CREATE POLICY "anon_insert_walks" ON walks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_walks" ON walks;
CREATE POLICY "anon_update_walks" ON walks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_walks" ON walks;
CREATE POLICY "anon_delete_walks" ON walks FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- WALK REFLECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS walk_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  walk_id uuid NOT NULL REFERENCES walks(id) ON DELETE CASCADE,
  body text NOT NULL,
  input_mode text NOT NULL DEFAULT 'text' CHECK (input_mode IN ('text','voice')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE walk_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_walk_reflections" ON walk_reflections;
CREATE POLICY "anon_select_walk_reflections" ON walk_reflections FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_walk_reflections" ON walk_reflections;
CREATE POLICY "anon_insert_walk_reflections" ON walk_reflections FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_walk_reflections" ON walk_reflections;
CREATE POLICY "anon_update_walk_reflections" ON walk_reflections FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_walk_reflections" ON walk_reflections;
CREATE POLICY "anon_delete_walk_reflections" ON walk_reflections FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- PRAYERS
-- ============================================================
CREATE TABLE IF NOT EXISTS prayers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  related_scripture text,
  status text NOT NULL DEFAULT 'praying' CHECK (status IN ('praying','waiting','answered','closed')),
  started_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_prayers" ON prayers;
CREATE POLICY "anon_select_prayers" ON prayers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_prayers" ON prayers;
CREATE POLICY "anon_insert_prayers" ON prayers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_prayers" ON prayers;
CREATE POLICY "anon_update_prayers" ON prayers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_prayers" ON prayers;
CREATE POLICY "anon_delete_prayers" ON prayers FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- PRAYER UPDATES
-- ============================================================
CREATE TABLE IF NOT EXISTS prayer_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_id uuid NOT NULL REFERENCES prayers(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prayer_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_prayer_updates" ON prayer_updates;
CREATE POLICY "anon_select_prayer_updates" ON prayer_updates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_prayer_updates" ON prayer_updates;
CREATE POLICY "anon_insert_prayer_updates" ON prayer_updates FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_prayer_updates" ON prayer_updates;
CREATE POLICY "anon_update_prayer_updates" ON prayer_updates FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_prayer_updates" ON prayer_updates;
CREATE POLICY "anon_delete_prayer_updates" ON prayer_updates FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- ASK CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS ask_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  intent text CHECK (intent IN ('passage','theology','life','prayer','doubts','child','evangelism')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ask_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_ask_conversations" ON ask_conversations;
CREATE POLICY "anon_select_ask_conversations" ON ask_conversations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_ask_conversations" ON ask_conversations;
CREATE POLICY "anon_insert_ask_conversations" ON ask_conversations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_ask_conversations" ON ask_conversations;
CREATE POLICY "anon_update_ask_conversations" ON ask_conversations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_ask_conversations" ON ask_conversations;
CREATE POLICY "anon_delete_ask_conversations" ON ask_conversations FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- ASK MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS ask_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES ask_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ask_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_ask_messages" ON ask_messages;
CREATE POLICY "anon_select_ask_messages" ON ask_messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_ask_messages" ON ask_messages;
CREATE POLICY "anon_insert_ask_messages" ON ask_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_ask_messages" ON ask_messages;
CREATE POLICY "anon_update_ask_messages" ON ask_messages FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_ask_messages" ON ask_messages;
CREATE POLICY "anon_delete_ask_messages" ON ask_messages FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- MEMORIES (What THE WAY Remembers)
-- ============================================================
CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('life_stage','family','work','spiritual_goal','bible_study','prayer_priority','struggle','recurring_question','reflection','church','walk','life_event','preference')),
  content text NOT NULL,
  source text NOT NULL DEFAULT 'user_input' CHECK (source IN ('user_input','reflection','walk','prayer','onboarding')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_memories" ON memories;
CREATE POLICY "anon_select_memories" ON memories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_memories" ON memories;
CREATE POLICY "anon_insert_memories" ON memories FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_memories" ON memories;
CREATE POLICY "anon_update_memories" ON memories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_memories" ON memories;
CREATE POLICY "anon_delete_memories" ON memories FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- SOURCES (Source Integrity Registry — architecture for future verified content)
-- ============================================================
CREATE TABLE IF NOT EXISTS sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL CHECK (source_type IN ('scripture','confession','historic_theologian','modern_teacher','editorial','ai_application')),
  author text,
  work text,
  title text,
  chapter_section text,
  page text,
  publication_info text,
  url text,
  license_status text,
  verification_status text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','verified','pending')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sources" ON sources;
CREATE POLICY "anon_select_sources" ON sources FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sources" ON sources;
CREATE POLICY "anon_insert_sources" ON sources FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sources" ON sources;
CREATE POLICY "anon_update_sources" ON sources FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sources" ON sources;
CREATE POLICY "anon_delete_sources" ON sources FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_walk_reflections_walk_id ON walk_reflections(walk_id);
CREATE INDEX IF NOT EXISTS idx_prayer_updates_prayer_id ON prayer_updates(prayer_id);
CREATE INDEX IF NOT EXISTS idx_ask_messages_conversation_id ON ask_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_walks_created_at ON walks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayers_status ON prayers(status);
CREATE INDEX IF NOT EXISTS idx_memories_active ON memories(active);
