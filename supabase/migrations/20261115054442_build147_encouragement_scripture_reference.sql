/*
# Build 147: Structured Scripture reference for Share Scripture encouragements

1. Modified Tables
- `encouragements`: adds `scripture_reference` (text, nullable).

2. What the column holds
- Only the human-readable Bible reference, such as "Romans 8:1-4" or "Psalm 23".
- It never stores Bible verse text or translation-specific content. The recipient's active SOLAPATH translation is used when they open the passage.

3. Backward compatibility
- Existing encouragement rows are untouched and receive NULL.
- No backfill from free-text messages is performed.
- Rows with NULL simply do not show an Open in Bible button.

4. Constraint
- A length check (1 to 100 characters after trimming) when a value is present.
- Bible reference validation is done by the application parser, not by a database regex.

5. Security
- No change to RLS policies or grants. Existing table-level grants already cover new columns.
- Read and write access remains: sender and recipient can read; only the sender's own Circle member context can insert.

6. Not changed
- Build 144 Circle invitation migration.
- Build 145 cross-user privacy migration.
*/

ALTER TABLE public.encouragements
  ADD COLUMN IF NOT EXISTS scripture_reference text NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.encouragements'::regclass
      AND conname = 'encouragements_scripture_reference_length'
  ) THEN
    ALTER TABLE public.encouragements
      ADD CONSTRAINT encouragements_scripture_reference_length
      CHECK (scripture_reference IS NULL OR char_length(btrim(scripture_reference)) BETWEEN 1 AND 100);
  END IF;
END $$;
