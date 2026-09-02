// SOLAPATH REACH — Types

export type SpiritualContext =
  | 'doesnt_believe_in_god'
  | 'agnostic'
  | 'atheist'
  | 'different_religion'
  | 'grew_up_christian_walked_away'
  | 'church_hurt'
  | 'curious_about_christianity'
  | 'doesnt_want_to_discuss'
  | 'not_sure'
  | 'other';

export interface ReachPerson {
  id: string;
  nickname: string;
  relationship: string | null;
  spiritual_context: string | null;
  prayer_notes: string | null;
  related_scripture: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReachConversation {
  id: string;
  reach_person_id: string | null;
  conversation_date: string | null;
  main_topic: string | null;
  questions_asked: string | null;
  user_reflection: string | null;
  possible_followup: string | null;
  prayer: string | null;
  created_at: string;
}

export interface ReachPrayerUpdate {
  id: string;
  reach_person_id: string;
  body: string;
  created_at: string;
}

export interface ProdigalJourney {
  id: string;
  nickname: string;
  relationship: string | null;
  current_situation: string | null;
  past_conversations: string | null;
  related_scripture: string | null;
  reflection: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProdigalUpdate {
  id: string;
  prodigal_id: string;
  body: string;
  created_at: string;
}

export interface ConversationPracticeSession {
  id: string;
  scenario: string;
  objection: string;
  user_response: string | null;
  coaching: PracticeCoaching | null;
  created_at: string;
}

export interface PracticeCoaching {
  what_you_addressed_well: string;
  what_you_may_have_missed: string;
  listening: string;
  gospel_connection: string;
  scripture_to_study: string;
  apologetics_resources: string;
}

import type { Citation } from './libraryTypes';

export interface TheyAskedMeResponse {
  understand_the_question: string;
  understand_it_yourself: string;
  open_your_bible: Array<{ reference: string; reason: string }>;
  how_you_could_respond: string;
  questions_to_ask_them: string[];
  they_may_ask_next: string[];
  reformed_foundation: string;
  other_christian_views: string | null;
  sources: Citation[];
  is_demo: boolean;
}

export interface GospelConversationPrep {
  pray_first: string;
  listen: string;
  questions_worth_asking: string[];
  gospel_connection: string;
  scripture_to_know: Array<{ reference: string; reason: string }>;
  things_not_to_force: string[];
  follow_up: string;
  is_demo: boolean;
}

export interface ApologeticsCategory {
  id: string;
  label: string;
  description: string;
  common_objections: string[];
}

export interface GospelFoundationLesson {
  number: number;
  title: string;
  passage: string;
  description: string;
  key_truth: string;
}

export interface EvangelismBibleTrail {
  id: string;
  title: string;
  description: string;
  passages: Array<{ reference: string; reading_objective: string }>;
}
