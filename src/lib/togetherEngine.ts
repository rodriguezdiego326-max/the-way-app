// Phase 8 — TOGETHER Engine
// Handles circles, shared prayers, scripture studies, check-ins,
// encouragements, accountability, and invitations.

import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import type {
  Circle, CircleMember, CircleInvitation, SharedPrayer, PrayerAcknowledgement,
  SharedScriptureStudy, SharedReflection, CircleCheckIn, Encouragement,
  AccountabilityRelationship,
} from '@/lib/togetherTypes';

// ============================================================
// CIRCLES
// ============================================================

export async function createCircle(
  profile: Profile,
  name: string,
  circleType: string,
  description?: string,
): Promise<Circle | null> {
  const { data: circle } = await supabase
    .from('circles')
    .insert({
      name,
      circle_type: circleType,
      description: description || null,
      owner_profile_id: profile.id,
      privacy: 'PRIVATE',
    })
    .select('*')
    .single();

  if (!circle) return null;

  await supabase.from('circle_members').insert({
    circle_id: (circle as Circle).id,
    profile_id: profile.id,
    role: 'OWNER',
  });

  return circle as Circle;
}

export async function getMyCircles(profile: Profile): Promise<Circle[]> {
  const { data } = await supabase
    .from('circle_members')
    .select('circle_id, circles(*)')
    .eq('profile_id', profile.id)
    .order('joined_at', { ascending: false });

  return ((data || []) as unknown as Array<{ circles: Circle }>)
    .map((d) => d.circles)
    .filter(Boolean);
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

// ============================================================
// INVITATIONS
// ============================================================

export async function createInvitation(
  circleId: string,
  invitedByProfileId: string,
  expiresAt?: string,
): Promise<CircleInvitation | null> {
  const { data } = await supabase
    .from('circle_invitations')
    .insert({
      circle_id: circleId,
      invited_by_profile_id: invitedByProfileId,
      expires_at: expiresAt || null,
    })
    .select('*')
    .single();
  return (data as CircleInvitation) || null;
}

export async function getInvitationsForProfile(profileId: string): Promise<Array<CircleInvitation & { circles: Circle }>> {
  const { data } = await supabase
    .from('circle_invitations')
    .select('*, circles(*)')
    .is('accepted_at', null)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });

  return ((data || []) as Array<CircleInvitation & { circles: Circle }>).filter((inv) => {
    return inv.circles && inv.circles.owner_profile_id === profileId;
  });
}

export async function getInvitationByCode(code: string): Promise<(CircleInvitation & { circles: Circle }) | null> {
  const { data } = await supabase
    .from('circle_invitations')
    .select('*, circles(*)')
    .eq('invite_code', code)
    .maybeSingle();
  return (data as CircleInvitation & { circles: Circle }) || null;
}

export async function acceptInvitation(
  code: string,
  profile: Profile,
): Promise<{ success: boolean; error?: string; circle?: Circle }> {
  const invitation = await getInvitationByCode(code);
  if (!invitation) return { success: false, error: 'Invitation not found' };
  if (invitation.revoked_at) return { success: false, error: 'This invitation has been revoked' };
  if (invitation.accepted_at) return { success: false, error: 'This invitation has already been used' };
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return { success: false, error: 'This invitation has expired' };
  }

  const { data: existing } = await supabase
    .from('circle_members')
    .select('id')
    .eq('circle_id', invitation.circle_id)
    .eq('profile_id', profile.id)
    .maybeSingle();

  if (existing) return { success: false, error: 'You are already a member of this Circle' };

  await supabase.from('circle_members').insert({
    circle_id: invitation.circle_id,
    profile_id: profile.id,
    role: 'MEMBER',
  });

  await supabase
    .from('circle_invitations')
    .update({
      accepted_at: new Date().toISOString(),
      accepted_by_profile_id: profile.id,
    })
    .eq('id', invitation.id);

  return { success: true, circle: invitation.circles };
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  await supabase
    .from('circle_invitations')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', invitationId);
}

