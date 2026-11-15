import { supabase } from '@/lib/supabase';
import type { FamilyProfile } from '@/lib/familyTypes';

export type InvitationExpiryHours = 24 | 168 | null;

export interface FamilyAdultSummary {
  profile_id: string;
  display_name: string;
  family_role: 'OWNER' | 'ADULT';
  joined_at: string;
}

export interface FamilyInvitation {
  id: string;
  invite_code: string;
  expires_at: string | null;
  created_at: string;
}

export type InvitationPreviewStatus =
  | 'valid'
  | 'invalid'
  | 'expired'
  | 'revoked'
  | 'used'
  | 'already_member'
  | 'already_in_family'
  | 'family_full';

export interface InvitationPreview {
  status: InvitationPreviewStatus;
  family_name?: string | null;
  expires_at?: string | null;
  adult_count?: number;
}

export interface AcceptInvitationResult {
  status: 'joined';
  family_profile_id: string;
  family_name: string | null;
}

export const FAMILY_ERROR_COPY: Record<string, string> = {
  not_authenticated: 'Please sign in again and try once more.',
  already_in_family: 'Your account already belongs to a Family. Leave it before joining another.',
  already_member: 'You are already a member of this Family.',
  already_used: 'This invite code has already been used.',
  revoked: 'This invite code was cancelled by the Family owner.',
  expired: 'This invite code has expired. Ask for a new one.',
  invalid_code: 'We could not find that invite code. Check it and try again.',
  family_full: 'This Family already has the maximum of six adults.',
  not_family_owner: 'Only the Family owner can do this.',
  cannot_remove_self: 'You cannot remove yourself from the Family.',
  cannot_remove_owner: 'The Family owner cannot be removed.',
  member_not_found: 'That adult is no longer in the Family.',
  owner_cannot_leave: 'Owners cannot leave their Family. Ownership moves to another adult only when the owner deletes their account.',
  not_a_member: 'You are no longer a member of this Family.',
  invalid_expiry: 'Choose 24 hours, 7 days, or no expiry.',
};

export function familyErrorMessage(error: unknown): string {
  const code = error instanceof Error ? error.message.trim() : '';
  return FAMILY_ERROR_COPY[code] ?? 'Something went wrong. Please try again.';
}

function requireData<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null || data === undefined) throw new Error('empty_response');
  return data;
}

export async function getCurrentAccountId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  const id = data?.user?.id;
  if (error || !id) throw new Error('not_authenticated');
  return id;
}

export async function createFamilyProfile(familyName: string): Promise<FamilyProfile> {
  const { data, error } = await supabase.rpc('create_family_profile', { p_family_name: familyName });
  return requireData(data as FamilyProfile | null, error);
}

export async function listFamilyAdults(familyProfileId: string): Promise<FamilyAdultSummary[]> {
  const { data, error } = await supabase.rpc('get_family_account_summaries', { p_family_profile_id: familyProfileId });
  if (error) throw new Error(error.message);
  return (data as FamilyAdultSummary[]) ?? [];
}

export async function listPendingInvitations(familyProfileId: string): Promise<FamilyInvitation[]> {
  const { data, error } = await supabase
    .from('family_invitations')
    .select('id, invite_code, expires_at, created_at')
    .eq('family_profile_id', familyProfileId)
    .is('accepted_at', null)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  const now = Date.now();
  return ((data as FamilyInvitation[]) ?? []).filter(
    (inv) => inv.expires_at === null || new Date(inv.expires_at).getTime() > now,
  );
}

export async function createFamilyInvitation(
  familyProfileId: string,
  expiresInHours: InvitationExpiryHours,
): Promise<FamilyInvitation> {
  const { data, error } = await supabase.rpc('create_family_invitation', {
    p_family_profile_id: familyProfileId,
    p_expires_in_hours: expiresInHours,
  });
  return requireData(data as FamilyInvitation | null, error);
}

export async function revokeFamilyInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase.rpc('revoke_family_invitation', { p_invitation_id: invitationId });
  if (error) throw new Error(error.message);
}

export async function previewFamilyInvitation(code: string): Promise<InvitationPreview> {
  const { data, error } = await supabase.rpc('preview_family_invitation', { p_code: code });
  return requireData(data as InvitationPreview | null, error);
}

export async function acceptFamilyInvitation(code: string): Promise<AcceptInvitationResult> {
  const { data, error } = await supabase.rpc('accept_family_invitation', { p_code: code });
  return requireData(data as AcceptInvitationResult | null, error);
}

export async function removeFamilyAdult(familyProfileId: string, profileId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_family_adult', {
    p_family_profile_id: familyProfileId,
    p_target_profile_id: profileId,
  });
  if (error) throw new Error(error.message);
}

export async function leaveFamily(familyProfileId: string): Promise<void> {
  const { error } = await supabase.rpc('leave_family', { p_family_profile_id: familyProfileId });
  if (error) throw new Error(error.message);
}
