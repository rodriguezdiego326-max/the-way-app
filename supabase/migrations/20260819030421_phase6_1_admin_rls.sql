-- ============================================================
-- THE WAY Phase 6.1 — Admin Role RLS Enforcement
-- Restricts write access to library_sources, source_chunks,
-- library_authors, library_creeds, library_confessions,
-- bible_translations, doctrine_taxonomy, and retrieval_log
-- to admin role only.
-- ============================================================

-- Create an is_admin() function that checks for an admin role claim
-- In production this would check auth.jwt ->> 'role' = 'admin'
-- For now, we use a simpler approach: a settings table
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_app_settings" ON app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_app_settings" ON app_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_app_settings" ON app_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Default: admin mode enabled for development (no auth yet)
INSERT INTO app_settings (key, value)
VALUES ('admin_mode', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Function to check admin access
-- In production with auth: return auth.jwt() ->> 'role' = 'admin'
-- In development: check app_settings
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
DECLARE
  admin_val JSONB;
BEGIN
  SELECT value INTO admin_val FROM app_settings WHERE key = 'admin_mode';
  RETURN COALESCE((admin_val ->> 'value')::boolean, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- Replace library_sources write policies to require admin
-- ============================================================
DROP POLICY IF EXISTS "anon_insert_library_sources" ON library_sources;
DROP POLICY IF EXISTS "anon_update_library_sources" ON library_sources;
DROP POLICY IF EXISTS "anon_delete_library_sources" ON library_sources;

CREATE POLICY "admin_insert_library_sources" ON library_sources FOR INSERT
  TO anon, authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_library_sources" ON library_sources FOR UPDATE
  TO anon, authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_library_sources" ON library_sources FOR DELETE
  TO anon, authenticated USING (is_admin());

-- ============================================================
-- Replace source_chunks write policies to require admin
-- ============================================================
DROP POLICY IF EXISTS "anon_insert_source_chunks" ON source_chunks;
DROP POLICY IF EXISTS "anon_update_source_chunks" ON source_chunks;
DROP POLICY IF EXISTS "anon_delete_source_chunks" ON source_chunks;

CREATE POLICY "admin_insert_source_chunks" ON source_chunks FOR INSERT
  TO anon, authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_source_chunks" ON source_chunks FOR UPDATE
  TO anon, authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_source_chunks" ON source_chunks FOR DELETE
  TO anon, authenticated USING (is_admin());

-- ============================================================
-- Replace library_authors write policies to require admin
-- ============================================================
DROP POLICY IF EXISTS "anon_insert_library_authors" ON library_authors;
DROP POLICY IF EXISTS "anon_update_library_authors" ON library_authors;
DROP POLICY IF EXISTS "anon_delete_library_authors" ON library_authors;

CREATE POLICY "admin_insert_library_authors" ON library_authors FOR INSERT
  TO anon, authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_library_authors" ON library_authors FOR UPDATE
  TO anon, authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_library_authors" ON library_authors FOR DELETE
  TO anon, authenticated USING (is_admin());

-- ============================================================
-- Replace library_creeds write policies to require admin
-- ============================================================
DROP POLICY IF EXISTS "anon_insert_library_creeds" ON library_creeds;
DROP POLICY IF EXISTS "anon_update_library_creeds" ON library_creeds;
DROP POLICY IF EXISTS "anon_delete_library_creeds" ON library_creeds;

CREATE POLICY "admin_insert_library_creeds" ON library_creeds FOR INSERT
  TO anon, authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_library_creeds" ON library_creeds FOR UPDATE
  TO anon, authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_library_creeds" ON library_creeds FOR DELETE
  TO anon, authenticated USING (is_admin());

-- ============================================================
-- Replace library_confessions write policies to require admin
-- ============================================================
DROP POLICY IF EXISTS "anon_insert_library_confessions" ON library_confessions;
DROP POLICY IF EXISTS "anon_update_library_confessions" ON library_confessions;
DROP POLICY IF EXISTS "anon_delete_library_confessions" ON library_confessions;

CREATE POLICY "admin_insert_library_confessions" ON library_confessions FOR INSERT
  TO anon, authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_library_confessions" ON library_confessions FOR UPDATE
  TO anon, authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_library_confessions" ON library_confessions FOR DELETE
  TO anon, authenticated USING (is_admin());

-- ============================================================
-- Replace bible_translations write policies to require admin
-- ============================================================
DROP POLICY IF EXISTS "anon_insert_bible_translations" ON bible_translations;
DROP POLICY IF EXISTS "anon_update_bible_translations" ON bible_translations;
DROP POLICY IF EXISTS "anon_delete_bible_translations" ON bible_translations;

CREATE POLICY "admin_insert_bible_translations" ON bible_translations FOR INSERT
  TO anon, authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_bible_translations" ON bible_translations FOR UPDATE
  TO anon, authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_bible_translations" ON bible_translations FOR DELETE
  TO anon, authenticated USING (is_admin());

-- ============================================================
-- Replace doctrine_taxonomy write policies to require admin
-- ============================================================
DROP POLICY IF EXISTS "anon_insert_doctrine_taxonomy" ON doctrine_taxonomy;
DROP POLICY IF EXISTS "anon_update_doctrine_taxonomy" ON doctrine_taxonomy;
DROP POLICY IF EXISTS "anon_delete_doctrine_taxonomy" ON doctrine_taxonomy;

CREATE POLICY "admin_insert_doctrine_taxonomy" ON doctrine_taxonomy FOR INSERT
  TO anon, authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_doctrine_taxonomy" ON doctrine_taxonomy FOR UPDATE
  TO anon, authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_doctrine_taxonomy" ON doctrine_taxonomy FOR DELETE
  TO anon, authenticated USING (is_admin());

-- ============================================================
-- retrieval_log: allow insert from anon (for logging) but
-- restrict delete to admin only
-- ============================================================
DROP POLICY IF EXISTS "anon_delete_retrieval_log" ON retrieval_log;
CREATE POLICY "admin_delete_retrieval_log" ON retrieval_log FOR DELETE
  TO anon, authenticated USING (is_admin());
