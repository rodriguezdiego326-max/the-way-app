// Church admin claims: members ask for publisher access to their own church.
// Approval happens server-side only; the client can create, read own, and withdraw.

import { supabase } from '@/lib/supabase';
import type { ChurchAdminClaim, VerifiedChurchRole } from '@/lib/togetherTypes';

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
): Promise<ChurchAdminClaim | null> {
  const { data, error } = await supabase
    .from('church_admin_claims')
    .insert({ church_id: churchId, requested_role: requestedRole })
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
