/*
# Build 116: Harden trigger functions (search path and client execute grants)

Plain English: four database helper functions that only run automatically when
a row is saved were reachable as remote procedure calls by anyone with the app
key. This migration makes them run with the caller's rights, pins their
search path, and removes direct execute access. Triggers and their behavior are unchanged.

1. Functions modified
- public.trigger_bible_notes_updated_at(): SECURITY INVOKER, search_path pinned to empty, EXECUTE revoked from PUBLIC, anon, authenticated.
- public.trigger_bible_chapter_notes_updated_at(): same treatment.
- public.trigger_bible_reading_history_updated_at(): same treatment.
- public.update_ask_conversation_timestamp(): recreated as SECURITY INVOKER, search_path empty, schema-qualified table reference (public.ask_conversations), same logic. EXECUTE revoked from PUBLIC, anon, authenticated.

2. Triggers
- bible_notes_updated_at, bible_chapter_notes_updated_at, bible_reading_history_updated_at, ask_message_insert_trigger are NOT dropped or recreated. Their wiring is unchanged.

3. Security notes
- Invoker rights are safe here: the Ask trigger updates the caller's own conversation, and authenticated users already hold UPDATE on ask_conversations with an owner-only policy. anon has no access to ask_messages.
- No RLS policies, grants on tables, church RPCs, account deletion, or Edge Functions are changed.
*/

ALTER FUNCTION public.trigger_bible_notes_updated_at() SECURITY INVOKER;
ALTER FUNCTION public.trigger_bible_notes_updated_at() SET search_path TO '';
REVOKE EXECUTE ON FUNCTION public.trigger_bible_notes_updated_at() FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.trigger_bible_chapter_notes_updated_at() SECURITY INVOKER;
ALTER FUNCTION public.trigger_bible_chapter_notes_updated_at() SET search_path TO '';
REVOKE EXECUTE ON FUNCTION public.trigger_bible_chapter_notes_updated_at() FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.trigger_bible_reading_history_updated_at() SECURITY INVOKER;
ALTER FUNCTION public.trigger_bible_reading_history_updated_at() SET search_path TO '';
REVOKE EXECUTE ON FUNCTION public.trigger_bible_reading_history_updated_at() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.update_ask_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO ''
AS $$
BEGIN
  UPDATE public.ask_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_ask_conversation_timestamp() FROM PUBLIC, anon, authenticated;
