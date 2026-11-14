// Phase 8 — TOGETHER Engine
// Handles circles, shared prayers, scripture studies, check-ins,
// encouragements, accountability, and invitations.

import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import type {
  Circle, CircleMember, CircleMemberSummary, CircleInvitation, CircleInvitePreview,
  CircleInviteAcceptResult, SharedPrayer, PrayerAcknowledgement,
  SharedScriptureStudy, SharedReflection, CircleCheckIn, Encouragement,
  AccountabilityRelationship, CircleSermonDiscussion,
} from '@/lib/togetherTypes';

// ============================================================
// CIRCLES
// ============================================================

export async function createCircle(
  name: string,
  circleType: string,
  description?: string,
): Promise<Circle | null> {
  const { data, error } = await supabase.rpc('create_circle', {
    p_name: name,
    p_circle_type: circleType,
    p_description: description || null,
  });
  if (error || !data) return null;
  return data as Circle;
}

export async function loadMyCircles(profile: Profile): Promise<Circle[]> {
  const { data, error } = await supabase
    .from('circle_members')
    .select('circle_id, circles(*)')
    .eq('profile_id', profile.id)
    .order('joined_at', { ascending: false });
  if (error) throw error;

  return ((data || []) as unknown as Array<{ circles: Circle }>)
    .map((d) => d.circles)
    .filter(Boolean);
}

export async function getMyCircles(profile: Profile): Promise<Circle[]> {
  return loadMyCircles(profile).catch(() => []);
}

export async function getCircle(circleId: string): Promise<Circle | null> {
  const { data } = await supabase
    .from('circles')
    .select('*')
    .eq('id', circleId)
    .maybeSingle();
  return (data as Circle) || null;
}

export async function getCircleMembers(circleId: string): Promise<CircleMember[]> {
  const { data } = await supabase
    .from('circle_members')
    .select('*')
    .eq('circle_id', circleId)
    .order('joined_at');
  return (data as CircleMember[]) || [];
}

export async function getMyRole(circleId: string, profileId: string): Promise<string | null> {
  const { data } = await supabase
    .from('circle_members')
    .select('role')
    .eq('circle_id', circleId)
    .eq('profile_id', profileId)
    .maybeSingle();
  return (data as { role: string } | null)?.role || null;
}

export async function getCircleMemberSummaries(circleId: string): Promise<CircleMemberSummary[]> {
  const { data, error } = await supabase.rpc('get_circle_member_summaries', { p_circle_id: circleId });
  if (error) throw error;
  return (data as CircleMemberSummary[]) ?? [];
}

// ============================================================
// INVITATIONS
// ============================================================

export async function createCircleInvitation(
  circleId: string,
  expiresInHours: number | null,
): Promise<CircleInvitation> {
  const { data, error } = await supabase.rpc('create_circle_invitation', {
    p_circle_id: circleId,
    p_expires_in_hours: expiresInHours,
  });
  if (error || !data) throw error ?? new Error('Invitation was not created');
  return data as CircleInvitation;
}

export async function getPendingCircleInvitations(circleId: string): Promise<CircleInvitation[]> {
  const { data, error } = await supabase
    .from('circle_invitations')
    .select('*')
    .eq('circle_id', circleId)
    .is('accepted_at', null)
    .is('revoked_at', null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as CircleInvitation[]) ?? [];
}

export async function revokeCircleInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase.rpc('revoke_circle_invitation', { p_invitation_id: invitationId });
  if (error) throw error;
}

export async function previewCircleInvitation(code: string): Promise<CircleInvitePreview> {
  const { data, error } = await supabase.rpc('preview_circle_invitation', { p_code: code });
  if (error || !data) throw error ?? new Error('Invitation could not be checked');
  return data as CircleInvitePreview;
}

export async function acceptCircleInvitation(code: string): Promise<CircleInviteAcceptResult> {
  const { data, error } = await supabase.rpc('accept_circle_invitation', { p_code: code });
  if (error || !data) throw error ?? new Error('Invitation could not be accepted');
  return data as CircleInviteAcceptResult;
}

// ============================================================
// MEMBERSHIP
// ============================================================

async function deleteCircleMembership(circleId: string, profileId: string): Promise<void> {
  const { data, error } = await supabase
    .from('circle_members')
    .delete()
    .eq('circle_id', circleId)
    .eq('profile_id', profileId)
    .select('id');
  if (error) throw error;
  if (!data?.length) throw new Error('Membership was not removed');
}

export async function removeCircleMember(circleId: string, profileId: string): Promise<void> {
  return deleteCircleMembership(circleId, profileId);
}

