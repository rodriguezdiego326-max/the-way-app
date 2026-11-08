/*
# Enable scheduling and HTTP extensions for transcription cleanup

1. New Extensions
- `pg_cron`: runs the hourly cleanup of abandoned temporary transcription audio.
- `pg_net`: lets the scheduled job call the cleanup Edge Function over HTTPS.

2. Security
- Extensions add no user-facing tables. No client role receives new privileges.

3. Important Notes
- Creating an extension that already exists is a no-op, so this migration is safe to re-run.
*/

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
