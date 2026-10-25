/*
# Build 78 — Reflection Intelligence: persist SOLAPATH response on walk_reflections

## Purpose
Build 78 introduces Reflection Intelligence in Today. After a user saves a
meaningful reflection tied to today's walk, they may tap "Reflect with SOLAPATH"
to receive a Scripture-grounded response. The user's authored reflection and
SOLAPATH's generated response must be stored SEPARATELY (user text is never
overwritten by AI prose).

## Existing architecture (audited before this change)
- `walk_reflections` already exists: id, walk_id, body (user text), input_mode,
  created_at, user_id (DEFAULT auth.uid()). RLS enabled with owner-only
  SELECT/INSERT/UPDATE/DELETE policies. This is the correct home for both the
  user's reflection and the AI response — no new table needed.
- `ask_conversations` / `ask_messages` store Ask history and remain untouched.
- `daily_checkins` stores mood/context and remains untouched.

## Changes
1. Add nullable column `ai_response` (jsonb) to `walk_reflections`.
   - Nullable so existing rows and future reflection-only saves are unaffected.
   - Stores the full StructuredTheologicalResponse for the SOLAPATH reflection,
     plus a small metadata envelope ({ generated_at, passage_reference,
     reflection_prompt, response_language }) so the Today UI can re-render the
     response without re-calling the intelligence layer.
   - User-authored `body` is never modified by AI output.

## Security
- RLS already enforces owner-only CRUD on `walk_reflections`. No policy changes
  required: the owner can read/update their own row's `ai_response`.
- No new grants needed (existing grants already cover UPDATE on the table).
- No service-role access is introduced; the frontend writes through the
  authenticated client, so RLS continues to scope by user_id.

## Notes
- This migration is idempotent (DO block + IF NOT EXISTS).
- No data is migrated or transformed; existing rows keep ai_response = null.
- The Memory Engine, Ask provider routing, and Bible providers are NOT modified.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'walk_reflections'
      AND column_name = 'ai_response'
  ) THEN
    ALTER TABLE walk_reflections
      ADD COLUMN ai_response jsonb;
  END IF;
END $$;