export async function leaveCircle(circleId: string, profileId: string): Promise<void> {
  return deleteCircleMembership(circleId, profileId);
}

// ============================================================
// SHARED PRAYERS
// ============================================================

export async function createSharedPrayer(
  profileId: string,
  title: string,
  description?: string,
  relatedScripture?: string,
  circleId?: string,
  visibility: string = 'private',
): Promise<SharedPrayer | null> {
  const { data, error } = await supabase
    .from('shared_prayers')
    .insert({
      title,
      description: description || null,
      related_scripture: relatedScripture || null,
      profile_id: profileId,
      circle_id: circleId || null,
      visibility,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as SharedPrayer;
}

export async function getSharedPrayers(circleId?: string): Promise<SharedPrayer[]> {
  let query = supabase.from('shared_prayers').select('*').order('created_at', { ascending: false });
  if (circleId) query = query.eq('circle_id', circleId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as SharedPrayer[]) ?? [];
}

export async function updatePrayerStatus(prayerId: string, status: string): Promise<void> {
  const { error } = await supabase.from('shared_prayers').update({ status, updated_at: new Date().toISOString() }).eq('id', prayerId);
  if (error) throw error;
}

// ============================================================
// PRAYER ACKNOWLEDGEMENTS (I Prayed For You)
// ============================================================

export async function acknowledgePrayer(prayerId: string, profileId: string): Promise<boolean> {
  const { data: existing, error: lookupError } = await supabase
    .from('prayer_acknowledgements')
    .select('id')
    .eq('shared_prayer_id', prayerId)
    .eq('profile_id', profileId)
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (existing) return false;

  const { error } = await supabase.from('prayer_acknowledgements').insert({
    shared_prayer_id: prayerId,
    profile_id: profileId,
  });
  if (error) throw error;
  return true;
}

export async function getAcknowledgementCounts(prayerIds: string[]): Promise<Record<string, number>> {
  if (prayerIds.length === 0) return {};
  const { data, error } = await supabase.rpc('get_prayer_acknowledgement_counts', { p_prayer_ids: prayerIds });
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of (data as { shared_prayer_id: string; ack_count: number }[]) ?? []) {
    counts[row.shared_prayer_id] = Number(row.ack_count);
  }
  return counts;
}

export async function getMyAcknowledgedPrayerIds(profileId: string, prayerIds: string[]): Promise<Set<string>> {
  if (prayerIds.length === 0) return new Set();
  const { data, error } = await supabase
    .from('prayer_acknowledgements')
    .select('shared_prayer_id')
    .eq('profile_id', profileId)
    .in('shared_prayer_id', prayerIds);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.shared_prayer_id as string));
}

// ============================================================
// SHARED SCRIPTURE STUDIES
// ============================================================

export async function createScriptureStudy(
  circleId: string,
  assignedByProfileId: string,
  passageReference: string,
  readingObjective?: string,
  meetingDate?: string,
): Promise<SharedScriptureStudy | null> {
  const { data } = await supabase
    .from('shared_scripture_studies')
    .insert({
      circle_id: circleId,
      assigned_by_profile_id: assignedByProfileId,
      passage_reference: passageReference,
      reading_objective: readingObjective || null,
      observe_prompt: 'What does the text say?',
      understand_prompt: 'What does it mean in context?',
      discuss_prompt: 'What should we wrestle with together?',
      apply_prompt: 'How should this affect our lives?',
      prayer_prompt: null,
      go_deeper_prompt: null,
      meeting_date: meetingDate || null,
    })
    .select('*')
    .single();
  return (data as SharedScriptureStudy) || null;
}

export async function getScriptureStudies(circleId: string): Promise<SharedScriptureStudy[]> {
  const { data, error } = await supabase
    .from('shared_scripture_studies')
    .select('*')
    .eq('circle_id', circleId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as SharedScriptureStudy[]) ?? [];
}

// ============================================================
// SHARED REFLECTIONS
// ============================================================

