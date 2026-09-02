-- Phase 15.1: Remove unsafe DEFAULT auth.uid() from legacy_events.profile_id
-- profiles.id defaults to gen_random_uuid(), NOT auth.uid().
-- legacy_events.profile_id stores profiles.id, not auth.users.id.
-- All code paths explicitly pass profile_id, so the default is never used,
-- but leaving DEFAULT auth.uid() is semantically incorrect and could cause
-- a foreign key violation if a future code path omits profile_id.
ALTER TABLE legacy_events ALTER COLUMN profile_id DROP DEFAULT;
