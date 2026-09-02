// Phase 8 — CHURCH Engine
// Handles church profiles, memberships, sermons, sermon notes,
// church studies, church prayer items, and church groups.

import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import type {
  ChurchProfile, ChurchMembership, Sermon, SermonNote,
  ChurchStudy, ChurchStudyAssignment, ChurchPrayerItem,
  ChurchGroup, GroupDiscussion, NotificationPreferences,
} from '@/lib/togetherTypes';

// ============================================================
// CHURCH PROFILES
// ============================================================

export async function createChurch(
  name: string,
  city?: string,
  website?: string,
): Promise<ChurchProfile | null> {
  const { data, error } = await supabase
    .from('church_profiles')
    .insert({ name, city: city || null, website: website || null })
    .select('*')
    .single();

  if (error) {
    console.error('[Church] create church failed', {
      operation: 'insert',
      table: 'church_profiles',
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return null;
  }

  return (data as ChurchProfile) || null;
}

export async function getChurch(churchId: string): Promise<ChurchProfile | null> {
  const { data } = await supabase
    .from('church_profiles')
    .select('*')
    .eq('id', churchId)
    .maybeSingle();
  return (data as ChurchProfile) || null;
}

export async function updateChurch(
  churchId: string,
  updates: { name?: string; city?: string | null; website?: string | null },
): Promise<ChurchProfile | null> {
  const { data, error } = await supabase
    .from('church_profiles')
    .update(updates)
    .eq('id', churchId)
    .select('*')
    .single();
  if (error) {
    console.error('[Church] update church failed', {
      operation: 'update',
      table: 'church_profiles',
      code: error.code,
      message: error.message,
    });
    return null;
  }
  return (data as ChurchProfile) || null;
}

export async function searchChurches(query: string): Promise<ChurchProfile[]> {
  const { data, error } = await supabase
    .rpc('search_church_directory', { p_query: query });
  if (error) {
    console.error('[Church] search failed', {
      operation: 'rpc:search_church_directory',
      code: error.code,
      message: error.message,
    });
    return [];
  }
  return ((data as ChurchProfile[]) || []).map((c) => ({
    id: c.id,
    name: c.name,
    city: c.city || null,
    website: c.website || null,
  }));
}

// ============================================================
// CHURCH MEMBERSHIPS
// ============================================================

export async function joinChurch(
  profile: Profile,
  churchId: string,
  personalRole: string,
): Promise<ChurchMembership | null> {
  const { data: existing } = await supabase
    .from('church_memberships')
    .select('id')
    .eq('profile_id', profile.id)
    .eq('church_id', churchId)
    .maybeSingle();

  if (existing) {
    const { data } = await supabase
      .from('church_memberships')
      .update({ personal_role: personalRole })
      .eq('id', (existing as { id: string }).id)
      .select('*')
      .single();
    return (data as ChurchMembership) || null;
  }

  const { data } = await supabase
    .from('church_memberships')
    .insert({
      profile_id: profile.id,
      church_id: churchId,
      personal_role: personalRole,
    })
    .select('*')
    .single();
  return (data as ChurchMembership) || null;
}

export async function getMyChurchMembership(profileId: string): Promise<ChurchMembership | null> {
  const { data } = await supabase
    .from('church_memberships')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .maybeSingle();
  return (data as ChurchMembership) || null;
}

export async function getAllChurchMemberships(profileId: string): Promise<ChurchMembership[]> {
  const { data } = await supabase
    .from('church_memberships')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
  return (data as ChurchMembership[]) || [];
}

export async function leaveChurch(membershipId: string): Promise<boolean> {
  const { error } = await supabase
    .from('church_memberships')
    .delete()
    .eq('id', membershipId);
  if (error) {
    console.error('[Church] leave church failed', {
      operation: 'delete',
      table: 'church_memberships',
      code: error.code,
      message: error.message,
    });
    return false;
  }
  return true;
}

export async function isChurchOwner(profileId: string, churchId: string): Promise<boolean> {
  const { data } = await supabase
    .from('church_profiles')
    .select('id')
    .eq('id', churchId)
    .eq('user_id', profileId)
    .maybeSingle();
  return !!data;
}

// ============================================================
// SERMONS
// ============================================================

export async function createSermon(
  passage: string,
  date: string,
  churchId?: string,
  speaker?: string,
  title?: string,
  series?: string,
): Promise<Sermon | null> {
  const { data } = await supabase
    .from('sermons')
    .insert({
      passage,
      date,
      church_id: churchId || null,
      speaker: speaker || null,
      title: title || null,
      series: series || null,
    })
    .select('*')
    .single();
  return (data as Sermon) || null;
}

export async function getSermons(profileId?: string): Promise<Sermon[]> {
  let query = supabase.from('sermons').select('*').order('date', { ascending: false });
  if (profileId) {
    query = query.eq('church_id', '00000000-0000-0000-0000-000000000000');
  }
  const { data } = await query.limit(50);
  return (data as Sermon[]) || [];
}

export async function getRecentSermons(limit = 10): Promise<Sermon[]> {
  const { data } = await supabase
    .from('sermons')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit);
  return (data as Sermon[]) || [];
}

// ============================================================
// SERMON NOTES
// ============================================================

export async function createSermonNote(
  profileId: string,
  sermonId: string,
  notes?: string,
  mainPoint?: string,
  questions?: string,
  application?: string,
  prayer?: string,
): Promise<SermonNote | null> {
  const { data } = await supabase
    .from('sermon_notes')
    .insert({
      profile_id: profileId,
      sermon_id: sermonId,
      notes: notes || null,
      main_point: mainPoint || null,
      questions: questions || null,
      application: application || null,
      prayer: prayer || null,
    })
    .select('*')
    .single();
  return (data as SermonNote) || null;
}

export async function updateSermonNote(
  noteId: string,
  updates: Partial<Pick<SermonNote, 'notes' | 'main_point' | 'questions' | 'application' | 'prayer'>>,
): Promise<void> {
  await supabase.from('sermon_notes').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', noteId);
}

export async function getSermonNotes(profileId: string): Promise<Array<SermonNote & { sermons: Sermon }>> {
  const { data } = await supabase
    .from('sermon_notes')
    .select('*, sermons(*)')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
  return ((data || []) as Array<SermonNote & { sermons: Sermon }>).filter((n) => n.sermons);
}

export async function getSermonNoteForSermon(sermonId: string, profileId: string): Promise<SermonNote | null> {
  const { data } = await supabase
    .from('sermon_notes')
    .select('*')
    .eq('sermon_id', sermonId)
    .eq('profile_id', profileId)
    .maybeSingle();
  return (data as SermonNote) || null;
}

// ============================================================
// CHURCH STUDIES
// ============================================================

export async function getChurchStudies(churchId: string): Promise<ChurchStudy[]> {
  const { data } = await supabase
    .from('church_studies')
    .select('*')
    .eq('church_id', churchId)
    .order('created_at', { ascending: false });
  return (data as ChurchStudy[]) || [];
}

export async function getStudyAssignments(studyId: string): Promise<ChurchStudyAssignment[]> {
  const { data } = await supabase
    .from('church_study_assignments')
    .select('*')
    .eq('church_study_id', studyId)
    .order('created_at');
  return (data as ChurchStudyAssignment[]) || [];
}

// ============================================================
// CHURCH PRAYER ITEMS
// ============================================================

export async function getChurchPrayerItems(churchId: string): Promise<ChurchPrayerItem[]> {
  const { data } = await supabase
    .from('church_prayer_items')
    .select('*')
    .eq('church_id', churchId)
    .order('created_at', { ascending: false });
  return (data as ChurchPrayerItem[]) || [];
}

export async function createChurchPrayerItem(
  churchId: string,
  title: string,
  description?: string,
  category?: string,
): Promise<ChurchPrayerItem | null> {
  const { data, error } = await supabase
    .from('church_prayer_items')
    .insert({
      church_id: churchId,
      title: title.trim(),
      description: description?.trim() || null,
      category: category?.trim() || 'general',
    })
    .select('*')
    .single();
  if (error) {
    console.error('[Church] create prayer item failed', {
      operation: 'insert',
      table: 'church_prayer_items',
      code: error.code,
      message: error.message,
    });
    return null;
  }
  return (data as ChurchPrayerItem) || null;
}

export async function updateChurchPrayerItem(
  itemId: string,
  updates: { title?: string; description?: string | null; category?: string },
): Promise<ChurchPrayerItem | null> {
  const { data, error } = await supabase
    .from('church_prayer_items')
    .update({
      title: updates.title?.trim(),
      description: updates.description?.trim() || null,
      category: updates.category?.trim(),
    })
    .eq('id', itemId)
    .select('*')
    .single();
  if (error) {
    console.error('[Church] update prayer item failed', {
      operation: 'update',
      table: 'church_prayer_items',
      code: error.code,
      message: error.message,
    });
    return null;
  }
  return (data as ChurchPrayerItem) || null;
}

export async function deleteChurchPrayerItem(itemId: string): Promise<boolean> {
  const { error } = await supabase
    .from('church_prayer_items')
    .delete()
    .eq('id', itemId);
  if (error) {
    console.error('[Church] delete prayer item failed', {
      operation: 'delete',
      table: 'church_prayer_items',
      code: error.code,
      message: error.message,
    });
    return false;
  }
  return true;
}

// ============================================================
// CHURCH GROUPS
// ============================================================

export async function getChurchGroups(churchId: string): Promise<ChurchGroup[]> {
  const { data } = await supabase
    .from('church_groups')
    .select('*')
    .eq('church_id', churchId)
    .order('created_at', { ascending: false });
  return (data as ChurchGroup[]) || [];
}

export async function createChurchGroup(
  churchId: string,
  name: string,
  description?: string,
  meetingDay?: string,
  leaderProfileId?: string,
): Promise<ChurchGroup | null> {
  const { data, error } = await supabase
    .from('church_groups')
    .insert({
      church_id: churchId,
      name: name.trim(),
      description: description?.trim() || null,
      meeting_day: meetingDay?.trim() || null,
      leader_profile_id: leaderProfileId || null,
    })
    .select('*')
    .single();
  if (error) {
    console.error('[Church] create group failed', {
      operation: 'insert',
      table: 'church_groups',
      code: error.code,
      message: error.message,
    });
    return null;
  }
  return (data as ChurchGroup) || null;
}

export async function getGroupDiscussions(groupId: string): Promise<GroupDiscussion[]> {
  const { data } = await supabase
    .from('group_discussions')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });
  return (data as GroupDiscussion[]) || [];
}

export async function addGroupDiscussion(
  groupId: string,
  profileId: string,
  topic: string,
  body: string,
): Promise<GroupDiscussion | null> {
  const { data } = await supabase
    .from('group_discussions')
    .insert({ group_id: groupId, profile_id: profileId, topic, body })
    .select('*')
    .single();
  return (data as GroupDiscussion) || null;
}

// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================

export async function getNotificationPreferences(profileId: string): Promise<NotificationPreferences | null> {
  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();
  return (data as NotificationPreferences) || null;
}

export async function setNotificationPreferences(
  profileId: string,
  prefs: Partial<Pick<NotificationPreferences, 'together_notifications' | 'church_notifications' | 'quiet_hours_start' | 'quiet_hours_end' | 'sunday_mode'>>,
): Promise<void> {
  const existing = await getNotificationPreferences(profileId);
  if (existing) {
    await supabase.from('notification_preferences').update({
      ...prefs,
      updated_at: new Date().toISOString(),
    }).eq('id', existing.id);
  } else {
    await supabase.from('notification_preferences').insert({
      profile_id: profileId,
      ...prefs,
    });
  }
}