export async function createReflection(
  profileId: string,
  body: string,
  visibility: string = 'private',
  circleId?: string,
  scriptureStudyId?: string,
): Promise<SharedReflection | null> {
  const { data, error } = await supabase
    .from('shared_reflections')
    .insert({
      profile_id: profileId,
      body,
      visibility,
      circle_id: circleId || null,
      scripture_study_id: scriptureStudyId || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as SharedReflection;
}

export async function updateReflectionVisibility(reflectionId: string, visibility: string): Promise<void> {
  const { error } = await supabase.from('shared_reflections').update({ visibility }).eq('id', reflectionId);
  if (error) throw error;
}

export async function getReflections(circleId?: string, scriptureStudyId?: string): Promise<SharedReflection[]> {
  let query = supabase.from('shared_reflections').select('*').order('created_at', { ascending: false });
  if (circleId) query = query.eq('circle_id', circleId);
  if (scriptureStudyId) query = query.eq('scripture_study_id', scriptureStudyId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as SharedReflection[]) ?? [];
}

export async function getMyReflections(profileId: string): Promise<SharedReflection[]> {
  const { data, error } = await supabase
    .from('shared_reflections')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as SharedReflection[]) ?? [];
}

// ============================================================
// CIRCLE CHECK-INS
// ============================================================

export async function createCheckIn(
  profileId: string,
  state: string,
  note?: string,
  visibility: string = 'private',
  circleId?: string,
): Promise<CircleCheckIn | null> {
  const { data, error } = await supabase
    .from('circle_check_ins')
    .insert({
      profile_id: profileId,
      state,
      note: note || null,
      visibility,
      circle_id: circleId || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as CircleCheckIn;
}

export async function getCheckIns(circleId: string): Promise<CircleCheckIn[]> {
  const { data, error } = await supabase
    .from('circle_check_ins')
    .select('*')
    .eq('circle_id', circleId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as CircleCheckIn[]) ?? [];
}

// ============================================================
// ENCOURAGEMENTS
// ============================================================

export async function sendEncouragement(
  fromProfileId: string,
  toProfileId: string,
  actionType: string,
  message?: string,
  circleId?: string,
): Promise<Encouragement | null> {
  const { data, error } = await supabase
    .from('encouragements')
    .insert({
      from_profile_id: fromProfileId,
      to_profile_id: toProfileId,
      action_type: actionType,
      message: message || null,
      circle_id: circleId || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Encouragement;
}

export async function getEncouragementsForProfile(profileId: string): Promise<Encouragement[]> {
  const { data, error } = await supabase
    .from('encouragements')
    .select('*')
    .or(`to_profile_id.eq.${profileId},from_profile_id.eq.${profileId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Encouragement[]) ?? [];
}

// ============================================================
// ACCOUNTABILITY
// ============================================================

export async function getAccountability(profileId: string): Promise<AccountabilityRelationship | null> {
  const { data } = await supabase
    .from('accountability_relationships')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();
  return (data as AccountabilityRelationship) || null;
}

export async function setAccountability(
  profileId: string,
  areas: string[],
  optIn: boolean,
  partnerProfileId?: string,
  circleId?: string,
): Promise<AccountabilityRelationship | null> {
  const existing = await getAccountability(profileId);
  if (existing) {
    const { data } = await supabase
      .from('accountability_relationships')
      .update({
        areas,
        opt_in: optIn,
        partner_profile_id: partnerProfileId || null,
        circle_id: circleId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('*')
      .single();
    return (data as AccountabilityRelationship) || null;
  }
  const { data } = await supabase
    .from('accountability_relationships')
    .insert({
      profile_id: profileId,
      areas,
      opt_in: optIn,
      partner_profile_id: partnerProfileId || null,
      circle_id: circleId || null,
    })
    .select('*')
    .single();
  return (data as AccountabilityRelationship) || null;
}

// ============================================================
// CIRCLE SERMON DISCUSSIONS
// Writes and reads throw on failure so the UI can show an error instead of an empty list.
// ============================================================

export interface CircleSermonDiscussionDraft {
  sermonTitle: string | null;
  discussionBody: string;
  scriptureReferences: string[];
}

export async function createCircleSermonDiscussion(
  circleId: string,
  draft: CircleSermonDiscussionDraft,
): Promise<CircleSermonDiscussion> {
  const { data, error } = await supabase
    .from('circle_sermon_discussions')
    .insert({
      circle_id: circleId,
      sermon_title: draft.sermonTitle,
      discussion_body: draft.discussionBody,
      scripture_references: draft.scriptureReferences,
    })
    .select('*')
    .single();
  if (error || !data) throw error ?? new Error('Discussion was not created');
  return data as CircleSermonDiscussion;
}

export async function getCircleSermonDiscussions(circleId: string): Promise<CircleSermonDiscussion[]> {
  const { data, error } = await supabase
    .from('circle_sermon_discussions')
    .select('*')
    .eq('circle_id', circleId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as CircleSermonDiscussion[]) ?? [];
}

export async function deleteCircleSermonDiscussion(discussionId: string): Promise<void> {
  const { error } = await supabase
    .from('circle_sermon_discussions')
    .delete()
    .eq('id', discussionId);
  if (error) throw error;
}
