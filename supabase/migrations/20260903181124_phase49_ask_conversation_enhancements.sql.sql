/*
# Ask Conversation Enhancements — Build 49

1. Purpose
   Add columns to support persistent chat history, conversation language tracking,
   structured payload storage for assistant messages, and soft-archive.

2. Modified Tables
   - ask_conversations: add language, conversation_type, updated_at, archived_at
   - ask_messages: add structured_payload, response_language

3. Security
   - No RLS policy changes. Existing owner-only policies remain in force.
   - All new columns are nullable to avoid breaking existing rows.

4. Notes
   - updated_at auto-updates via trigger on message insert/update.
   - archived_at enables soft-archive (conversation hidden from active list but not deleted).
*/

ALTER TABLE ask_conversations
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS conversation_type text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

ALTER TABLE ask_messages
  ADD COLUMN IF NOT EXISTS structured_payload jsonb,
  ADD COLUMN IF NOT EXISTS response_language text;

-- Auto-update ask_conversations.updated_at when a message is inserted
CREATE OR REPLACE FUNCTION update_ask_conversation_timestamp()
RETURNS trigger AS $$
BEGIN
  UPDATE ask_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS ask_message_insert_trigger ON ask_messages;
CREATE TRIGGER ask_message_insert_trigger
  AFTER INSERT ON ask_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ask_conversation_timestamp();

-- Index for listing conversations by user, most recent first
CREATE INDEX IF NOT EXISTS idx_ask_conversations_user_updated
  ON ask_conversations (user_id, updated_at DESC);

-- Index for loading messages within a conversation
CREATE INDEX IF NOT EXISTS idx_ask_messages_conversation_created
  ON ask_messages (conversation_id, created_at ASC);
