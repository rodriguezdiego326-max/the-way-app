-- ============================================================
-- THE WAY Phase 5 — REACH Schema
-- People prayed for, gospel conversations, prodigal journey,
-- conversation practice, conversation notes
-- ============================================================

-- Reach People (private, no real names required)
CREATE TABLE reach_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT NOT NULL,
  relationship TEXT,
  spiritual_context TEXT,
  prayer_notes TEXT,
  related_scripture TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reach_people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_reach_people" ON reach_people FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_reach_people" ON reach_people FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_reach_people" ON reach_people FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_reach_people" ON reach_people FOR DELETE
  TO anon, authenticated USING (true);

-- Reach Conversation Notes (user-recorded, voluntary)
CREATE TABLE reach_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reach_person_id UUID REFERENCES reach_people(id) ON DELETE CASCADE,
  conversation_date DATE,
  main_topic TEXT,
  questions_asked TEXT,
  user_reflection TEXT,
  possible_followup TEXT,
  prayer TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reach_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_reach_conversations" ON reach_conversations FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_reach_conversations" ON reach_conversations FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_reach_conversations" ON reach_conversations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_reach_conversations" ON reach_conversations FOR DELETE
  TO anon, authenticated USING (true);

-- Reach Prayer Updates (for people being prayed for)
CREATE TABLE reach_prayer_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reach_person_id UUID REFERENCES reach_people(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reach_prayer_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_reach_prayer_updates" ON reach_prayer_updates FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_reach_prayer_updates" ON reach_prayer_updates FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_delete_reach_prayer_updates" ON reach_prayer_updates FOR DELETE
  TO anon, authenticated USING (true);

-- Prodigal Journey (loved ones who walked away from faith)
CREATE TABLE prodigal_journey (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT NOT NULL,
  relationship TEXT,
  current_situation TEXT,
  past_conversations TEXT,
  related_scripture TEXT,
  reflection TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE prodigal_journey ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_prodigal" ON prodigal_journey FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_prodigal" ON prodigal_journey FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_prodigal" ON prodigal_journey FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_prodigal" ON prodigal_journey FOR DELETE
  TO anon, authenticated USING (true);

-- Prodigal Journey Updates
CREATE TABLE prodigal_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prodigal_id UUID REFERENCES prodigal_journey(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE prodigal_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_prodigal_updates" ON prodigal_updates FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_prodigal_updates" ON prodigal_updates FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_delete_prodigal_updates" ON prodigal_updates FOR DELETE
  TO anon, authenticated USING (true);

-- Conversation Practice Sessions (AI roleplay coaching)
CREATE TABLE conversation_practice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario TEXT NOT NULL,
  objection TEXT NOT NULL,
  user_response TEXT,
  coaching JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE conversation_practice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_conversation_practice" ON conversation_practice FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_conversation_practice" ON conversation_practice FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_delete_conversation_practice" ON conversation_practice FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX idx_reach_conversations_person ON reach_conversations(reach_person_id);
CREATE INDEX idx_reach_prayer_updates_person ON reach_prayer_updates(reach_person_id);
CREATE INDEX idx_prodigal_updates_prodigal ON prodigal_updates(prodigal_id);
