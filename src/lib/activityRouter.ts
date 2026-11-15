import { supabase } from '@/lib/supabase';
import type { ActivityItem } from '@/lib/activityTypes';
import type { Circle } from '@/lib/togetherTypes';

export type ActivityDestination =
  | { kind: 'family' }
  | { kind: 'circle'; circleId: string };

export function resolveActivityDestination(item: ActivityItem): ActivityDestination | null {
  if (item.family_profile_id) return { kind: 'family' };
  if (item.circle_id) return { kind: 'circle', circleId: item.circle_id };
  return null;
}

export async function loadCircleForActivity(circleId: string): Promise<Circle | null> {
  const { data, error } = await supabase
    .from('circles')
    .select('*')
    .eq('id', circleId)
    .maybeSingle();
  if (error) throw error;
  return (data as Circle | null) ?? null;
}
