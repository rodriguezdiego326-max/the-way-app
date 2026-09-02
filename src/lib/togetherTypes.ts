// Phase 8 — TOGETHER + CHURCH Types

export type CircleType =
  | 'Marriage'
  | 'Family'
  | "Men's Group"
  | "Women's Group"
  | 'Bible Study'
  | 'Small Group'
  | 'Prayer Group'
  | 'Accountability'
  | 'Discipleship'
  | 'Friends'
  | 'Church Group'
  | 'Other';

export type CircleRole = 'OWNER' | 'LEADER' | 'MEMBER' | 'PASTOR' | 'CHURCH_LEADER';

export type PrayerVisibility = 'private' | 'circle';

export type PrayerStatus = 'PRAYING' | 'WAITING' | 'ANSWERED' | 'CONTINUING_TO_TRUST' | 'CLOSED';

export type ReflectionVisibility = 'private' | 'circle';

export type CheckInState = 'Ready' | 'Heavy' | 'Worried' | 'Discouraged' | 'Grateful' | 'Struggling' | 'Questioning' | 'Hopeful';

export type CheckInVisibility = 'private' | 'circle' | 'leader_only';

export type EncouragementAction = 'encourage' | 'share_scripture' | 'praying_for_you' | 'check_in_privately';

export type AccountabilityArea =
  | 'Prayer' | 'Bible Reading' | 'Marriage' | 'Parenting' | 'Purity'
  | 'Anger' | 'Speech' | 'Stewardship' | 'Work' | 'Health' | 'Other';

export type ChurchRole =
  | 'Member' | 'Regular Attender' | 'Visitor'
  | 'Pastor' | 'Elder' | 'Deacon' | 'Ministry Leader' | 'Other';

export type ContentLabel =
  | 'SCRIPTURE'
  | 'VERIFIED_THE_WAY_LIBRARY'
  | 'CHURCH_CONTENT'
  | 'PASTOR_LEADER_CONTENT'
  | 'THE_WAY_AI'
  | 'MEMBER_REFLECTION';

export interface Circle {
  id: string;
  name: string;
  circle_type: CircleType | string;
  description: string | null;
  owner_profile_id: string;
  privacy: string;
  created_at: string;
  updated_at: string;
}

export interface CircleMember {
  id: string;
  circle_id: string;
  profile_id: string;
  role: CircleRole | string;
  joined_at: string;
}

export interface CircleInvitation {
  id: string;
  circle_id: string;
  invited_by_profile_id: string;
  invite_code: string;
  expires_at: string | null;
  revoked_at: string | null;
  accepted_at: string | null;
  accepted_by_profile_id: string | null;
  created_at: string;
}

export interface SharedPrayer {
  id: string;
  title: string;
  description: string | null;
  related_scripture: string | null;
  status: PrayerStatus | string;
  profile_id: string;
  circle_id: string | null;
  visibility: PrayerVisibility | string;
  created_at: string;
  updated_at: string;
}

export interface PrayerAcknowledgement {
  id: string;
  shared_prayer_id: string;
  profile_id: string;
  created_at: string;
}

export interface SharedScriptureStudy {
  id: string;
  circle_id: string;
  passage_reference: string;
  reading_objective: string | null;
  observe_prompt: string | null;
  understand_prompt: string | null;
  discuss_prompt: string | null;
  apply_prompt: string | null;
  prayer_prompt: string | null;
  go_deeper_prompt: string | null;
  assigned_by_profile_id: string;
  meeting_date: string | null;
  created_at: string;
}

export interface SharedReflection {
  id: string;
  profile_id: string;
  circle_id: string | null;
  scripture_study_id: string | null;
  body: string;
  visibility: ReflectionVisibility | string;
  created_at: string;
}

export interface CircleCheckIn {
  id: string;
  profile_id: string;
  circle_id: string | null;
  state: CheckInState | string;
  note: string | null;
  visibility: CheckInVisibility | string;
  created_at: string;
}

export interface Encouragement {
  id: string;
  from_profile_id: string;
  to_profile_id: string;
  circle_id: string | null;
  action_type: EncouragementAction | string;
  message: string | null;
  created_at: string;
}

