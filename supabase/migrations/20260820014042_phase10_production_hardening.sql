/*
# Phase 10 — Production Hardening Schema

## Purpose
Adds production hardening infrastructure: feature flags with kill switches,
beta feedback system, and fixes mutable search_path on existing SECURITY DEFINER functions.

## New Tables

### 1. `feature_flags`
Server-controlled feature flags for major systems. Allows disabling a broken
feature without full redeploy. Includes kill switches for AI generation,
Circle posting, Church posting, and Legacy AI summaries.
- `id` (uuid PK)
- `flag_key` (text, unique — e.g., 'family', 'reach', 'together', 'church', 'legacy', 'production_ai', 'ai_generation', 'circle_posting', 'church_posting', 'legacy_ai_summaries')
- `is_enabled` (boolean, default true)
- `is_kill_switch` (boolean, default false — emergency disable)
- `description` (text, nullable)
- `updated_at` (timestamptz)
- `created_at` (timestamptz)

### 2. `beta_feedback`
User feedback for beta mode — bug reports, feature requests, theological concerns, privacy concerns.
- `id` (uuid PK)
- `profile_id` (uuid, nullable)
- `feedback_type` (text: bug, confusing_experience, feature_request, theological_concern, privacy_concern, other)
- `description` (text)
- `screen_context` (text, nullable — which screen the user was on)
- `include_history` (boolean, default false — user explicitly chooses to attach context)
- `status` (text: open, reviewed, resolved — default open)
- `created_at` (timestamptz)

## Modified Objects
### Fixed: SECURITY DEFINER function search_path
- `is_admin()` — added `SET search_path = public`
- `is_circle_member()` — added `SET search_path = public`
- `is_circle_leader()` — added `SET search_path = public`
- `can_perform_church_admin_action()` — added `SET search_path = public`

## Security
- RLS enabled on all new tables with anon+authenticated access (single-tenant app)
- Feature flags are readable by all (needed for app to check state), writable by all (admin tool)
- Beta feedback is writable by all, readable by all (admin review)

## Important Notes
1. Feature flags allow emergency disabling of AI, Circle posting, Church posting, Legacy AI summaries
2. Kill switches do NOT delete user data — they disable the feature
3. Beta feedback does not auto-include sensitive user history unless user explicitly opts in
4. The search_path fix prevents search_path injection attacks on SECURITY DEFINER functions
5. Existing tables (ai_usage_log, rate_limit_buckets, audit_trail, app_settings, system_versions) already exist from Phase 7
*/

-- ============================================================
-- Fix mutable search_path on existing SECURITY DEFINER functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'app_settings'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_circle_member(check_circle_id uuid, check_profile_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE circle_members.circle_id = check_circle_id
    AND circle_members.profile_id = check_profile_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_circle_leader(check_circle_id uuid, check_profile_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE circle_members.circle_id = check_circle_id
    AND circle_members.profile_id = check_profile_id
    AND circle_members.role IN ('OWNER', 'LEADER', 'PASTOR', 'CHURCH_LEADER')
  );
$$;

CREATE OR REPLACE FUNCTION public.can_perform_church_admin_action(check_profile_id uuid, check_church_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.church_memberships
    WHERE church_memberships.profile_id = check_profile_id
    AND church_memberships.church_id = check_church_id
    AND church_memberships.verified_church_role IS NOT NULL
  );
$$;

-- ============================================================
-- 1. feature_flags
-- ============================================================
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text UNIQUE NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  is_kill_switch boolean NOT NULL DEFAULT false,
  description text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(flag_key);

DROP POLICY IF EXISTS "anon_select_feature_flags" ON feature_flags;
CREATE POLICY "anon_select_feature_flags" ON feature_flags FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_feature_flags" ON feature_flags;
CREATE POLICY "anon_insert_feature_flags" ON feature_flags FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_feature_flags" ON feature_flags;
CREATE POLICY "anon_update_feature_flags" ON feature_flags FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_feature_flags" ON feature_flags;
CREATE POLICY "anon_delete_feature_flags" ON feature_flags FOR DELETE
  TO anon, authenticated USING (true);

-- Seed default feature flags
INSERT INTO feature_flags (flag_key, is_enabled, is_kill_switch, description) VALUES
  ('family', true, false, 'Family system'),
  ('reach', true, false, 'REACH evangelism system'),
  ('together', true, false, 'Together Circles system'),
  ('church', true, false, 'My Church system'),
  ('legacy', true, false, 'Legacy system'),
  ('production_ai', true, false, 'Production AI Intelligence'),
  ('ai_generation', true, true, 'Kill switch: AI text generation'),
  ('circle_posting', true, true, 'Kill switch: Circle posting'),
  ('church_posting', true, true, 'Kill switch: Church posting'),
  ('legacy_ai_summaries', true, true, 'Kill switch: Legacy AI summaries')
ON CONFLICT (flag_key) DO NOTHING;

-- ============================================================
-- 2. beta_feedback
-- ============================================================
CREATE TABLE IF NOT EXISTS beta_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid,
  feedback_type text NOT NULL DEFAULT 'other',
  description text NOT NULL,
  screen_context text,
  include_history boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_beta_feedback_status ON beta_feedback(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_type ON beta_feedback(feedback_type);

DROP POLICY IF EXISTS "anon_select_beta_feedback" ON beta_feedback;
CREATE POLICY "anon_select_beta_feedback" ON beta_feedback FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_beta_feedback" ON beta_feedback;
CREATE POLICY "anon_insert_beta_feedback" ON beta_feedback FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_beta_feedback" ON beta_feedback;
CREATE POLICY "anon_update_beta_feedback" ON beta_feedback FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_beta_feedback" ON beta_feedback;
CREATE POLICY "anon_delete_beta_feedback" ON beta_feedback FOR DELETE
  TO anon, authenticated USING (true);