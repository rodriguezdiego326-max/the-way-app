
-- Set DEFAULT auth.uid() on user_id columns that are NOT NULL with no default.
-- This fixes INSERT failures (error 23502) where the client never sends user_id.
-- RLS policies (auth.uid() = user_id) remain unchanged and still enforce ownership.
-- This STRENGTHENS security: user_id is always set to the authenticated user,
-- and RLS still rejects any client-supplied user_id that doesn't match auth.uid().

ALTER TABLE prayers ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE ask_conversations ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE ask_messages ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE church_profiles ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE prayer_updates ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE memories ALTER COLUMN user_id SET DEFAULT auth.uid();
