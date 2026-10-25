/*
# Build 82: Canonical Today Walk — walk_date column + uniqueness

## Purpose
Establishes ONE canonical Today Walk per user per local calendar day.
Previously, walks were queried by created_at DESC within a UTC date range,
which allowed duplicate same-day walks when concurrent or rapid-succession
calls to loadOrCreateTodayWalk() both observed "no walk exists" and both
inserted. This caused Today to display a different walk than the one holding
the user's saved reflection.

## Changes
1. Adds `walk_date date` column to walks — stores the user-local calendar
   day (YYYY-MM-DD) as the canonical identity key.
2. Backfills walk_date from created_at for all existing walks.
3. Deduplicates existing same-day walks: for each (user_id, walk_date)
   group with multiple walks, keeps the walk that has reflections (user
   data), or the latest one if none have reflections. Deletes ONLY walks
   with ZERO reflections, so no user-authored content is ever lost.
4. Creates a UNIQUE index on (user_id, walk_date) to prevent future
   duplicates at the database level.
5. No RLS changes — existing owner-scoped policies remain unchanged.

## Important Notes
- walk_reflections has ON DELETE CASCADE, so deleting a walk also deletes
  its reflections. The dedup only deletes walks with ZERO reflections,
  ensuring no user data is lost.
- The known duplicate (2026-10-25): walk 004fe285 (Matthew 11:28–30, has
  reflection + AI response) is kept; walk 057a67d4 (Psalm 23, no
  reflection) is deleted.
- No walk with reflections is ever deleted by the dedup.
*/

-- 1. Add walk_date column
ALTER TABLE walks ADD COLUMN IF NOT EXISTS walk_date date;

-- 2. Backfill from created_at (UTC date as best available approximation)
UPDATE walks SET walk_date = (created_at AT TIME ZONE 'UTC')::date WHERE walk_date IS NULL;

-- 3. Deduplicate: for each (user_id, walk_date) group with multiple walks,
--    delete walks that have NO reflections when a better candidate exists
--    (one with reflections, or a newer one if neither has reflections).
--    Walks WITH reflections are never deleted.
DELETE FROM walks w
WHERE NOT EXISTS (SELECT 1 FROM walk_reflections wr WHERE wr.walk_id = w.id)
AND EXISTS (
  SELECT 1 FROM walks w2
  WHERE w2.user_id = w.user_id
    AND w2.walk_date = w.walk_date
    AND w2.id <> w.id
    AND (
      -- w2 has reflections (and w doesn't) -> prefer w2
      EXISTS (SELECT 1 FROM walk_reflections wr WHERE wr.walk_id = w2.id)
      OR
      -- Neither has reflections; w2 is newer -> prefer w2
      (
        NOT EXISTS (SELECT 1 FROM walk_reflections wr WHERE wr.walk_id = w2.id)
        AND w2.created_at > w.created_at
      )
      OR
      -- Neither has reflections; same timestamp; w2.id is the tiebreaker
      (
        NOT EXISTS (SELECT 1 FROM walk_reflections wr WHERE wr.walk_id = w2.id)
        AND w2.created_at = w.created_at
        AND w2.id > w.id
      )
    )
);

-- 4. Unique index to prevent future duplicates (one walk per user per day)
CREATE UNIQUE INDEX IF NOT EXISTS idx_walks_user_date_unique ON walks(user_id, walk_date);

-- 5. Index for efficient walk_date equality queries
CREATE INDEX IF NOT EXISTS idx_walks_walk_date ON walks(walk_date);
