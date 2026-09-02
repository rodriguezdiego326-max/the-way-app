/*
# Phase 9 — Legacy Schema

## Purpose
Creates the Legacy system: a user-controlled permanent record of their spiritual journey.
Legacy is intentionally separate from personalization Memory and from all community systems.

## Core Principles Enforced by Schema
1. Legacy records are PRIVATE by default — no community access
2. Original user text is never overwritten by AI summaries (stored in separate columns)
3. Legacy events reference source records but do not duplicate or auto-import them
4. No score/ranking columns exist anywhere
5. Legacy is separate from the global theological RAG library

## New Tables

### 1. `legacy_events`
The core normalized event record. Each row is one user-approved Legacy entry.
- `id` (uuid PK)
- `profile_id` (uuid, owner — single-tenant uses a generated UUID stored from app)
- `event_type` (text: bible_reflection, prayer, prayer_update, answered_prayer, life_event, spiritual_milestone, church_milestone, family_milestone, testimony_entry, sermon_reflection, reach_reflection, family_walk_milestone, circle_milestone, user_created_memory, letter, personal_note)
- `title` (text)
- `event_date` (date, when the event occurred — user-set)
- `source_type` (text: prayer, today_walk, family, church, reach, memory, user_created, circle, ai_generated_summary)
- `source_id` (uuid, nullable — FK to original record if applicable)
- `summary` (text, nullable — short user-facing label)
- `user_text` (text, nullable — the user's original words, NEVER overwritten)
- `ai_summary` (text, nullable — AI-generated organizational summary, always separate)
- `scripture_references` (text[], nullable — passage refs like ['Romans 8:28', 'Psalm 23'])
- `prayer_id` (uuid, nullable — link to prayers table)
- `life_season_id` (uuid, nullable — FK to legacy_life_seasons)
- `family_member_reference` (text, nullable — label only, not a profile FK)
- `church_reference` (text, nullable — church name label, not a church FK)
- `visibility` (text: PRIVATE, SHARED_WITH_SELECTED_PERSON, FAMILY_SHARED, EXPORT_ONLY, FUTURE_RELEASE — default PRIVATE)
- `share_status` (text: not_shared, shared, exported — default not_shared)
- `user_verified` (boolean, default true — user confirmed this record)
- `in_vault` (boolean, default false — designated for Legacy Vault)
- `archived` (boolean, default false)
- `deleted_at` (timestamptz, nullable — soft delete)
- `created_at`, `updated_at` (timestamptz)

### 2. `legacy_life_seasons`
User-created life seasons (Career Transition, New Baby, Grief, etc.)
- `id` (uuid PK)
- `profile_id` (uuid)
- `title` (text)
- `description` (text, nullable)
- `start_date` (date)
- `end_date` (date, nullable — null means ongoing)
- `scripture` (text, nullable)
- `prayer` (text, nullable)
- `what_im_learning` (text, nullable)
- `people_involved` (text, nullable)
- `season_reflection` (text, nullable — end-of-season user reflection)
- `archived` (boolean, default false)
- `deleted_at` (timestamptz, nullable)
- `created_at`, `updated_at` (timestamptz)

### 3. `legacy_letters`
User-written letters (to child, spouse, future self, etc.)
- `id` (uuid PK)
- `profile_id` (uuid)
- `letter_type` (text: to_my_child, to_my_spouse, to_my_future_self, to_my_family, for_future_milestone, testimony_letter, custom)
- `recipient_label` (text, nullable)
- `body` (text — the user's original words)
- `ai_organized_body` (text, nullable — AI-reorganized version, separate)
- `scripture_reference` (text, nullable)
- `target_date` (date, nullable — for future letters)
- `legacy_attachments` (text[], nullable — legacy_event IDs referenced)
- `visibility` (text, default PRIVATE)
- `archived` (boolean, default false)
- `deleted_at` (timestamptz, nullable)
- `created_at`, `updated_at` (timestamptz)

### 4. `legacy_milestones`
User-created milestones (baptism, marriage, etc.)
- `id` (uuid PK)
- `profile_id` (uuid)
- `milestone_type` (text: baptism, church_membership, marriage, birth_of_child, beginning_ministry, mission_trip, major_prayer_answered, completed_bible_journey, reconciliation, career_transition, retirement, custom)
- `title` (text)
- `milestone_date` (date)
- `church_name` (text, nullable)
- `pastor_name` (text, nullable)
- `scripture` (text, nullable)
- `reflection` (text, nullable)
- `in_vault` (boolean, default false)
- `archived` (boolean, default false)
- `deleted_at` (timestamptz, nullable)
- `created_at`, `updated_at` (timestamptz)

### 5. `legacy_testimony`
User's testimony — guided prompts, user-written
- `id` (uuid PK)
- `profile_id` (uuid, unique — one testimony per user)
- `before_christ` (text, nullable)
- `how_i_came_to_understand` (text, nullable)
- `repentance_and_faith` (text, nullable)
- `how_christ_changed_my_life` (text, nullable)
- `what_im_still_learning` (text, nullable)
- `scripture_that_matters` (text, nullable)
- `ai_organized_version` (text, nullable — AI reorganized from user's words, separate)
- `deleted_at` (timestamptz, nullable)
- `created_at`, `updated_at` (timestamptz)

### 6. `legacy_scripture_refs`
Scripture passages the user intentionally marked as significant
- `id` (uuid PK)
- `profile_id` (uuid)
- `passage_reference` (text — e.g., "Romans 8", "Psalm 23")
- `book` (text — e.g., "Romans", "Psalms")
- `date_marked` (date)
- `life_season_id` (uuid, nullable — FK to legacy_life_seasons)
- `why_it_mattered` (text, nullable)
- `user_reflection` (text, nullable)
- `related_prayer_id` (uuid, nullable)
- `related_sermon_id` (uuid, nullable)
- `related_family_walk_id` (uuid, nullable)
- `in_vault` (boolean, default false)
- `archived` (boolean, default false)
- `deleted_at` (timestamptz, nullable)
- `created_at`, `updated_at` (timestamptz)

### 7. `legacy_year_reviews`
Year in Review records — generated from verified user records only
- `id` (uuid PK)
- `profile_id` (uuid)
- `year` (integer)
- `scripture_summary` (text, nullable)
- `prayer_summary` (text, nullable)
- `seasons_summary` (text, nullable)
- `family_summary` (text, nullable)
- `church_summary` (text, nullable)
- `growth_summary` (text, nullable)
- `faithfulness_summary` (text, nullable)
- `looking_ahead` (text, nullable — user-written intentions)
- `ai_year_summary` (text, nullable — AI-generated, separate from user text)
- `records_used` (jsonb — array of {type, id, title, date} for Show Records Used)
- `deleted_at` (timestamptz, nullable)
- `created_at`, `updated_at` (timestamptz)

### 8. `legacy_designated_persons`
Future-facing: a trusted person the user may eventually authorize
- `id` (uuid PK)
- `profile_id` (uuid)
- `person_label` (text)
- `person_email` (text, nullable)
- `relationship` (text, nullable)
- `selected_record_ids` (uuid[], nullable)
- `conditions` (text, nullable)
- `status` (text: draft, pending, active, revoked — default draft)
- `created_at`, `updated_at` (timestamptz)

## Security (RLS)
All tables use single-tenant anon-accessible policies (TO anon, authenticated)
since this app has no sign-in screen. All data is intentionally accessible
to the anon-key client. Privacy is enforced at the application layer.

## Important Notes
1. `user_text` and `ai_summary` are ALWAYS separate columns — AI never overwrites user words
2. No score, ranking, or rating columns exist in any table
3. No circle_id or church_id columns — Legacy is fully isolated from community systems
4. `source_id` references original records but deleting a Legacy link does not delete the source
5. `records_used` in year_reviews is jsonb for transparency — users can inspect what AI used
6. Soft deletes via `deleted_at` on all tables — no hard deletes from the app
*/

