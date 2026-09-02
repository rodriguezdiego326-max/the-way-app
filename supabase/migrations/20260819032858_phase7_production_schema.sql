-- ============================================================
-- THE WAY Phase 7 — Production AI & Verified-Source System
-- Schema: regression tests, theological reviews, cost tracking,
-- rate limiting, caching, versioning, audit trail, source batches,
-- release gate, theological concern reports
-- ============================================================

-- ============================================================
-- 1. SYSTEM VERSIONING
-- ============================================================
CREATE TABLE IF NOT EXISTS system_versions (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE system_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_system_versions" ON system_versions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin_insert_system_versions" ON system_versions FOR INSERT TO anon, authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_system_versions" ON system_versions FOR UPDATE TO anon, authenticated USING (is_admin()) WITH CHECK (is_admin());

INSERT INTO system_versions (id, version, description) VALUES
  ('ai_provider', 'v7.0.0-dev', 'Production AI provider abstraction with fallback'),
  ('model', 'development', 'Development fallback — no external model calls'),
  ('system_prompt', 'v7.0', 'THE WAY system rules with retrieval-first theology'),
  ('theological_rules', 'v7.0', 'Authority hierarchy, attribution gate, quote validation'),
  ('retrieval', 'v7.0', 'Verified-only keyword + doctrine-tag retrieval'),
  ('source_library', 'v7.0-batch-a', 'Confessional core + reformation + puritan + Edwards/Princeton'),
  ('regression_tests', 'v7.0', '100+ theological regression tests'),
  ('app', 'v7.0.0', 'THE WAY Phase 7 — production AI pipeline')
ON CONFLICT (id) DO UPDATE SET version = EXCLUDED.version, description = EXCLUDED.description, created_at = now();

-- ============================================================
-- 2. AI COST TRACKING
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  retrieval_operations INTEGER DEFAULT 0,
  model_cost_usd DECIMAL(10,6) DEFAULT 0,
  request_latency_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_log(created_at DESC);

ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_insert_ai_usage" ON ai_usage_log FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_select_ai_usage" ON ai_usage_log FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin_delete_ai_usage" ON ai_usage_log FOR DELETE TO anon, authenticated USING (is_admin());

-- ============================================================
-- 3. RATE LIMITING (server-side token bucket per user/session)
-- ============================================================
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,  -- user_id or session_id or IP
  endpoint TEXT NOT NULL DEFAULT 'intelligence',
  tokens DECIMAL(10,2) DEFAULT 20,
  last_refill_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(identifier, endpoint)
);

ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_rate_limit" ON rate_limit_buckets FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 4. RETRIEVAL CACHE (non-personal theological retrieval results)
-- ============================================================
CREATE TABLE IF NOT EXISTS retrieval_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  query_normalized TEXT NOT NULL,
  retrieval_result JSONB NOT NULL,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_retrieval_cache_key ON retrieval_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_retrieval_cache_expires ON retrieval_cache(expires_at);

ALTER TABLE retrieval_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_retrieval_cache" ON retrieval_cache FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 5. AUDIT TRAIL (non-sensitive metadata for theological QA)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id TEXT NOT NULL,
  model_version TEXT,
  retrieved_source_ids TEXT[],
  validators_passed TEXT[],
  validators_failed TEXT[],
  response_version TEXT,
  provider TEXT,
  confidence_state TEXT,
  source_unavailable BOOLEAN DEFAULT false,
  warnings TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_trail_created ON audit_trail(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trail_query ON audit_trail(query_id);

ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_insert_audit" ON audit_trail FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_select_audit" ON audit_trail FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin_delete_audit" ON audit_trail FOR DELETE TO anon, authenticated USING (is_admin());

-- ============================================================
-- 6. SOURCE BATCHES (ingestion batch tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS source_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_label TEXT NOT NULL,
  batch_type TEXT NOT NULL,  -- 'confessional', 'reformation', 'puritan', 'edwards_princeton', 'modern_reformed', 'modern_teacher'
  sources_added INTEGER DEFAULT 0,
  sources_verified INTEGER DEFAULT 0,
  sources_rejected INTEGER DEFAULT 0,
  chunks_created INTEGER DEFAULT 0,
  doctrines_covered TEXT[],
  tests_run INTEGER DEFAULT 0,
  retrieval_failures INTEGER DEFAULT 0,
  attribution_failures INTEGER DEFAULT 0,
  release_ready BOOLEAN DEFAULT false,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ
);

ALTER TABLE source_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_source_batches" ON source_batches FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin_insert_source_batches" ON source_batches FOR INSERT TO anon, authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_source_batches" ON source_batches FOR UPDATE TO anon, authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- 7. THEOLOGICAL REGRESSION TESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS regression_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  query TEXT NOT NULL,
  expected_properties JSONB NOT NULL,
  last_status TEXT DEFAULT 'pending',  -- 'pass', 'fail', 'pending'
  last_detail TEXT,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_regression_category ON regression_tests(category);
CREATE INDEX IF NOT EXISTS idx_regression_status ON regression_tests(last_status);

ALTER TABLE regression_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_regression" ON regression_tests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin_insert_regression" ON regression_tests FOR INSERT TO anon, authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_regression" ON regression_tests FOR UPDATE TO anon, authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- 8. THEOLOGICAL REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS theological_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id TEXT,
  reviewer_id TEXT,
  response_snapshot JSONB,
  retrieved_source_ids TEXT[],
  review_state TEXT DEFAULT 'pending',  -- 'pending', 'approved', 'concern', 'flagged'
  concern_categories TEXT[],
  reviewer_notes TEXT,
  suggested_correction TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE theological_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_reviews" ON theological_reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_reviews" ON theological_reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admin_update_reviews" ON theological_reviews FOR UPDATE TO anon, authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- 9. THEOLOGICAL CONCERN REPORTS (user-facing)
-- ============================================================
CREATE TABLE IF NOT EXISTS theological_concern_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id TEXT NOT NULL,
  concern_category TEXT NOT NULL,  -- 'misused_scripture', 'incorrect_theology', 'misrepresented_reformed', 'misrepresented_other_view', 'fake_citation', 'unsafe_pastoral', 'other'
  concern_detail TEXT,
  response_snapshot JSONB,
  user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'open',  -- 'open', 'reviewed', 'resolved', 'dismissed'
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_concern_status ON theological_concern_reports(status);

ALTER TABLE theological_concern_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_insert_concern" ON theological_concern_reports FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_select_concern" ON theological_concern_reports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin_update_concern" ON theological_concern_reports FOR UPDATE TO anon, authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- 10. RELEASE GATE
-- ============================================================
CREATE TABLE IF NOT EXISTS release_gate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_label TEXT NOT NULL,
  validation_panel_pass BOOLEAN DEFAULT false,
  no_critical_regression_failures BOOLEAN DEFAULT false,
  no_citation_fabrication BOOLEAN DEFAULT false,
  no_source_status_leakage BOOLEAN DEFAULT false,
  admin_security_passing BOOLEAN DEFAULT false,
  theological_reviewer_approval BOOLEAN DEFAULT false,
  release_ready BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE release_gate ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_release_gate" ON release_gate FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin_insert_release_gate" ON release_gate FOR INSERT TO anon, authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_release_gate" ON release_gate FOR UPDATE TO anon, authenticated USING (is_admin()) WITH CHECK (is_admin());
