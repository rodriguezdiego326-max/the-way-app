/*
# THE WAY — Phase 2 Schema Expansion

## Purpose
Expands the database from a static prototype into the foundation of an adaptive
biblical discipleship system. Adds normalized Life & Faith Profile tables, upgraded
memory architecture, daily check-ins, theological source database, doctrine
registry, author metadata, and confessional library metadata.

## New Tables

1. `life_stages` — user's life stage selections (multi-select)
   - id, profile_id, stage, created_at

2. `life_areas` — current life areas the user is navigating (multi-select)
   - id, profile_id, area, created_at

3. `growth_areas` — areas of spiritual growth the user is working on (multi-select)
   - id, profile_id, area, created_at

4. `current_studies` — current Bible study tracking
   - id, profile_id, study_name, created_at

5. `daily_checkins` — daily emotional check-in with optional context
   - id, mood, context_text, remember_context, created_at
   - remember_context defaults to false (privacy-first: do not auto-remember)

6. `theological_authors` — metadata records for historic theologians and modern teachers
   - id, name, era (historic/modern), tradition, born_year, died_year, bio_summary, created_at
   - NO quotations, sermons, or book excerpts — metadata only

7. `confessional_documents` — metadata for Reformed confessions and catechisms
   - id, title, tradition, year, document_type (confession/catechism/canon), summary, created_at
   - NO fabricated text — metadata only

8. `doctrines` — doctrine category registry
   - id, name, description, parent_doctrine_id, created_at

9. `source_doctrines` — relational table connecting sources to doctrines
   - id, source_id, doctrine_id, created_at

10. `scripture_references` — Scripture references connected to sources and doctrines
    - id, source_id, doctrine_id, book, chapter_start, verse_start, chapter_end, verse_end, created_at

## Modified Tables

### `profiles`
- Added `theological_familiarity` was already present (text). Now adding:
  - `current_study` text (free text for current Bible study)
  - `reformed_familiarity` text (New/Growing/Experienced/Advanced)
- Updated CHECK constraint on `theological_depth` (already present, no change needed)

### `memories`
- Added: `user_confirmed` boolean default false
- Added: `sensitivity` text (low/medium/high) default 'low'
- Added: `expiration` timestamptz (nullable — optional auto-expiry)
- Added: `confidence` text (nullable — for AI-derived memories)
- Updated CHECK on `category` to include new categories: 'life', 'goals', 'important_event'
- Updated CHECK on `source` to include 'checkin'

### `sources`
- Added: `work_title` text (renamed concept from `work`)
- Added: `chapter` text
- Added: `year` int
- Added: `verified` boolean default false
- Added: `verification_notes` text
- Updated CHECK on `source_type` to include 'creed' and 'catechism' (separate from confession)

## Security
- RLS enabled on all new tables.
- All policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because this remains a single-tenant app with no sign-in. When auth is added later,
  these policies will be replaced with ownership checks on `user_id`.

## Notes
1. No fabricated quotations, citations, or theological text is inserted.
2. Author and confessional document records contain metadata only — no source text.
3. The `sources` table CHECK constraint is updated to support the expanded source_type list.
4. Future Family/Reach/Together/Legacy tables will reference existing tables without altering them.
*/

-- ============================================================
-- PROFILES: add columns
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_study text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reformed_familiarity text
  CHECK (reformed_familiarity IN ('new', 'growing', 'experienced', 'advanced'));

