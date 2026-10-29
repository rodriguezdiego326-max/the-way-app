/*
# Prayer sessions for the personal Prayer Journey

1. New Table
- `prayer_sessions`: one row each time the owner intentionally returns to and prays through one of their own prayers.
- Columns: id, user_id (owner, defaults to the signed-in user), prayer_id (the prayer prayed through), prayed_at, created_at.
- No status, score, duration, mood, or AI fields. Rows never change prayer text, status, or answered state.

2. Security
- Row level security enabled.
- Only the `authenticated` role is granted, and only SELECT, INSERT, and DELETE. There is no UPDATE grant.
- SELECT and DELETE require the row owner to be the signed-in user.
- INSERT requires the owner to be the signed-in user AND the referenced prayer to belong to that same user.

3. Notes
- Rows cascade-delete with the owning prayer and with the owning account.
- Indexes on user_id, prayer_id, and prayed_at support the journey timeline.
*/

CREATE TABLE IF NOT EXISTS prayer_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  prayer_id uuid NOT NULL REFERENCES prayers(id) ON DELETE CASCADE,
  prayed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS prayer_sessions_user_id_idx ON prayer_sessions (user_id);
CREATE INDEX IF NOT EXISTS prayer_sessions_prayer_id_idx ON prayer_sessions (prayer_id);
CREATE INDEX IF NOT EXISTS prayer_sessions_prayed_at_idx ON prayer_sessions (prayed_at);

ALTER TABLE prayer_sessions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON prayer_sessions TO authenticated;

DROP POLICY IF EXISTS "select_own_prayer_sessions" ON prayer_sessions;
CREATE POLICY "select_own_prayer_sessions" ON prayer_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_prayer_sessions" ON prayer_sessions;
CREATE POLICY "insert_own_prayer_sessions" ON prayer_sessions FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM prayers
      WHERE prayers.id = prayer_sessions.prayer_id
        AND prayers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_own_prayer_sessions" ON prayer_sessions;
CREATE POLICY "delete_own_prayer_sessions" ON prayer_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
