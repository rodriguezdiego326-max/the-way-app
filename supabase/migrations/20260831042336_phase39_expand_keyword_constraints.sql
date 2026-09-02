/*
# Phase 39 — Expand bible_keywords CHECK constraints

## Purpose
The bible_keywords table has CHECK constraints on color_key and mark_style
that reject Build 38's new visual styles (oval, angled_box, slash,
symbol_underline, symbol_highlight) and new colors (amber, orange, coral,
rose, violet, indigo, teal, sage). This caused "Create Marking Key" to fail
silently — saveKeyword() returned null and the key was never saved.

## Changes
1. Drop and recreate the color_key CHECK constraint to accept the expanded
   SOLAPATH palette: gold, amber, orange, coral, red, rose, violet, purple,
   indigo, blue, teal, green, sage.
2. Drop and recreate the mark_style CHECK constraint to accept all Build 38+
   styles: highlight, underline, double_underline, box, oval, angled_box,
   slash, circle, symbol, symbol_underline, symbol_highlight.

## Security
- No RLS changes. Existing policies remain unchanged.
- No new tables or columns.
- No data loss — only constraint definitions change.
*/

-- Expand color_key CHECK constraint
DO $$ BEGIN
  ALTER TABLE bible_keywords DROP CONSTRAINT IF EXISTS bible_keywords_color_key_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE bible_keywords ADD CONSTRAINT bible_keywords_color_key_check
  CHECK (color_key IN (
    'gold', 'amber', 'orange', 'coral', 'red', 'rose',
    'violet', 'purple', 'indigo', 'blue', 'teal', 'green', 'sage'
  ));

-- Expand mark_style CHECK constraint
DO $$ BEGIN
  ALTER TABLE bible_keywords DROP CONSTRAINT IF EXISTS bible_keywords_mark_style_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE bible_keywords ADD CONSTRAINT bible_keywords_mark_style_check
  CHECK (mark_style IN (
    'highlight', 'underline', 'double_underline', 'box', 'oval',
    'angled_box', 'slash', 'circle', 'symbol',
    'symbol_underline', 'symbol_highlight'
  ));
