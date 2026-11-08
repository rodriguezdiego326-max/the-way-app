/*
# Sermon transcripts and private temporary audio bucket

1. New Tables
- `sermon_transcripts`: one row per user and local sermon recording. Holds the transcription status, the active job id, the finished transcript text, and the number of audio parts.
- `sermon_transcript_parts`: one row per completed audio part for an active job. Lets a failed transcription resume at the failed part. Rows are removed after the transcript is finalized.

2. New Storage
- Private bucket `sermon-transcription-temp` for temporary audio uploads. Public access is off. Files are limited to 25 MB and audio/mp4.

3. Security
- Row Level Security is enabled on both tables.
- Owner-only access to rows through `auth.uid()`. The owner column defaults to the signed-in user and cannot be set to someone else.
- Storage objects can only be read, written, updated, or deleted by the owner, based on the first folder of the object path (`{user_id}/...`).
- The transcription edge function uses the service role only to read and delete the temporary objects after server-side checks.

4. Important Notes
- Deleting a transcript row cascades to its parts.
- Each recording has at most one transcript row, so one transcript per recording is enforced.
- Migration is idempotent: safe to re-run.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('sermon-transcription-temp', 'sermon-transcription-temp', false, 26214400, ARRAY['audio/mp4'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY['audio/mp4'];

CREATE TABLE IF NOT EXISTS sermon_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  recording_id text NOT NULL CHECK (char_length(recording_id) BETWEEN 1 AND 100),
  status text NOT NULL CHECK (status IN ('processing', 'completed', 'failed', 'cancelled')),
  current_job_id uuid,
  transcript text CHECK (transcript IS NULL OR char_length(transcript) <= 500000),
  part_count integer CHECK (part_count IS NULL OR part_count BETWEEN 1 AND 12),
  failure_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sermon_transcripts_user_recording_key UNIQUE (user_id, recording_id)
);

CREATE TABLE IF NOT EXISTS sermon_transcript_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  recording_id text NOT NULL,
  job_id uuid NOT NULL,
  part_index integer NOT NULL CHECK (part_index BETWEEN 0 AND 11),
  text text NOT NULL CHECK (char_length(text) <= 200000),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sermon_transcript_parts_job_key UNIQUE (user_id, job_id, part_index),
  CONSTRAINT sermon_transcript_parts_transcript_fkey FOREIGN KEY (user_id, recording_id)
    REFERENCES sermon_transcripts (user_id, recording_id) ON DELETE CASCADE
);

ALTER TABLE sermon_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermon_transcript_parts ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON sermon_transcripts TO authenticated;
GRANT SELECT, INSERT, DELETE ON sermon_transcript_parts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sermon_transcripts TO service_role;
GRANT SELECT, INSERT, DELETE ON sermon_transcript_parts TO service_role;

DROP POLICY IF EXISTS "select_own_sermon_transcripts" ON sermon_transcripts;
CREATE POLICY "select_own_sermon_transcripts" ON sermon_transcripts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_sermon_transcripts" ON sermon_transcripts;
CREATE POLICY "insert_own_sermon_transcripts" ON sermon_transcripts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_sermon_transcripts" ON sermon_transcripts;
CREATE POLICY "update_own_sermon_transcripts" ON sermon_transcripts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_sermon_transcripts" ON sermon_transcripts;
CREATE POLICY "delete_own_sermon_transcripts" ON sermon_transcripts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_sermon_transcript_parts" ON sermon_transcript_parts;
CREATE POLICY "select_own_sermon_transcript_parts" ON sermon_transcript_parts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_sermon_transcript_parts" ON sermon_transcript_parts;
CREATE POLICY "insert_own_sermon_transcript_parts" ON sermon_transcript_parts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_sermon_transcript_parts" ON sermon_transcript_parts;
CREATE POLICY "delete_own_sermon_transcript_parts" ON sermon_transcript_parts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_transcription_temp_objects" ON storage.objects;
CREATE POLICY "select_own_transcription_temp_objects" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'sermon-transcription-temp'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "insert_own_transcription_temp_objects" ON storage.objects;
CREATE POLICY "insert_own_transcription_temp_objects" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'sermon-transcription-temp'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "update_own_transcription_temp_objects" ON storage.objects;
CREATE POLICY "update_own_transcription_temp_objects" ON storage.objects FOR UPDATE
  TO authenticated USING (
    bucket_id = 'sermon-transcription-temp'
    AND (storage.foldername(name))[1] = auth.uid()::text
  ) WITH CHECK (
    bucket_id = 'sermon-transcription-temp'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "delete_own_transcription_temp_objects" ON storage.objects;
CREATE POLICY "delete_own_transcription_temp_objects" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'sermon-transcription-temp'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