export async function leaveCircle(circleId: string, profileId: string): Promise<void> {
  await supabase
    .from('circle_members')
    .delete()
    .eq('circle_id', circleId)
    .eq('profile_id', profileId);
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
  const { data } = await supabase
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
  return (data as SharedPrayer) || null;
}

export async function getSharedPrayers(circleId?: string): Promise<SharedPrayer[]> {
  let query = supabase.from('shared_prayers').select('*').order('created_at', { ascending: false });
  if (circleId) query = query.eq('circle_id', circleId);
  const { data } = await query;
  return (data as SharedPrayer[]) || [];
}

export async function updatePrayerStatus(prayerId: string, status: string): Promise<void> {
  await supabase.from('shared_prayers').update({ status, updated_at: new Date().toISOString() }).eq('id', prayerId);
}

// ============================================================
// PRAYER ACKNOWLEDGEMENTS (I Prayed For You)
// ============================================================

export async function acknowledgePrayer(prayerId: string, profileId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('prayer_acknowledgements')
    .select('id')
    .eq('shared_prayer_id', prayerId)
    .eq('profile_id', profileId)
    .maybeSingle();

  if (existing) return false;

  await supabase.from('prayer_acknowledgements').insert({
    shared_prayer_id: prayerId,
    profile_id: profileId,
  });
  return true;
}

export async function getAcknowledgementCount(prayerId: string): Promise<number> {
  const { count } = await supabase
    .from('prayer_acknowledgements')
    .select('id', { count: 'exact', head: true })
    .eq('shared_prayer_id', prayerId);
  return count || 0;
}

export async function getAcknowledgementsForPrayer(prayerId: string): Promise<PrayerAcknowledgement[]> {
  const { data } = await supabase
    .from('prayer_acknowledgements')
    .select('*')
    .eq('shared_prayer_id', prayerId);
  return (data as PrayerAcknowledgement[]) || [];
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
  const { data } = await supabase
    .from('shared_scripture_studies')
    .select('*')
    .eq('circle_id', circleId)
    .order('created_at', { ascending: false });
  return (data as SharedScriptureStudy[]) || [];
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
  const { data } = await supabase
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
  return (data as SharedReflection) || null;
}

export async function updateReflectionVisibility(reflectionId: string, visibility: string): Promise<void> {
  await supabase.from('shared_reflections').update({ visibility }).eq('id', reflectionId);
}

export async function getReflections(circleId?: string, scriptureStudyId?: string): Promise<SharedReflection[]> {
  let query = supabase.from('shared_reflections').select('*').order('created_at', { ascending: false });
  if (circleId) query = query.eq('circle_id', circleId);
  if (scriptureStudyId) query = query.eq('scripture_study_id', scriptureStudyId);
  const { data } = await query;
  return (data as SharedReflection[]) || [];
}

export async function getMyReflections(profileId: string): Promise<SharedReflection[]> {
  const { data } = await supabase
    .from('shared_reflections')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
  return (data as SharedReflection[]) || [];
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
  const { data } = await supabase
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
  return (data as CircleCheckIn) || null;
}

export async function getCheckIns(circleId: string): Promise<CircleCheckIn[]> {
  const { data } = await supabase
    .from('circle_check_ins')
    .select('*')
    .eq('circle_id', circleId)
    .order('created_at', { ascending: false });
  return (data as CircleCheckIn[]) || [];
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
  const { data } = await supabase
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
  return (data as Encouragement) || null;
}

export async function getEncouragementsForProfile(profileId: string): Promise<Encouragement[]> {
  const { data } = await supabase
    .from('encouragements')
    .select('*')
    .eq('to_profile_id', profileId)
    .order('created_at', { ascending: false });
  return (data as Encouragement[]) || [];
}

export async function getEncouragementsForCircle(circleId: string): Promise<Encouragement[]> {
  const { data } = await supabase
    .from('encouragements')
    .select('*')
    .eq('circle_id', circleId)
    .order('created_at', { ascending: false });
  return (data as Encouragement[]) || [];
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