-- ============================================================
-- LIFE STAGES (multi-select)
-- ============================================================
CREATE TABLE IF NOT EXISTS life_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  stage text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE life_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_life_stages" ON life_stages;
CREATE POLICY "anon_select_life_stages" ON life_stages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_life_stages" ON life_stages;
CREATE POLICY "anon_insert_life_stages" ON life_stages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_life_stages" ON life_stages;
CREATE POLICY "anon_update_life_stages" ON life_stages FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_life_stages" ON life_stages;
CREATE POLICY "anon_delete_life_stages" ON life_stages FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- LIFE AREAS (multi-select)
-- ============================================================
CREATE TABLE IF NOT EXISTS life_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  area text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE life_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_life_areas" ON life_areas;
CREATE POLICY "anon_select_life_areas" ON life_areas FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_life_areas" ON life_areas;
CREATE POLICY "anon_insert_life_areas" ON life_areas FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_life_areas" ON life_areas;
CREATE POLICY "anon_update_life_areas" ON life_areas FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_life_areas" ON life_areas;
CREATE POLICY "anon_delete_life_areas" ON life_areas FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- GROWTH AREAS (multi-select)
-- ============================================================
CREATE TABLE IF NOT EXISTS growth_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  area text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE growth_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_growth_areas" ON growth_areas;
CREATE POLICY "anon_select_growth_areas" ON growth_areas FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_growth_areas" ON growth_areas;
CREATE POLICY "anon_insert_growth_areas" ON growth_areas FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_growth_areas" ON growth_areas;
CREATE POLICY "anon_update_growth_areas" ON growth_areas FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_growth_areas" ON growth_areas;
CREATE POLICY "anon_delete_growth_areas" ON growth_areas FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- CURRENT STUDIES
-- ============================================================
CREATE TABLE IF NOT EXISTS current_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  study_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE current_studies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_current_studies" ON current_studies;
CREATE POLICY "anon_select_current_studies" ON current_studies FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_current_studies" ON current_studies;
CREATE POLICY "anon_insert_current_studies" ON current_studies FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_current_studies" ON current_studies;
CREATE POLICY "anon_update_current_studies" ON current_studies FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_current_studies" ON current_studies;
CREATE POLICY "anon_delete_current_studies" ON current_studies FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- DAILY CHECK-INS
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mood text NOT NULL,
  context_text text,
  remember_context boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_daily_checkins" ON daily_checkins;
CREATE POLICY "anon_select_daily_checkins" ON daily_checkins FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_daily_checkins" ON daily_checkins;
CREATE POLICY "anon_insert_daily_checkins" ON daily_checkins FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_daily_checkins" ON daily_checkins;
CREATE POLICY "anon_update_daily_checkins" ON daily_checkins FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_daily_checkins" ON daily_checkins;
CREATE POLICY "anon_delete_daily_checkins" ON daily_checkins FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- MEMORIES: add columns
-- ============================================================
ALTER TABLE memories ADD COLUMN IF NOT EXISTS user_confirmed boolean NOT NULL DEFAULT false;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS sensitivity text NOT NULL DEFAULT 'low'
  CHECK (sensitivity IN ('low', 'medium', 'high'));
ALTER TABLE memories ADD COLUMN IF NOT EXISTS expiration timestamptz;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS confidence text;

-- Update category CHECK to include new categories
ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_category_check;
ALTER TABLE memories ADD CONSTRAINT memories_category_check
  CHECK (category IN ('life_stage','life','family','work','school','spiritual_growth','bible_study','prayer','church','goals','important_event','struggle','recurring_question','reflection','walk','life_event','preference'));

-- Update source CHECK to include 'checkin'
ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_source_check;
ALTER TABLE memories ADD CONSTRAINT memories_source_check
  CHECK (source IN ('user_input','reflection','walk','prayer','onboarding','checkin'));

-- ============================================================
-- SOURCES: add columns and update constraints
-- ============================================================
ALTER TABLE sources ADD COLUMN IF NOT EXISTS work_title text;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS chapter text;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS year int;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS verification_notes text;

-- Update source_type CHECK to include 'creed' and 'catechism'
ALTER TABLE sources DROP CONSTRAINT IF EXISTS sources_source_type_check;
ALTER TABLE sources ADD CONSTRAINT sources_source_type_check
  CHECK (source_type IN ('scripture','creed','confession','catechism','historic_theologian','modern_teacher','editorial','ai_application'));

-- ============================================================
-- THEOLOGICAL AUTHORS (metadata only — no quotations)
-- ============================================================
CREATE TABLE IF NOT EXISTS theological_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  era text NOT NULL CHECK (era IN ('historic', 'modern')),
  tradition text,
  born_year int,
  died_year int,
  bio_summary text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE theological_authors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_theological_authors" ON theological_authors;
