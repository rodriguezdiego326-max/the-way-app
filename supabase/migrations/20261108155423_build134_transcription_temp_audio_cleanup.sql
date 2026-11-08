/*
# Automatic cleanup of abandoned temporary transcription audio

1. New Functions (service role only)
- `sermon_transcription_stale_jobs()`: lists transcription job rows that are abandoned. A `processing` job with no activity for 6 hours is abandoned. A `completed`, `failed`, or `cancelled` job older than 1 hour should have been cleaned up already.
- `sermon_transcription_stale_objects()`: lists temporary audio objects in the private `sermon-transcription-temp` bucket that should be deleted. That covers objects of abandoned jobs, and objects older than 24 hours that no longer belong to any job row. Objects for active jobs are never listed.
- `sermon_transcription_cleanup_secret()`: returns the shared secret that the scheduled job sends to the cleanup Edge Function. The secret lives in Vault and is never exposed to browsers.

2. Scheduled Job
- `sermon-transcription-temp-cleanup` runs every hour at minute 0. It calls the `cleanup-sermon-transcription-temp` Edge Function with the Vault secret in a request header.

3. Security
- The functions are SECURITY DEFINER with a fixed search_path. EXECUTE is revoked from PUBLIC, anon, and authenticated. Only service_role may call them.
- Storage objects are never returned to clients. The bucket stays private.

4. Important Notes
- The cleanup is idempotent. Running it twice finds nothing new and deletes nothing extra.
- Active transcription jobs are protected because their status row keeps a recent `updated_at` timestamp.
- Migration is safe to re-run.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'sermon_transcription_cleanup_secret'
  ) THEN
    PERFORM vault.create_secret(
      gen_random_uuid()::text || gen_random_uuid()::text,
      'sermon_transcription_cleanup_secret',
      'Shared secret for the hourly temporary transcription audio cleanup'
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.sermon_transcription_cleanup_secret()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets
  WHERE name = 'sermon_transcription_cleanup_secret'
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.sermon_transcription_stale_jobs()
RETURNS TABLE (user_id uuid, recording_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.user_id, t.recording_id
  FROM public.sermon_transcripts t
  WHERE (t.status = 'processing' AND t.updated_at < now() - interval '6 hours')
     OR (t.status IN ('completed', 'failed', 'cancelled') AND t.updated_at < now() - interval '1 hour')
$$;

CREATE OR REPLACE FUNCTION public.sermon_transcription_stale_objects()
RETURNS TABLE (object_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT o.name
  FROM storage.objects o
  WHERE o.bucket_id = 'sermon-transcription-temp'
    AND (
      (
        o.created_at < now() - interval '24 hours'
        AND NOT EXISTS (
          SELECT 1 FROM public.sermon_transcripts t
          WHERE t.user_id::text = (storage.foldername(o.name))[1]
            AND t.current_job_id::text = (storage.foldername(o.name))[2]
        )
      )
      OR EXISTS (
        SELECT 1 FROM public.sermon_transcripts t
        WHERE t.user_id::text = (storage.foldername(o.name))[1]
          AND t.current_job_id::text = (storage.foldername(o.name))[2]
          AND (
            (t.status = 'processing' AND t.updated_at < now() - interval '6 hours')
            OR (t.status IN ('completed', 'failed', 'cancelled') AND t.updated_at < now() - interval '1 hour')
          )
      )
    )
$$;

REVOKE EXECUTE ON FUNCTION public.sermon_transcription_cleanup_secret() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sermon_transcription_stale_jobs() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sermon_transcription_stale_objects() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sermon_transcription_cleanup_secret() TO service_role;
GRANT EXECUTE ON FUNCTION public.sermon_transcription_stale_jobs() TO service_role;
GRANT EXECUTE ON FUNCTION public.sermon_transcription_stale_objects() TO service_role;

SELECT cron.schedule(
  'sermon-transcription-temp-cleanup',
  '0 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://tmdozaxdvammarxsxjai.supabase.co/functions/v1/cleanup-sermon-transcription-temp',
    body := '{}'::jsonb,
    params := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cleanup-secret', public.sermon_transcription_cleanup_secret()
    ),
    timeout_milliseconds := 60000
  );
  $cron$
);
