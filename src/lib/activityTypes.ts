export type ActivityEventType =
  | 'family_prayer_added'
  | 'family_prayer_updated'
  | 'family_sermon_discussion_added'
  | 'family_member_joined'
  | 'circle_prayer_added'
  | 'circle_checkin_added'
  | 'circle_encouragement_received'
  | 'circle_sermon_discussion_added'
  | 'circle_member_joined';

export interface ActivityItem {
  id: string;
  event_type: ActivityEventType;
  actor_label: string | null;
  scope_label: string | null;
  family_profile_id: string | null;
  circle_id: string | null;
  source_kind: string;
  source_id: string;
  read_at: string | null;
  created_at: string;
}

export interface ActivityPreferences {
  family_activity: boolean;
  circle_activity: boolean;
  prayer_activity: boolean;
  encouragement_activity: boolean;
  sermon_activity: boolean;
}

export const DEFAULT_ACTIVITY_PREFERENCES: ActivityPreferences = {
  family_activity: true,
  circle_activity: true,
  prayer_activity: true,
  encouragement_activity: true,
  sermon_activity: true,
};

export const ACTIVITY_PAGE_SIZE = 30;

export function describeActivity(item: ActivityItem, language: 'en' | 'es' = 'en'): string {
  const es = language === 'es';
  const actor = item.actor_label ?? (es ? 'Un miembro' : 'A member');
  const scope = item.scope_label ?? (es ? 'tu grupo' : 'your group');
  switch (item.event_type) {
    case 'family_prayer_added':
      return es ? `${actor} compartió una oración familiar` : `${actor} shared a family prayer`;
    case 'family_prayer_updated':
      return es ? `${actor} agregó una actualización a una oración familiar` : `${actor} added an update to a family prayer`;
    case 'family_sermon_discussion_added':
      return es ? `${actor} compartió una conversación familiar` : `${actor} shared a family discussion`;
    case 'family_member_joined':
      return es ? `${actor} se unió a ${scope}` : `${actor} joined ${scope}`;
    case 'circle_prayer_added':
      return es ? `${actor} compartió una petición de oración en ${scope}` : `${actor} shared a prayer request in ${scope}`;
    case 'circle_checkin_added':
      return es ? `${actor} hizo un check-in en ${scope}` : `${actor} checked in with ${scope}`;
    case 'circle_encouragement_received':
      return es ? `${actor} te envió ánimo en ${scope}` : `${actor} sent you encouragement in ${scope}`;
    case 'circle_sermon_discussion_added':
      return es ? `${actor} compartió una conversación sobre el sermón en ${scope}` : `${actor} shared a sermon discussion in ${scope}`;
    case 'circle_member_joined':
      return es ? `${actor} se unió a ${scope}` : `${actor} joined ${scope}`;
  }
}