-- ============================================================
-- 1. legacy_events
-- ============================================================
CREATE TABLE IF NOT EXISTS legacy_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  event_type text NOT NULL,
  title text NOT NULL,
  event_date date NOT NULL DEFAULT CURRENT_DATE,
  source_type text NOT NULL DEFAULT 'user_created',
  source_id uuid,
  summary text,
  user_text text,
  ai_summary text,
  scripture_references text[],
  prayer_id uuid,
  life_season_id uuid,
  family_member_reference text,
  church_reference text,
  visibility text NOT NULL DEFAULT 'PRIVATE',
  share_status text NOT NULL DEFAULT 'not_shared',
  user_verified boolean NOT NULL DEFAULT true,
  in_vault boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE legacy_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_legacy_events_profile_date ON legacy_events(profile_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_legacy_events_type ON legacy_events(profile_id, event_type);
CREATE INDEX IF NOT EXISTS idx_legacy_events_season ON legacy_events(profile_id, life_season_id);
CREATE INDEX IF NOT EXISTS idx_legacy_events_vault ON legacy_events(profile_id, in_vault) WHERE in_vault = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_legacy_events_not_deleted ON legacy_events(profile_id) WHERE deleted_at IS NULL;

DROP POLICY IF EXISTS "anon_select_legacy_events" ON legacy_events;
CREATE POLICY "anon_select_legacy_events" ON legacy_events FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_legacy_events" ON legacy_events;
CREATE POLICY "anon_insert_legacy_events" ON legacy_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_legacy_events" ON legacy_events;
CREATE POLICY "anon_update_legacy_events" ON legacy_events FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_legacy_events" ON legacy_events;
CREATE POLICY "anon_delete_legacy_events" ON legacy_events FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 2. legacy_life_seasons
-- ============================================================
CREATE TABLE IF NOT EXISTS legacy_life_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  scripture text,
  prayer text,
  what_im_learning text,
  people_involved text,
  season_reflection text,
  archived boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE legacy_life_seasons ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_legacy_seasons_profile ON legacy_life_seasons(profile_id, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_legacy_seasons_not_deleted ON legacy_life_seasons(profile_id) WHERE deleted_at IS NULL;

DROP POLICY IF EXISTS "anon_select_legacy_seasons" ON legacy_life_seasons;
CREATE POLICY "anon_select_legacy_seasons" ON legacy_life_seasons FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_legacy_seasons" ON legacy_life_seasons;
CREATE POLICY "anon_insert_legacy_seasons" ON legacy_life_seasons FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_legacy_seasons" ON legacy_life_seasons;
CREATE POLICY "anon_update_legacy_seasons" ON legacy_life_seasons FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_legacy_seasons" ON legacy_life_seasons;
CREATE POLICY "anon_delete_legacy_seasons" ON legacy_life_seasons FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 3. legacy_letters
-- ============================================================
CREATE TABLE IF NOT EXISTS legacy_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  letter_type text NOT NULL DEFAULT 'custom',
  recipient_label text,
  body text NOT NULL,
  ai_organized_body text,
  scripture_reference text,
  target_date date,
  legacy_attachments uuid[],
  visibility text NOT NULL DEFAULT 'PRIVATE',
  archived boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE legacy_letters ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_legacy_letters_profile ON legacy_letters(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_legacy_letters_not_deleted ON legacy_letters(profile_id) WHERE deleted_at IS NULL;

DROP POLICY IF EXISTS "anon_select_legacy_letters" ON legacy_letters;
CREATE POLICY "anon_select_legacy_letters" ON legacy_letters FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_legacy_letters" ON legacy_letters;
CREATE POLICY "anon_insert_legacy_letters" ON legacy_letters FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_legacy_letters" ON legacy_letters;
CREATE POLICY "anon_update_legacy_letters" ON legacy_letters FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_legacy_letters" ON legacy_letters;
CREATE POLICY "anon_delete_legacy_letters" ON legacy_letters FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 4. legacy_milestones
-- ============================================================
CREATE TABLE IF NOT EXISTS legacy_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  milestone_type text NOT NULL DEFAULT 'custom',
  title text NOT NULL,
  milestone_date date NOT NULL DEFAULT CURRENT_DATE,
  church_name text,
  pastor_name text,
  scripture text,
  reflection text,
  in_vault boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE legacy_milestones ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_legacy_milestones_profile ON legacy_milestones(profile_id, milestone_date DESC);
CREATE INDEX IF NOT EXISTS idx_legacy_milestones_not_deleted ON legacy_milestones(profile_id) WHERE deleted_at IS NULL;

DROP POLICY IF EXISTS "anon_select_legacy_milestones" ON legacy_milestones;
CREATE POLICY "anon_select_legacy_milestones" ON legacy_milestones FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_legacy_milestones" ON legacy_milestones;
CREATE POLICY "anon_insert_legacy_milestones" ON legacy_milestones FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_legacy_milestones" ON legacy_milestones;
CREATE POLICY "anon_update_legacy_milestones" ON legacy_milestones FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_legacy_milestones" ON legacy_milestones;
CREATE POLICY "anon_delete_legacy_milestones" ON legacy_milestones FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 5. legacy_testimony
-- ============================================================
CREATE TABLE IF NOT EXISTS legacy_testimony (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE,
  before_christ text,
  how_i_came_to_understand text,
  repentance_and_faith text,
  how_christ_changed_my_life text,
  what_im_still_learning text,
  scripture_that_matters text,
  ai_organized_version text,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE legacy_testimony ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_legacy_testimony_profile ON legacy_testimony(profile_id) WHERE deleted_at IS NULL;

DROP POLICY IF EXISTS "anon_select_legacy_testimony" ON legacy_testimony;
CREATE POLICY "anon_select_legacy_testimony" ON legacy_testimony FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_legacy_testimony" ON legacy_testimony;
CREATE POLICY "anon_insert_legacy_testimony" ON legacy_testimony FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_legacy_testimony" ON legacy_testimony;
CREATE POLICY "anon_update_legacy_testimony" ON legacy_testimony FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_legacy_testimony" ON legacy_testimony;
CREATE POLICY "anon_delete_legacy_testimony" ON legacy_testimony FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 6. legacy_scripture_refs
-- ============================================================
CREATE TABLE IF NOT EXISTS legacy_scripture_refs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  passage_reference text NOT NULL,
  book text NOT NULL,
  date_marked date NOT NULL DEFAULT CURRENT_DATE,
  life_season_id uuid,
  why_it_mattered text,
  user_reflection text,
  related_prayer_id uuid,
  related_sermon_id uuid,
  related_family_walk_id uuid,
  in_vault boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE legacy_scripture_refs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_legacy_scripture_profile ON legacy_scripture_refs(profile_id, date_marked DESC);
CREATE INDEX IF NOT EXISTS idx_legacy_scripture_book ON legacy_scripture_refs(profile_id, book);
CREATE INDEX IF NOT EXISTS idx_legacy_scripture_not_deleted ON legacy_scripture_refs(profile_id) WHERE deleted_at IS NULL;

DROP POLICY IF EXISTS "anon_select_legacy_scripture" ON legacy_scripture_refs;
CREATE POLICY "anon_select_legacy_scripture" ON legacy_scripture_refs FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_legacy_scripture" ON legacy_scripture_refs;
CREATE POLICY "anon_insert_legacy_scripture" ON legacy_scripture_refs FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_legacy_scripture" ON legacy_scripture_refs;
CREATE POLICY "anon_update_legacy_scripture" ON legacy_scripture_refs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_legacy_scripture" ON legacy_scripture_refs;
CREATE POLICY "anon_delete_legacy_scripture" ON legacy_scripture_refs FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 7. legacy_year_reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS legacy_year_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  year integer NOT NULL,
  scripture_summary text,
  prayer_summary text,
  seasons_summary text,
  family_summary text,
  church_summary text,
  growth_summary text,
  faithfulness_summary text,
  looking_ahead text,
  ai_year_summary text,
  records_used jsonb NOT NULL DEFAULT '[]'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, year)
);

ALTER TABLE legacy_year_reviews ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_legacy_year_reviews_profile ON legacy_year_reviews(profile_id, year DESC);
CREATE INDEX IF NOT EXISTS idx_legacy_year_reviews_not_deleted ON legacy_year_reviews(profile_id) WHERE deleted_at IS NULL;

DROP POLICY IF EXISTS "anon_select_legacy_year_reviews" ON legacy_year_reviews;
CREATE POLICY "anon_select_legacy_year_reviews" ON legacy_year_reviews FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_legacy_year_reviews" ON legacy_year_reviews;
CREATE POLICY "anon_insert_legacy_year_reviews" ON legacy_year_reviews FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_legacy_year_reviews" ON legacy_year_reviews;
CREATE POLICY "anon_update_legacy_year_reviews" ON legacy_year_reviews FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_legacy_year_reviews" ON legacy_year_reviews;
CREATE POLICY "anon_delete_legacy_year_reviews" ON legacy_year_reviews FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 8. legacy_designated_persons
-- ============================================================
CREATE TABLE IF NOT EXISTS legacy_designated_persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  person_label text NOT NULL,
  person_email text,
  relationship text,
  selected_record_ids uuid[],
  conditions text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE legacy_designated_persons ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_legacy_persons_profile ON legacy_designated_persons(profile_id);

DROP POLICY IF EXISTS "anon_select_legacy_persons" ON legacy_designated_persons;
CREATE POLICY "anon_select_legacy_persons" ON legacy_designated_persons FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_legacy_persons" ON legacy_designated_persons;
CREATE POLICY "anon_insert_legacy_persons" ON legacy_designated_persons FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_legacy_persons" ON legacy_designated_persons;
CREATE POLICY "anon_update_legacy_persons" ON legacy_designated_persons FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_legacy_persons" ON legacy_designated_persons;
CREATE POLICY "anon_delete_legacy_persons" ON legacy_designated_persons FOR DELETE
  TO anon, authenticated USING (true);