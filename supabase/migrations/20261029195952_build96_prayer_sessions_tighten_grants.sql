/*
# Tighten prayer_sessions grants to the minimum needed

1. Modified Tables
- `prayer_sessions`: privileges reduced to what the app uses.

2. Security changes
- Revoke all table privileges from `anon`. The table is owner-only and must not be reachable without sign-in.
- Revoke UPDATE, TRUNCATE, REFERENCES and TRIGGER from `authenticated`. Prayer sessions are append-only records: the app only inserts, reads and deletes its own rows.
- `authenticated` keeps SELECT, INSERT and DELETE. Row level security still limits every operation to the signed-in user's own rows.

3. Notes
- No data is changed. Existing RLS policies are untouched.
*/

REVOKE ALL ON prayer_sessions FROM anon;
REVOKE UPDATE, TRUNCATE, REFERENCES, TRIGGER ON prayer_sessions FROM authenticated;
GRANT SELECT, INSERT, DELETE ON prayer_sessions TO authenticated;
