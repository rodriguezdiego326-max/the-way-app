-- ============================================================
-- THE WAY Phase 6 — Verified Theology Library & RAG System
-- Creates new tables alongside existing Phase 2 tables.
-- Existing: sources, theological_authors, confessional_documents,
--           doctrines, source_doctrines, scripture_references
-- ============================================================

-- ============================================================
-- 1. LIBRARY AUTHORS (richer than theological_authors)
-- ============================================================
CREATE TABLE library_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  birth_year INTEGER,
  death_year INTEGER,
  era TEXT,
  theological_tradition TEXT,
  biography_summary TEXT,
  major_works TEXT[],
  doctrine_specialties TEXT[],
  public_domain_default BOOLEAN DEFAULT false,
  source_permissions TEXT DEFAULT 'pending_review',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE library_authors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_library_authors" ON library_authors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_library_authors" ON library_authors FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_library_authors" ON library_authors FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_library_authors" ON library_authors FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 2. LIBRARY SOURCES (verified source registry — richer than sources)
-- ============================================================
CREATE TABLE library_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN (
    'scripture', 'creed', 'confession', 'catechism',
    'historic_theologian', 'modern_teacher',
    'editorial', 'family_discipleship', 'apologetics',
    'church_history', 'biblical_theology'
  )),
  authority_level INTEGER NOT NULL CHECK (authority_level BETWEEN 1 AND 6),
  title TEXT NOT NULL,
  author_id UUID REFERENCES library_authors(id) ON DELETE SET NULL,
  publisher TEXT,
  publication_year INTEGER,
  edition TEXT,
  translator TEXT,
  volume TEXT,
  chapter TEXT,
  section TEXT,
  page_start INTEGER,
  page_end INTEGER,
  source_url TEXT,
  canonical_url TEXT,
  language TEXT DEFAULT 'en',
  copyright_status TEXT NOT NULL DEFAULT 'pending_review' CHECK (copyright_status IN (
    'public_domain', 'copyrighted', 'mixed', 'pending_review', 'licensed'
  )),
  license_type TEXT,
  license_notes TEXT,
  public_domain BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  verified_by TEXT,
  verification_date DATE,
  theological_tradition TEXT,
  content_status TEXT NOT NULL DEFAULT 'draft' CHECK (content_status IN (
    'draft', 'pending_verification', 'verified', 'rejected', 'archived'
  )),
  perspective_profile TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE library_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_library_sources" ON library_sources FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_library_sources" ON library_sources FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_library_sources" ON library_sources FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_library_sources" ON library_sources FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 3. SOURCE CHUNKS (retrieval units)
-- ============================================================
CREATE TABLE source_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES library_sources(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  heading TEXT,
  text TEXT NOT NULL,
  scripture_references TEXT[],
  doctrine_tags TEXT[],
  theological_tags TEXT[],
  historical_period TEXT,
  token_count INTEGER,
  citation_metadata JSONB,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE source_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_source_chunks" ON source_chunks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_source_chunks" ON source_chunks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_source_chunks" ON source_chunks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_source_chunks" ON source_chunks FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 4. DOCTRINE TAXONOMY (stable IDs, richer than doctrines)
-- ============================================================
CREATE TABLE doctrine_taxonomy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctrine_id TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  parent_doctrine_id TEXT REFERENCES doctrine_taxonomy(doctrine_id),
  scripture_references TEXT[],
  confession_references TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE doctrine_taxonomy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_doctrine_taxonomy" ON doctrine_taxonomy FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_doctrine_taxonomy" ON doctrine_taxonomy FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_doctrine_taxonomy" ON doctrine_taxonomy FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_doctrine_taxonomy" ON doctrine_taxonomy FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 5. BIBLE TRANSLATIONS (licensing metadata — no text stored)
-- ============================================================
CREATE TABLE bible_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_code TEXT NOT NULL UNIQUE,
  translation_name TEXT NOT NULL,
  copyright_holder TEXT,
  license_type TEXT,
  usage_limitations TEXT,
  api_provider TEXT,
  attribution_requirements TEXT,
  offline_storage_permitted BOOLEAN DEFAULT false,
  commercial_usage_permitted BOOLEAN DEFAULT false,
  public_domain BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE bible_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_bible_translations" ON bible_translations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_bible_translations" ON bible_translations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_bible_translations" ON bible_translations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_bible_translations" ON bible_translations FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 6. LIBRARY CREEDS (historic orthodox creeds)
-- ============================================================
CREATE TABLE library_creeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  historical_date TEXT,
  tradition TEXT,
  section TEXT,
  text TEXT NOT NULL,
  source TEXT,
  public_domain BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE library_creeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_library_creeds" ON library_creeds FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_library_creeds" ON library_creeds FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_library_creeds" ON library_creeds FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_library_creeds" ON library_creeds FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 7. LIBRARY CONFESSIONS (section-level records)
-- ============================================================
CREATE TABLE library_confessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confession_name TEXT NOT NULL,
  chapter_number INTEGER,
  chapter_title TEXT,
  question_number INTEGER,
  question TEXT,
  answer TEXT,
  text TEXT NOT NULL,
  scripture_references TEXT[],
  doctrine_tags TEXT[],
  theological_tradition TEXT,
  public_domain BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE library_confessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_library_confessions" ON library_confessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_library_confessions" ON library_confessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_library_confessions" ON library_confessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_library_confessions" ON library_confessions FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 8. RETRIEVAL LOG (debug/audit trail)
-- ============================================================
CREATE TABLE retrieval_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  detected_intent TEXT,
  detected_doctrine TEXT[],
  retrieved_source_ids UUID[],
  rejected_source_ids UUID[],
  ranking JSONB,
  final_context_summary TEXT,
  citations_generated JSONB,
  theological_validation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE retrieval_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_retrieval_log" ON retrieval_log FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_retrieval_log" ON retrieval_log FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_delete_retrieval_log" ON retrieval_log FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 9. Add columns to existing scripture_references for Phase 6
-- ============================================================
ALTER TABLE scripture_references ADD COLUMN IF NOT EXISTS testament TEXT CHECK (testament IN ('OT', 'NT'));
ALTER TABLE scripture_references ADD COLUMN IF NOT EXISTS passage_grouping TEXT;
ALTER TABLE scripture_references ADD COLUMN IF NOT EXISTS context_range TEXT;
ALTER TABLE scripture_references ADD COLUMN IF NOT EXISTS doctrine_tags TEXT[];

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_source_chunks_source ON source_chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_source_chunks_doctrine ON source_chunks USING GIN (doctrine_tags);
CREATE INDEX IF NOT EXISTS idx_source_chunks_scripture ON source_chunks USING GIN (scripture_references);
CREATE INDEX IF NOT EXISTS idx_library_sources_type ON library_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_library_sources_authority ON library_sources(authority_level);
CREATE INDEX IF NOT EXISTS idx_library_sources_verified ON library_sources(verified);
CREATE INDEX IF NOT EXISTS idx_library_sources_content_status ON library_sources(content_status);
CREATE INDEX IF NOT EXISTS idx_doctrine_taxonomy_category ON doctrine_taxonomy(category);
CREATE INDEX IF NOT EXISTS idx_library_confessions_name ON library_confessions(confession_name);
