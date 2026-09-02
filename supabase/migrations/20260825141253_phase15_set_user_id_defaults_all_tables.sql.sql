-- Phase 15: Set DEFAULT auth.uid() on ALL user_id columns that are NOT NULL with no default.
-- Phase 14 fixed 6 tables but missed 16 others, causing INSERT failures (error 23502).
-- RLS policies (auth.uid() = user_id) remain unchanged and still enforce ownership.

ALTER TABLE walks ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE walk_reflections ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE daily_checkins ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE catechism_progress ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE conversation_practice ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE reach_conversations ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE reach_people ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE reach_prayer_updates ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE prodigal_journey ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE prodigal_updates ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE sermons ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE shared_scripture_studies ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE group_discussions ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE encouragements ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE prayer_acknowledgements ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE circle_check_ins ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Also set default on legacy_events.profile_id (NOT NULL, no default)
ALTER TABLE legacy_events ALTER COLUMN profile_id SET DEFAULT auth.uid();
