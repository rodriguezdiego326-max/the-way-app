// SOLAPATH Family — Types

export type AgeRange = '3-5' | '6-8' | '9-12' | '13-15' | '16-17' | '18+';

export type FamilyWalkStatus = 'pending' | 'open' | 'complete';

export type CatechismType = 'westminster_shorter' | 'heidelberg';

export type JourneyPathway = 'foundations' | 'attributes_of_god' | 'ten_commandments' | 'lords_prayer' | 'apostles_creed' | 'five_solas' | 'doctrines_of_grace' | 'covenant_theology' | 'church_history' | 'reformation' | 'apologetics' | 'christian_worldview' | 'missions';

export type JourneyLessonStatus = 'not_started' | 'in_progress' | 'completed';

export interface FamilyProfile {
  id: string;
  profile_id: string | null;
  family_name: string | null;
  current_study: string | null;
  memory_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_profile_id: string;
  nickname: string | null;
  age_range: AgeRange;
  relationship: string | null;
  learning_preferences: string | null;
  discussion_level: string | null;
  current_topics: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgeQuestions {
  '3-5': string[];
  '6-8': string[];
  '9-12': string[];
  '13-15': string[];
  '16-17': string[];
  '18+': string[];
}

export interface FamilyWalk {
  id: string;
  family_profile_id: string;
  topic: string;
  passage_reference: string;
  reading_instruction: string | null;
  parent_prep: string | null;
  main_truth: string | null;
  biblical_context: string | null;
  reformed_foundation: string | null;
  words_children_may_ask_about: string | null;
  common_misunderstanding: string | null;
  one_thing_to_emphasize: string | null;
  age_questions: AgeQuestions | null;
  application: string | null;
  prayer_guide: string | null;
  estimated_minutes: number;
  status: FamilyWalkStatus;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface CatechismProgress {
  id: string;
  family_profile_id: string;
  catechism_type: CatechismType;
  question_number: number;
  question: string;
  answer: string;
  scripture_basis: string | null;
  explanation: string | null;
  discussion_question: string | null;
  family_application: string | null;
  prayer: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface FamilyPrayer {
  id: string;
  family_profile_id: string;
  title: string;
  description: string | null;
  related_scripture: string | null;
  status: 'praying' | 'waiting' | 'answered' | 'closed';
  started_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FamilyPrayerUpdate {
  id: string;
  family_prayer_id: string;
  body: string;
  created_at: string;
}

export interface FamilyJourneyProgress {
  id: string;
  family_profile_id: string;
  pathway: JourneyPathway;
  lesson_number: number;
  lesson_title: string;
  status: JourneyLessonStatus;
  completed_at: string | null;
  created_at: string;
}

export interface JourneyLesson {
  number: number;
  title: string;
  description: string;
}

export interface JourneyPathwayInfo {
  id: JourneyPathway;
  title: string;
  description: string;
  lessons: JourneyLesson[];
  available: boolean;
}

import type { Citation } from './libraryTypes';

export interface ChildAskedResponse {
  understand_it_yourself: string;
  open_the_bible_together: Array<{ reference: string; reason: string }>;
  how_to_explain_it: string;
  ask_them: string[];
  they_may_ask_next: string[];
  reformed_foundation: string;
  sources: Citation[];
  is_demo: boolean;
}