export interface AccountabilityRelationship {
  id: string;
  profile_id: string;
  partner_profile_id: string | null;
  circle_id: string | null;
  areas: string[];
  opt_in: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChurchProfile {
  id: string;
  name: string;
  city: string | null;
  website: string | null;
  created_at: string;
}

export interface ChurchMembership {
  id: string;
  profile_id: string;
  church_id: string;
  personal_role: ChurchRole | string;
  verified_church_role: string | null;
  created_at: string;
}

export interface Sermon {
  id: string;
  church_id: string | null;
  date: string;
  speaker: string | null;
  title: string | null;
  passage: string;
  series: string | null;
  created_at: string;
}

export interface SermonNote {
  id: string;
  profile_id: string;
  sermon_id: string;
  notes: string | null;
  main_point: string | null;
  questions: string | null;
  application: string | null;
  prayer: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChurchStudy {
  id: string;
  church_id: string;
  title: string;
  description: string | null;
  created_at: string;
}

export interface ChurchStudyAssignment {
  id: string;
  church_study_id: string;
  week_label: string;
  passage_reference: string;
  reading_objective: string | null;
  discussion_questions: string[];
  prayer_focus: string | null;
  meeting_date: string | null;
  created_at: string;
}

export interface ChurchPrayerItem {
  id: string;
  church_id: string;
  title: string;
  description: string | null;
  category: string;
  created_at: string;
}

export interface ChurchGroup {
  id: string;
  church_id: string;
  name: string;
  description: string | null;
  meeting_day: string | null;
  leader_profile_id: string | null;
  created_at: string;
}

export interface GroupDiscussion {
  id: string;
  group_id: string;
  profile_id: string;
  topic: string;
  body: string;
  is_ai_summary: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  profile_id: string;
  together_notifications: boolean;
  church_notifications: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  sunday_mode: boolean;
  created_at: string;
  updated_at: string;
}

export const CIRCLE_TYPES: CircleType[] = [
  'Marriage', 'Family', "Men's Group", "Women's Group",
  'Bible Study', 'Small Group', 'Prayer Group',
  'Accountability', 'Discipleship', 'Friends',
  'Church Group', 'Other',
];

export const CHECK_IN_STATES: CheckInState[] = [
  'Ready', 'Heavy', 'Worried', 'Discouraged',
  'Grateful', 'Struggling', 'Questioning', 'Hopeful',
];

export const PRAYER_STATUSES: PrayerStatus[] = [
  'PRAYING', 'WAITING', 'ANSWERED', 'CONTINUING_TO_TRUST', 'CLOSED',
];

export const ENCOURAGEMENT_ACTIONS: { id: EncouragementAction; label: string }[] = [
  { id: 'encourage', label: 'Encourage' },
  { id: 'share_scripture', label: 'Share Scripture' },
  { id: 'praying_for_you', label: 'Praying For You' },
  { id: 'check_in_privately', label: 'Check In Privately' },
];

export const ACCOUNTABILITY_AREAS: AccountabilityArea[] = [
  'Prayer', 'Bible Reading', 'Marriage', 'Parenting', 'Purity',
  'Anger', 'Speech', 'Stewardship', 'Work', 'Health', 'Other',
];

export const CHURCH_ROLES: ChurchRole[] = [
  'Member', 'Regular Attender', 'Visitor',
  'Pastor', 'Elder', 'Deacon', 'Ministry Leader', 'Other',
];

export const CONTENT_LABELS: { id: ContentLabel; label: string; color: string }[] = [
  { id: 'SCRIPTURE', label: 'Scripture', color: 'gold' },
  { id: 'VERIFIED_THE_WAY_LIBRARY', label: 'Verified SOLAPATH Library', color: 'sage' },
  { id: 'CHURCH_CONTENT', label: 'Church Content', color: 'blue' },
  { id: 'PASTOR_LEADER_CONTENT', label: 'Pastor / Leader Content', color: 'clay' },
  { id: 'THE_WAY_AI', label: 'SOLAPATH AI', color: 'ivory' },
  { id: 'MEMBER_REFLECTION', label: 'Member Reflection', color: 'ink' },
];
