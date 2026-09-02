// Phase 9 — LEGACY Types

export type LegacyEventType =
  | 'bible_reflection'
  | 'prayer'
  | 'prayer_update'
  | 'answered_prayer'
  | 'life_event'
  | 'spiritual_milestone'
  | 'church_milestone'
  | 'family_milestone'
  | 'testimony_entry'
  | 'sermon_reflection'
  | 'reach_reflection'
  | 'family_walk_milestone'
  | 'circle_milestone'
  | 'user_created_memory'
  | 'letter'
  | 'personal_note';

export type LegacySourceType =
  | 'prayer'
  | 'today_walk'
  | 'family'
  | 'church'
  | 'reach'
  | 'memory'
  | 'user_created'
  | 'circle'
  | 'ai_generated_summary';

export type LegacyVisibility =
  | 'PRIVATE'
  | 'SHARED_WITH_SELECTED_PERSON'
  | 'FAMILY_SHARED'
  | 'EXPORT_ONLY'
  | 'FUTURE_RELEASE';

export type LegacyShareStatus = 'not_shared' | 'shared' | 'exported';

export type LetterType =
  | 'to_my_child'
  | 'to_my_spouse'
  | 'to_my_future_self'
  | 'to_my_family'
  | 'for_future_milestone'
  | 'testimony_letter'
  | 'custom';

export type MilestoneType =
  | 'baptism'
  | 'church_membership'
  | 'marriage'
  | 'birth_of_child'
  | 'beginning_ministry'
  | 'mission_trip'
  | 'major_prayer_answered'
  | 'completed_bible_journey'
  | 'reconciliation'
  | 'career_transition'
  | 'retirement'
  | 'custom';

export type DesignatedPersonStatus = 'draft' | 'pending' | 'active' | 'revoked';

export interface LegacyEvent {
  id: string;
  profile_id: string;
  event_type: LegacyEventType | string;
  title: string;
  event_date: string;
  source_type: LegacySourceType | string;
  source_id: string | null;
  summary: string | null;
  user_text: string | null;
  ai_summary: string | null;
  scripture_references: string[] | null;
  prayer_id: string | null;
  life_season_id: string | null;
  family_member_reference: string | null;
  church_reference: string | null;
  visibility: LegacyVisibility | string;
  share_status: LegacyShareStatus | string;
  user_verified: boolean;
  in_vault: boolean;
  archived: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LegacyLifeSeason {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  scripture: string | null;
  prayer: string | null;
  what_im_learning: string | null;
  people_involved: string | null;
  season_reflection: string | null;
  archived: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LegacyLetter {
  id: string;
  profile_id: string;
  letter_type: LetterType | string;
  recipient_label: string | null;
  body: string;
  ai_organized_body: string | null;
  scripture_reference: string | null;
  target_date: string | null;
  legacy_attachments: string[] | null;
  visibility: LegacyVisibility | string;
  archived: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LegacyMilestone {
  id: string;
  profile_id: string;
  milestone_type: MilestoneType | string;
  title: string;
  milestone_date: string;
  church_name: string | null;
  pastor_name: string | null;
  scripture: string | null;
  reflection: string | null;
  in_vault: boolean;
  archived: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LegacyTestimony {
  id: string;
  profile_id: string;
  before_christ: string | null;
  how_i_came_to_understand: string | null;
  repentance_and_faith: string | null;
  how_christ_changed_my_life: string | null;
  what_im_still_learning: string | null;
  scripture_that_matters: string | null;
  ai_organized_version: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LegacyScriptureRef {
  id: string;
  profile_id: string;
  passage_reference: string;
  book: string;
  date_marked: string;
  life_season_id: string | null;
  why_it_mattered: string | null;
  user_reflection: string | null;
  related_prayer_id: string | null;
  related_sermon_id: string | null;
  related_family_walk_id: string | null;
  in_vault: boolean;
  archived: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LegacyYearReview {
  id: string;
  profile_id: string;
  year: number;
  scripture_summary: string | null;
  prayer_summary: string | null;
  seasons_summary: string | null;
  family_summary: string | null;
  church_summary: string | null;
  growth_summary: string | null;
  faithfulness_summary: string | null;
  looking_ahead: string | null;
  ai_year_summary: string | null;
  records_used: Array<{ type: string; id: string; title: string; date: string }>;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LegacyDesignatedPerson {
  id: string;
  profile_id: string;
  person_label: string;
  person_email: string | null;
  relationship: string | null;
  selected_record_ids: string[] | null;
  conditions: string | null;
  status: DesignatedPersonStatus | string;
  created_at: string;
  updated_at: string;
}

export interface ScriptureMapEntry {
  book: string;
  count: number;
}

export const MILESTONE_TYPES: { id: MilestoneType; label: string }[] = [
  { id: 'baptism', label: 'Baptism' },
  { id: 'church_membership', label: 'Church Membership' },
  { id: 'marriage', label: 'Marriage' },
  { id: 'birth_of_child', label: 'Birth of Child' },
  { id: 'beginning_ministry', label: 'Beginning a Ministry' },
  { id: 'mission_trip', label: 'Mission Trip' },
  { id: 'major_prayer_answered', label: 'Major Prayer Answered' },
  { id: 'completed_bible_journey', label: 'Completed Bible Journey' },
  { id: 'reconciliation', label: 'Reconciliation' },
  { id: 'career_transition', label: 'Career Transition' },
  { id: 'retirement', label: 'Retirement' },
  { id: 'custom', label: 'Custom' },
];

export const LETTER_TYPES: { id: LetterType; label: string }[] = [
  { id: 'to_my_child', label: 'To My Child' },
  { id: 'to_my_spouse', label: 'To My Spouse' },
  { id: 'to_my_future_self', label: 'To My Future Self' },
  { id: 'to_my_family', label: 'To My Family' },
  { id: 'for_future_milestone', label: 'For a Future Milestone' },
  { id: 'testimony_letter', label: 'My Testimony Letter' },
  { id: 'custom', label: 'Custom' },
];

export const LIFE_SEASON_PRESETS: string[] = [
  'Starting a Business',
  'New Marriage',
  'New Baby',
  'Moving',
  'Career Change',
  'Grief',
  'Recovery',
  'Waiting',
  'Spiritual Renewal',
  'Church Transition',
  'Mission Trip',
  'Major Decision',
  'Custom',
];

export const FAITHFULNESS_CATEGORIES = [
  'answered_prayer',
  'unexpected_provision',
  'meaningful_scripture',
  'restored_relationship',
  'endurance_through_hardship',
  'church_community_support',
  'spiritual_milestone',
  'user_testimony',
] as const;

export const ANSWERED_PRAYER_OPTIONS = [
  'Exactly as I hoped',
  'Differently than I expected',
  'Over time',
  'Through another person',
  'Through changed circumstances',
  'I experienced peace/endurance',
  'Other',
] as const;

export const SOURCE_LABELS: Record<string, string> = {
  prayer: 'FROM PRAYER',
  today_walk: "FROM TODAY'S WALK",
  family: 'FROM FAMILY',
  church: 'FROM CHURCH',
  reach: 'FROM REACH',
  memory: 'FROM MEMORY',
  user_created: 'USER CREATED',
  circle: 'FROM CIRCLE',
  ai_generated_summary: 'AI GENERATED SUMMARY',
};
