/*
# Build 142: Family Sermon Discussions

1. New Table
- `family_sermon_discussions` holds one private discussion prepared from a completed sermon and saved to a Family Profile.
- Columns: id, family_profile_id (cascades from family_profiles), sermon_title (optional, max 120), main_point (optional, max 300), scripture_references (text array, max 3, unique, each 1 to 120 characters), discussion_question (optional, max 500), discussion_body (required, max 2000), status (ready or complete), created_at, completed_at.
- No recording, transcript, audio, job, provider, or AI metadata columns exist on this table.

2. Helper
- `private.family_refs_valid(text[])` checks the Scripture reference array rules used by a CHECK constraint.

3. Security
- Row level security is enabled.
- Access is owner only: the Family Profile must belong to the signed-in user (family_profiles.profile_id = auth.uid()).
- INSERT and UPDATE check ownership in WITH CHECK; UPDATE is limited to status and completed_at.
- Grants are limited to authenticated users. anon has no access.

4. Important Notes
- Deleting a Family Profile removes its discussions.
- Only the owner can complete or delete a discussion.
*/

CREATE OR REPLACE FUNCTION private.family_refs_valid(refs text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT
    cardinality(refs) <= 3
    AND NOT EXISTS (
      SELECT 1 FROM unnest(refs) AS r
      WHERE char_length(btrim(r)) = 0 OR char_length(r) > 120
    )
    AND cardinality(ARRAY(SELECT DISTINCT unnest(refs))) = cardinality(refs);
$$;

CREATE TABLE IF NOT EXISTS family_sermon_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_profile_id uuid NOT NULL REFERENCES family_profiles(id) ON DELETE CASCADE,
  sermon_title text NULL,
  main_point text NULL,
  scripture_references text[] NOT NULL DEFAULT '{}',
  discussion_question text NULL,
  discussion_body text NOT NULL,
  status text NOT NULL DEFAULT 'ready',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL,
  CONSTRAINT family_sermon_discussions_title_len CHECK (sermon_title IS NULL OR char_length(btrim(sermon_title)) BETWEEN 1 AND 120),
  CONSTRAINT family_sermon_discussions_main_point_len CHECK (main_point IS NULL OR char_length(btrim(main_point)) BETWEEN 1 AND 300),
  CONSTRAINT family_sermon_discussions_question_len CHECK (discussion_question IS NULL OR char_length(btrim(discussion_question)) BETWEEN 1 AND 500),
  CONSTRAINT family_sermon_discussions_body_len CHECK (char_length(btrim(discussion_body)) > 0 AND char_length(discussion_body) <= 2000),
  CONSTRAINT family_sermon_discussions_refs_valid CHECK (private.family_refs_valid(scripture_references)),
  CONSTRAINT family_sermon_discussions_status_valid CHECK (status IN ('ready', 'complete')),
  CONSTRAINT family_sermon_discussions_completed_consistent CHECK (
    (status = 'complete' AND completed_at IS NOT NULL) OR (status = 'ready' AND completed_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS family_sermon_discussions_family_profile_id_idx
  ON family_sermon_discussions (family_profile_id, created_at DESC);

ALTER TABLE family_sermon_discussions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON family_sermon_discussions FROM anon, authenticated;
GRANT SELECT, DELETE ON family_sermon_discussions TO authenticated;
GRANT INSERT (family_profile_id, sermon_title, main_point, scripture_references, discussion_question, discussion_body) ON family_sermon_discussions TO authenticated;
GRANT UPDATE (status, completed_at) ON family_sermon_discussions TO authenticated;

DROP POLICY IF EXISTS "select_own_family_sermon_discussions" ON family_sermon_discussions;
CREATE POLICY "select_own_family_sermon_discussions" ON family_sermon_discussions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_profiles fp
      WHERE fp.id = family_sermon_discussions.family_profile_id
        AND fp.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_family_sermon_discussions" ON family_sermon_discussions;
CREATE POLICY "insert_own_family_sermon_discussions" ON family_sermon_discussions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_profiles fp
      WHERE fp.id = family_sermon_discussions.family_profile_id
        AND fp.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_own_family_sermon_discussions" ON family_sermon_discussions;
CREATE POLICY "update_own_family_sermon_discussions" ON family_sermon_discussions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_profiles fp
      WHERE fp.id = family_sermon_discussions.family_profile_id
        AND fp.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_profiles fp
      WHERE fp.id = family_sermon_discussions.family_profile_id
        AND fp.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_own_family_sermon_discussions" ON family_sermon_discussions;
CREATE POLICY "delete_own_family_sermon_discussions" ON family_sermon_discussions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM family_profiles fp
      WHERE fp.id = family_sermon_discussions.family_profile_id
        AND fp.profile_id = auth.uid()
    )
  );
