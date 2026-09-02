export type TheologicalDepth = 'simple' | 'study' | 'deep_study';

export type WalkStatus = 'pending' | 'open' | 'reading' | 'reflecting' | 'complete';

export type PrayerStatus = 'praying' | 'waiting' | 'answered' | 'closed';

export type AskIntent =
  | 'passage'
  | 'theology'
  | 'life'
  | 'prayer'
  | 'doubts'
  | 'child'
  | 'evangelism';

export type MemoryCategory =
  | 'life_stage'
  | 'life'
  | 'family'
  | 'work'
  | 'school'
  | 'spiritual_growth'
  | 'bible_study'
  | 'prayer'
  | 'church'
  | 'goals'
  | 'important_event'
  | 'struggle'
  | 'recurring_question'
  | 'reflection'
  | 'walk'
  | 'life_event'
  | 'preference';

export type MemorySource =
  | 'user_input'
  | 'reflection'
  | 'walk'
  | 'prayer'
  | 'onboarding'
  | 'checkin';

export type Sensitivity = 'low' | 'medium' | 'high';

export type SourceType =
  | 'scripture'
  | 'creed'
  | 'confession'
  | 'catechism'
  | 'historic_theologian'
  | 'modern_teacher'
  | 'editorial'
  | 'ai_application';

export type Familiarity = 'new' | 'growing' | 'experienced' | 'advanced';

export type AuthorEra = 'historic' | 'modern';

export type DocumentType = 'confession' | 'catechism' | 'canon';

export interface Profile {
  id: string;
  display_name: string | null;
  life_stage: string | null;
  season: string | null;
  preferred_translation: string;
  theological_depth: TheologicalDepth;
  learning_style: string | null;
  available_time_minutes: number;
  bible_familiarity: string | null;
  theological_familiarity: string | null;
  reformed_familiarity: string | null;
  current_study: string | null;
  memory_enabled: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface LifeStage {
  id: string;
  profile_id: string | null;
  stage: string;
  created_at: string;
}

export interface LifeArea {
  id: string;
  profile_id: string | null;
  area: string;
  created_at: string;
}

export interface GrowthArea {
  id: string;
  profile_id: string | null;
  area: string;
  created_at: string;
}

export interface CurrentStudy {
  id: string;
  profile_id: string | null;
  study_name: string;
  created_at: string;
}

export interface DailyCheckin {
  id: string;
  mood: string;
  context_text: string | null;
  remember_context: boolean;
  created_at: string;
}

export interface Walk {
  id: string;
  user_id?: string;
  passage_reference: string;
  reading_objective: string | null;
  observation_prompt: string | null;
  estimated_minutes: number;
  status: WalkStatus;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface WalkReflection {
  id: string;
  walk_id: string;
  body: string;
  input_mode: 'text' | 'voice';
  created_at: string;
}

export interface Prayer {
  id: string;
  user_id?: string;
  title: string;
  description: string | null;
  related_scripture: string | null;
  status: PrayerStatus;
  started_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrayerUpdate {
  id: string;
  prayer_id: string;
  body: string;
  created_at: string;
}

export interface AskConversation {
  id: string;
  title: string | null;
  intent: AskIntent | null;
  created_at: string;
}

export interface AskMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  body: string;
  created_at: string;
}

export interface Memory {
  id: string;
  category: MemoryCategory;
  content: string;
  source: MemorySource;
  active: boolean;
  user_confirmed: boolean;
  sensitivity: Sensitivity;
  expiration: string | null;
  confidence: string | null;
  created_at: string;
  updated_at: string;
}

export interface Source {
  id: string;
  source_type: SourceType;
  author: string | null;
  work: string | null;
  work_title: string | null;
  title: string | null;
  chapter_section: string | null;
  chapter: string | null;
  page: string | null;
  publication_info: string | null;
  year: number | null;
  url: string | null;
  license_status: string | null;
  verification_status: 'unverified' | 'verified' | 'pending';
  verified: boolean;
  verification_notes: string | null;
  created_at: string;
}

export interface TheologicalAuthor {
  id: string;
  name: string;
  era: AuthorEra;
  tradition: string | null;
  born_year: number | null;
  died_year: number | null;
  bio_summary: string | null;
  created_at: string;
}

export interface ConfessionalDocument {
  id: string;
  title: string;
  tradition: string;
  year: number | null;
  document_type: DocumentType;
  summary: string | null;
  created_at: string;
}

export interface Doctrine {
  id: string;
  name: string;
  description: string | null;
  parent_doctrine_id: string | null;
  created_at: string;
}

export interface SourceDoctrine {
  id: string;
  source_id: string;
  doctrine_id: string;
  created_at: string;
}

export interface ScriptureReference {
  id: string;
  source_id: string | null;
  doctrine_id: string | null;
  book: string;
  chapter_start: number | null;
  verse_start: number | null;
  chapter_end: number | null;
  verse_end: number | null;
  created_at: string;
}
