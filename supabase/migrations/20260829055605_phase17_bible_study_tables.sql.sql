/*
# Phase 17 — Bible Study Tables

## Purpose
Create the database schema for SOLAPATH's digital inductive study Bible.
All tables are private user-owned data protected by RLS.

## New Tables

1. **bible_notes** — User notes attached to specific verse ranges
   - Supports OIA (Observation/Interpretation/Application) categories plus Prayer, Question, Word Study, Cross Reference, Sermon, General
   - Stores book, chapter, verse_start, verse_end, translation, note_type, title, content

2. **bible_highlights** — Color-coded verse highlights
   - User-configurable color keys (gold, blue, green, red, purple)
   - Scoped to book, chapter, verse range, translation

3. **bible_keywords** — User's private keyword library
   - name, color_key, mark_style, symbol, description
   - User creates and owns their keyword definitions

4. **bible_keyword_marks** — Marks of specific keywords at specific verse locations
   - Links keyword to verse with optional offset range and mark style

5. **bible_chapter_notes** — Chapter-level study notes (theme, key people, repeated words, etc.)
   - Digital equivalent of wide-margin chapter notes
   - All fields optional

6. **bible_bookmarks** — Saved passage bookmarks (separate from highlights)

7. **bible_reading_history** — Last-read location for "Continue Reading"
   - One row per user (upserted), stores translation, book, chapter, optional verse, scroll position

## Security
- All tables have RLS enabled
- All policies scope to `TO authenticated` with `auth.uid() = user_id`
- Anon role has NO access to any Bible study table
- Owner columns default to `auth.uid()` so client inserts that omit user_id still satisfy RLS
- 4 separate policies per table (SELECT, INSERT, UPDATE, DELETE) — no FOR ALL

## Notes
- No copyrighted Scripture text is stored in these tables — only references and user content
- All tables use `gen_random_uuid()` for primary keys
- Foreign keys reference `auth.users(id)` with `ON DELETE CASCADE`
*/
-- ============================================================
-- bible_notes
-- ============================================================
CREATE TABLE IF NOT EXISTS bible_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  translation text NOT NULL DEFAULT 'WEB',
  book text NOT NULL,
  chapter int NOT NULL,
  verse_start int NOT NULL,
  verse_end int NOT NULL,
  note_type text NOT NULL DEFAULT 'general' CHECK (note_type IN ('observation','interpretation','application','prayer','question','word_study','cross_reference','sermon','general')),
  title text,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bible_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bible_notes" ON bible_notes;
CREATE POLICY "select_own_bible_notes" ON bible_notes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bible_notes" ON bible_notes;
CREATE POLICY "insert_own_bible_notes" ON bible_notes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bible_notes" ON bible_notes;
CREATE POLICY "update_own_bible_notes" ON bible_notes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_bible_notes" ON bible_notes;
CREATE POLICY "delete_own_bible_notes" ON bible_notes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- bible_highlights
-- ============================================================
CREATE TABLE IF NOT EXISTS bible_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  translation text NOT NULL DEFAULT 'WEB',
  book text NOT NULL,
  chapter int NOT NULL,
  verse_start int NOT NULL,
  verse_end int NOT NULL,
  color_key text NOT NULL DEFAULT 'gold' CHECK (color_key IN ('gold','blue','green','red','purple')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bible_highlights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bible_highlights" ON bible_highlights;
CREATE POLICY "select_own_bible_highlights" ON bible_highlights FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bible_highlights" ON bible_highlights;
CREATE POLICY "insert_own_bible_highlights" ON bible_highlights FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bible_highlights" ON bible_highlights;
CREATE POLICY "update_own_bible_highlights" ON bible_highlights FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_bible_highlights" ON bible_highlights;
CREATE POLICY "delete_own_bible_highlights" ON bible_highlights FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- bible_keywords
-- ============================================================
CREATE TABLE IF NOT EXISTS bible_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color_key text NOT NULL DEFAULT 'gold' CHECK (color_key IN ('gold','blue','green','red','purple')),
  mark_style text NOT NULL DEFAULT 'highlight' CHECK (mark_style IN ('highlight','underline','double_underline','box','circle','symbol')),
  symbol text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE bible_keywords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bible_keywords" ON bible_keywords;
CREATE POLICY "select_own_bible_keywords" ON bible_keywords FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bible_keywords" ON bible_keywords;
CREATE POLICY "insert_own_bible_keywords" ON bible_keywords FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bible_keywords" ON bible_keywords;
CREATE POLICY "update_own_bible_keywords" ON bible_keywords FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_bible_keywords" ON bible_keywords;
CREATE POLICY "delete_own_bible_keywords" ON bible_keywords FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- bible_keyword_marks
-- ============================================================
CREATE TABLE IF NOT EXISTS bible_keyword_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword_id uuid NOT NULL REFERENCES bible_keywords(id) ON DELETE CASCADE,
  translation text NOT NULL DEFAULT 'WEB',
  book text NOT NULL,
  chapter int NOT NULL,
  verse int NOT NULL,
  start_offset int,
  end_offset int,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bible_keyword_marks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bible_keyword_marks" ON bible_keyword_marks;
CREATE POLICY "select_own_bible_keyword_marks" ON bible_keyword_marks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bible_keyword_marks" ON bible_keyword_marks;
CREATE POLICY "insert_own_bible_keyword_marks" ON bible_keyword_marks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bible_keyword_marks" ON bible_keyword_marks;
CREATE POLICY "update_own_bible_keyword_marks" ON bible_keyword_marks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_bible_keyword_marks" ON bible_keyword_marks;
CREATE POLICY "delete_own_bible_keyword_marks" ON bible_keyword_marks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- bible_chapter_notes
-- ============================================================
CREATE TABLE IF NOT EXISTS bible_chapter_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  translation text NOT NULL DEFAULT 'WEB',
  book text NOT NULL,
  chapter int NOT NULL,
  theme text,
  key_people text,
  repeated_words text,
  commands text,
  promises text,
  questions text,
  observations text,
  application text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, translation, book, chapter)
);

