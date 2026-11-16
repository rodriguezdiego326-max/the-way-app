// Church admin claims: members ask for publisher access to their own church.
// Approval happens server-side only; the client can create, read own, and withdraw.

import { supabase } from '@/lib/supabase';
import type { ChurchAdminClaim, DelegatableChurchRoleClaim, VerifiedChurchRole } from '@/lib/togetherTypes';

export async function getMyChurchAdminClaims(): Promise<ChurchAdminClaim[]> {
  const { data, error } = await supabase
    .from('church_admin_claims')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[Church] load admin claims failed', { code: error.code, message: error.message });
    return [];
  }
  return (data as ChurchAdminClaim[]) || [];
}

export async function requestChurchAdminClaim(
  churchId: string,
  requestedRole: VerifiedChurchRole,
  pastorEvidence?: { staffUrl: string; churchContact: string },
): Promise<ChurchAdminClaim | null> {
  const payload = requestedRole === 'PASTOR'
    ? {
        church_id: churchId,
        requested_role: requestedRole,
        evidence_staff_url: pastorEvidence?.staffUrl.trim() || null,
        evidence_church_contact: pastorEvidence?.churchContact.trim() || null,
        pastor_verification_status: 'pending',
      }
    : {
        church_id: churchId,
        requested_role: requestedRole,
        pastor_verification_status: 'not_required',
      };

  const { data, error } = await supabase
    .from('church_admin_claims')
    .insert(payload)
    .select('*')
    .single();
  if (error) {
    console.error('[Church] request admin claim failed', { code: error.code, message: error.message });
    return null;
  }
  return (data as ChurchAdminClaim) || null;
}

export async function withdrawChurchAdminClaim(claimId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('church_admin_claims')
    .update({ status: 'withdrawn' })
    .eq('id', claimId)
    .eq('status', 'pending')
    .select('id');
  if (error || !data || data.length === 0) {
    console.error('[Church] withdraw admin claim failed', { code: error?.code, message: error?.message });
    return false;
  }
  return true;
}


export async function getChurchRoleClaimsForDelegation(
  churchId: string,
): Promise<DelegatableChurchRoleClaim[]> {
  const { data, error } = await supabase.rpc('list_church_role_claims_for_delegation', {
    p_church_id: churchId,
  });
  if (error) {
    console.error('[Church] load delegated role claims failed', { code: error.code, message: error.message });
    return [];
  }
  return (data as DelegatableChurchRoleClaim[]) || [];
}

export async function reviewChurchRoleClaimAsLeader(
  claimId: string,
  decision: 'approved' | 'rejected',
): Promise<boolean> {
  const { error } = await supabase.rpc('review_church_role_claim_as_leader', {
    p_claim_id: claimId,
    p_decision: decision,
  });
  if (error) {
    console.error('[Church] delegated role review failed', { code: error.code, message: error.message });
    return false;
  }
  return true;
}
