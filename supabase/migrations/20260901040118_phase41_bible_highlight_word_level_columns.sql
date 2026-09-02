/*
# Add word-level highlight columns to bible_highlights

## Purpose
Supports Build 41 word/phrase highlighting. Existing whole-verse highlights
remain valid with NULL token_start/token_end.

## Changes
- Add `selected_text` (text, nullable) — the highlighted word/phrase text
- Add `token_start` (integer, nullable) — start token index
- Add `token_end` (integer, nullable) — end token index
- Add `start_offset` (integer, nullable) — character offset in verse text
- Add `end_offset` (integer, nullable) — character offset in verse text

## Security
- No RLS changes. Existing policies remain in effect.
- No data loss — all existing rows keep working with NULL values.
*/

ALTER TABLE bible_highlights
  ADD COLUMN IF NOT EXISTS selected_text text,
  ADD COLUMN IF NOT EXISTS token_start integer,
  ADD COLUMN IF NOT EXISTS token_end integer,
  ADD COLUMN IF NOT EXISTS start_offset integer,
  ADD COLUMN IF NOT EXISTS end_offset integer;
