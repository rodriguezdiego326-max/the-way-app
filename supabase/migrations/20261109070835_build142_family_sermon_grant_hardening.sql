/*
# Build 142: Family Sermon Discussions grant hardening

1. Problem
- The table-wide default privileges for the authenticated role gave the owner UPDATE on every column, plus TRUNCATE, REFERENCES, and TRIGGER.
- That let a signed-in user change saved content or the Family Profile reference, and TRUNCATE bypasses row level security.

2. Change
- Remove all table privileges from authenticated and anon.
- Grant SELECT and DELETE on the table.
- Grant INSERT only on the content columns the app sends (never id, status, completed_at, or created_at).
- Grant UPDATE only on status and completed_at.

3. Security
- Row level security policies are unchanged.
*/

REVOKE ALL ON family_sermon_discussions FROM anon, authenticated;
GRANT SELECT, DELETE ON family_sermon_discussions TO authenticated;
GRANT INSERT (family_profile_id, sermon_title, main_point, scripture_references, discussion_question, discussion_body) ON family_sermon_discussions TO authenticated;
GRANT UPDATE (status, completed_at) ON family_sermon_discussions TO authenticated;