CREATE POLICY "anon_select_theological_authors" ON theological_authors FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_theological_authors" ON theological_authors;
CREATE POLICY "anon_insert_theological_authors" ON theological_authors FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_theological_authors" ON theological_authors;
CREATE POLICY "anon_update_theological_authors" ON theological_authors FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_theological_authors" ON theological_authors;
CREATE POLICY "anon_delete_theological_authors" ON theological_authors FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- CONFESSIONAL DOCUMENTS (metadata only — no fabricated text)
-- ============================================================
CREATE TABLE IF NOT EXISTS confessional_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  tradition text NOT NULL,
  year int,
  document_type text NOT NULL CHECK (document_type IN ('confession', 'catechism', 'canon')),
  summary text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE confessional_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_confessional_documents" ON confessional_documents;
CREATE POLICY "anon_select_confessional_documents" ON confessional_documents FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_confessional_documents" ON confessional_documents;
CREATE POLICY "anon_insert_confessional_documents" ON confessional_documents FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_confessional_documents" ON confessional_documents;
CREATE POLICY "anon_update_confessional_documents" ON confessional_documents FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_confessional_documents" ON confessional_documents;
CREATE POLICY "anon_delete_confessional_documents" ON confessional_documents FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- DOCTRINES (category registry)
-- ============================================================
CREATE TABLE IF NOT EXISTS doctrines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  parent_doctrine_id uuid REFERENCES doctrines(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE doctrines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_doctrines" ON doctrines;
CREATE POLICY "anon_select_doctrines" ON doctrines FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_doctrines" ON doctrines;
CREATE POLICY "anon_insert_doctrines" ON doctrines FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_doctrines" ON doctrines;
CREATE POLICY "anon_update_doctrines" ON doctrines FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_doctrines" ON doctrines;
CREATE POLICY "anon_delete_doctrines" ON doctrines FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- SOURCE-DOCTRINE RELATIONSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS source_doctrines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  doctrine_id uuid NOT NULL REFERENCES doctrines(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE source_doctrines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_source_doctrines" ON source_doctrines;
CREATE POLICY "anon_select_source_doctrines" ON source_doctrines FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_source_doctrines" ON source_doctrines;
CREATE POLICY "anon_insert_source_doctrines" ON source_doctrines FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_source_doctrines" ON source_doctrines;
CREATE POLICY "anon_update_source_doctrines" ON source_doctrines FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_source_doctrines" ON source_doctrines;
CREATE POLICY "anon_delete_source_doctrines" ON source_doctrines FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- SCRIPTURE REFERENCES (connected to sources and doctrines)
-- ============================================================
CREATE TABLE IF NOT EXISTS scripture_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES sources(id) ON DELETE CASCADE,
  doctrine_id uuid REFERENCES doctrines(id) ON DELETE CASCADE,
  book text NOT NULL,
  chapter_start int,
  verse_start int,
  chapter_end int,
  verse_end int,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scripture_references ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_scripture_references" ON scripture_references;
CREATE POLICY "anon_select_scripture_references" ON scripture_references FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_scripture_references" ON scripture_references;
CREATE POLICY "anon_insert_scripture_references" ON scripture_references FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_scripture_references" ON scripture_references;
CREATE POLICY "anon_update_scripture_references" ON scripture_references FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_scripture_references" ON scripture_references;
CREATE POLICY "anon_delete_scripture_references" ON scripture_references FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_life_stages_profile_id ON life_stages(profile_id);
CREATE INDEX IF NOT EXISTS idx_life_areas_profile_id ON life_areas(profile_id);
CREATE INDEX IF NOT EXISTS idx_growth_areas_profile_id ON growth_areas(profile_id);
CREATE INDEX IF NOT EXISTS idx_current_studies_profile_id ON current_studies(profile_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_created_at ON daily_checkins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_source_doctrines_source_id ON source_doctrines(source_id);
CREATE INDEX IF NOT EXISTS idx_source_doctrines_doctrine_id ON source_doctrines(doctrine_id);
CREATE INDEX IF NOT EXISTS idx_scripture_refs_source_id ON scripture_references(source_id);
CREATE INDEX IF NOT EXISTS idx_scripture_refs_doctrine_id ON scripture_references(doctrine_id);
CREATE INDEX IF NOT EXISTS idx_theological_authors_era ON theological_authors(era);