ALTER TABLE bible_chapter_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bible_chapter_notes" ON bible_chapter_notes;
CREATE POLICY "select_own_bible_chapter_notes" ON bible_chapter_notes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bible_chapter_notes" ON bible_chapter_notes;
CREATE POLICY "insert_own_bible_chapter_notes" ON bible_chapter_notes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bible_chapter_notes" ON bible_chapter_notes;
CREATE POLICY "update_own_bible_chapter_notes" ON bible_chapter_notes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_bible_chapter_notes" ON bible_chapter_notes;
CREATE POLICY "delete_own_bible_chapter_notes" ON bible_chapter_notes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- bible_bookmarks
-- ============================================================
CREATE TABLE IF NOT EXISTS bible_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  translation text NOT NULL DEFAULT 'WEB',
  book text NOT NULL,
  chapter int NOT NULL,
  verse_start int NOT NULL,
  verse_end int NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bible_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bible_bookmarks" ON bible_bookmarks;
CREATE POLICY "select_own_bible_bookmarks" ON bible_bookmarks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bible_bookmarks" ON bible_bookmarks;
CREATE POLICY "insert_own_bible_bookmarks" ON bible_bookmarks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bible_bookmarks" ON bible_bookmarks;
CREATE POLICY "update_own_bible_bookmarks" ON bible_bookmarks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_bible_bookmarks" ON bible_bookmarks;
CREATE POLICY "delete_own_bible_bookmarks" ON bible_bookmarks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- bible_reading_history
-- ============================================================
CREATE TABLE IF NOT EXISTS bible_reading_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  translation text NOT NULL DEFAULT 'WEB',
  book text NOT NULL,
  chapter int NOT NULL,
  verse int,
  scroll_position int DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE bible_reading_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bible_reading_history" ON bible_reading_history;
CREATE POLICY "select_own_bible_reading_history" ON bible_reading_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bible_reading_history" ON bible_reading_history;
CREATE POLICY "insert_own_bible_reading_history" ON bible_reading_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bible_reading_history" ON bible_reading_history;
CREATE POLICY "update_own_bible_reading_history" ON bible_reading_history FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_bible_reading_history" ON bible_reading_history;
CREATE POLICY "delete_own_bible_reading_history" ON bible_reading_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- Indexes for common queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_bible_notes_user_book ON bible_notes(user_id, book, chapter);
CREATE INDEX IF NOT EXISTS idx_bible_highlights_user_book ON bible_highlights(user_id, book, chapter);
CREATE INDEX IF NOT EXISTS idx_bible_keyword_marks_user_book ON bible_keyword_marks(user_id, book, chapter);
CREATE INDEX IF NOT EXISTS idx_bible_bookmarks_user ON bible_bookmarks(user_id, created_at DESC);

-- ============================================================
-- updated_at trigger for bible_notes
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_bible_notes_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS bible_notes_updated_at ON bible_notes;
CREATE TRIGGER bible_notes_updated_at
  BEFORE UPDATE ON bible_notes
  FOR EACH ROW EXECUTE FUNCTION trigger_bible_notes_updated_at();

-- ============================================================
-- updated_at trigger for bible_chapter_notes
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_bible_chapter_notes_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS bible_chapter_notes_updated_at ON bible_chapter_notes;
CREATE TRIGGER bible_chapter_notes_updated_at
  BEFORE UPDATE ON bible_chapter_notes
  FOR EACH ROW EXECUTE FUNCTION trigger_bible_chapter_notes_updated_at();

-- ============================================================
-- updated_at trigger for bible_reading_history
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_bible_reading_history_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS bible_reading_history_updated_at ON bible_reading_history;
CREATE TRIGGER bible_reading_history_updated_at
  BEFORE UPDATE ON bible_reading_history
  FOR EACH ROW EXECUTE FUNCTION trigger_bible_reading_history_updated_at();
