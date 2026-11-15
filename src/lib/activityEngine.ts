import { supabase } from '@/lib/supabase';
import {
  ACTIVITY_PAGE_SIZE,
  DEFAULT_ACTIVITY_PREFERENCES,
  type ActivityItem,
  type ActivityPreferences,
} from '@/lib/activityTypes';

const ACTIVITY_COLUMNS =
  'id, event_type, actor_label, scope_label, family_profile_id, circle_id, source_kind, source_id, read_at, created_at';

export interface ActivityPage {
  items: ActivityItem[];
  hasMore: boolean;
}

export interface UnreadCounts {
  total: number;
  family: number;
  circle: number;
  byFamily: Record<string, number>;
  byCircle: Record<string, number>;
}

export async function fetchActivityPage(before?: string): Promise<ActivityPage> {
  let query = supabase
    .from('activity_notifications')
    .select(ACTIVITY_COLUMNS)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(ACTIVITY_PAGE_SIZE + 1);
  if (before) query = query.lt('created_at', before);
  const { data, error } = await query;
  if (error) throw error;
  const rows = (data as ActivityItem[] | null) ?? [];
  return {
    items: rows.slice(0, ACTIVITY_PAGE_SIZE),
    hasMore: rows.length > ACTIVITY_PAGE_SIZE,
  };
}

export async function fetchUnreadCounts(): Promise<UnreadCounts> {
  const { data, error } = await supabase
    .from('activity_notifications')
    .select('family_profile_id, circle_id')
    .is('read_at', null)
    .limit(1000);
  if (error) throw error;
  const counts: UnreadCounts = { total: 0, family: 0, circle: 0, byFamily: {}, byCircle: {} };
  for (const row of (data as { family_profile_id: string | null; circle_id: string | null }[] | null) ?? []) {
    counts.total += 1;
    if (row.family_profile_id) {
      counts.family += 1;
      counts.byFamily[row.family_profile_id] = (counts.byFamily[row.family_profile_id] ?? 0) + 1;
    }
    if (row.circle_id) {
      counts.circle += 1;
      counts.byCircle[row.circle_id] = (counts.byCircle[row.circle_id] ?? 0) + 1;
    }
  }
  return counts;
}

export async function markActivityRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from('activity_notifications')
    .update({ read_at: new Date().toISOString() })
    .in('id', ids)
    .is('read_at', null);
  if (error) throw error;
}

export async function markAllActivityRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('activity_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_profile_id', userId)
    .is('read_at', null);
  if (error) throw error;
}

export async function loadActivityPreferences(userId: string): Promise<ActivityPreferences> {
  const { data, error } = await supabase
    .from('activity_preferences')
    .select('family_activity, circle_activity, prayer_activity, encouragement_activity, sermon_activity')
    .eq('profile_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ActivityPreferences | null) ?? DEFAULT_ACTIVITY_PREFERENCES;
}

export async function saveActivityPreferences(userId: string, prefs: ActivityPreferences): Promise<void> {
  const { error } = await supabase
    .from('activity_preferences')
    .upsert(
      { profile_id: userId, ...prefs, updated_at: new Date().toISOString() },
      { onConflict: 'profile_id' },
    );
  if (error) throw error;
}

export function subscribeToActivity(userId: string, onChange: () => void): () => void {
  const channel = supabase
    .channel(`activity:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'activity_notifications', filter: `recipient_profile_id=eq.${userId}` },
      () => onChange(),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
