/*
# Build 141: Circle Sermon Discussions

1. New Table
- `circle_sermon_discussions` holds one explicit, user-approved sermon discussion shared to a Together Circle.
- Columns: id, circle_id (cascades from circles), created_by_profile_id (cascades from auth users), sermon_title (optional, max 120), discussion_body (required, trimmed, max 2000), scripture_references (text array, max 5, unique, each 1 to 120 characters), created_at, updated_at.
- No recording, transcript, audio, job, provider, or AI metadata columns exist on this table.

2. Helper
- `private.sermon_refs_valid(text[])` checks the Scripture reference array rules used by a CHECK constraint.

3. Security
- Row level security is enabled.
- SELECT: current Circle members only (via existing membership helper).
- INSERT: creator must be the signed-in user and a current Circle member.
- UPDATE: creator only, while still a Circle member; restricted to editable columns.
- DELETE: creator only.
- Grants are limited to authenticated users and only the verbs and columns used.

4. Important Notes
- Deleting a Circle or an account removes its discussions (no orphaned shared content).
- No leader moderation rule is added here; only the creator can delete.
*/

CREATE OR REPLACE FUNCTION private.sermon_refs_valid(refs text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT
    cardinality(refs) <= 5
    AND NOT EXISTS (
      SELECT 1 FROM unnest(refs) AS r
      WHERE char_length(btrim(r)) = 0 OR char_length(r) > 120
    )
    AND cardinality(ARRAY(SELECT DISTINCT unnest(refs))) = cardinality(refs);
$$;

CREATE TABLE IF NOT EXISTS circle_sermon_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  created_by_profile_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  sermon_title text NULL,
  discussion_body text NOT NULL,
  scripture_references text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT circle_sermon_discussions_title_len CHECK (sermon_title IS NULL OR char_length(btrim(sermon_title)) BETWEEN 1 AND 120),
  CONSTRAINT circle_sermon_discussions_body_len CHECK (char_length(btrim(discussion_body)) > 0 AND char_length(discussion_body) <= 2000),
  CONSTRAINT circle_sermon_discussions_refs_valid CHECK (private.sermon_refs_valid(scripture_references))
);

CREATE INDEX IF NOT EXISTS circle_sermon_discussions_circle_created_idx
  ON circle_sermon_discussions (circle_id, created_at DESC);

ALTER TABLE circle_sermon_discussions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON circle_sermon_discussions FROM anon;
GRANT SELECT, INSERT, DELETE ON circle_sermon_discussions TO authenticated;
GRANT UPDATE (sermon_title, discussion_body, scripture_references, updated_at) ON circle_sermon_discussions TO authenticated;

DROP POLICY IF EXISTS "select_circle_sermon_discussions" ON circle_sermon_discussions;
CREATE POLICY "select_circle_sermon_discussions" ON circle_sermon_discussions FOR SELECT
  TO authenticated
  USING (private.is_circle_member(circle_id));

DROP POLICY IF EXISTS "insert_circle_sermon_discussions" ON circle_sermon_discussions;
CREATE POLICY "insert_circle_sermon_discussions" ON circle_sermon_discussions FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by_profile_id = auth.uid()
    AND private.is_circle_member(circle_id)
  );

DROP POLICY IF EXISTS "update_circle_sermon_discussions" ON circle_sermon_discussions;
CREATE POLICY "update_circle_sermon_discussions" ON circle_sermon_discussions FOR UPDATE
  TO authenticated
  USING (
    created_by_profile_id = auth.uid()
    AND private.is_circle_member(circle_id)
  )
  WITH CHECK (
    created_by_profile_id = auth.uid()
    AND private.is_circle_member(circle_id)
  );

DROP POLICY IF EXISTS "delete_circle_sermon_discussions" ON circle_sermon_discussions;
CREATE POLICY "delete_circle_sermon_discussions" ON circle_sermon_discussions FOR DELETE
  TO authenticated
  USING (created_by_profile_id = auth.uid());
