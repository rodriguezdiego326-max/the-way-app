/*
# Phase 35 — Scripture Marking Foundation

## Purpose
Adds word-level marking support to the existing bible_keyword_marks table.
This enables users to mark specific words or phrases within a Bible verse
(not just the whole verse), with stable token-based positioning.

## Changes to bible_keyword_marks
- selected_text (text, nullable): the exact word/phrase the user selected
- token_start (integer, nullable): index of the first token in the selection
- token_end (integer, nullable): index of the last token in the selection
- updated_at (timestamptz, DEFAULT now()): tracks when a mark was last edited

## Legacy compatibility
Existing verse-level marks have NULL token_start/token_end/selected_text.
They continue to load and function as before. The application distinguishes
legacy verse-level marks (null tokens) from word-level marks (populated tokens).

## Constraints
- CHECK (token_start IS NULL OR token_end IS NULL OR token_start <= token_end)
  Ensures token ranges are valid when populated.

## Indexes
- idx_bible_keyword_marks_chapter (user_id, book, chapter) — chapter-level loading
- idx_bible_keyword_marks_verse (user_id, book, chapter, verse) — verse-level lookups

## Security
- No RLS changes. Existing policies remain: auth.uid() = user_id for all CRUD.
- No new tables created.
*/
