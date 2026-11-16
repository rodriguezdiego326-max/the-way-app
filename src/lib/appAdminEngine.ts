// App-owner administration for church and pastor access.
// Every privileged RPC re-checks the signed-in user against the private app-admin registry.

import { supabase } from '@/lib/supabase';
import type {
  AdminChurchStudyItem,
  AppAdminRole,
  ChurchAdminAccessItem,
  ChurchAdminAuditItem,
  ChurchAdminClaimStatus,
  ChurchAdminReviewItem,
} from '@/lib/togetherTypes';

export async function getAppAdminRole(): Promise<AppAdminRole | null> {
  const { data, error } = await supabase.rpc('get_app_admin_role');
  if (error) {
    console.error('[Admin] app admin role check failed', { code: error.code, message: error.message });
    return null;
  }
  return data === 'APP_OWNER' || data === 'APP_ADMIN' ? data : null;
}

export async function listChurchAdminClaimsForReview(
  status: ChurchAdminClaimStatus | null = 'pending',
): Promise<ChurchAdminReviewItem[]> {
  const { data, error } = await supabase.rpc('list_church_admin_claims_for_review', {
    p_status: status,
  });
  if (error) throw error;
  return (data as ChurchAdminReviewItem[]) || [];
}

export async function listChurchAdminAccessForReview(): Promise<ChurchAdminAccessItem[]> {
  const { data, error } = await supabase.rpc('list_church_admin_access_for_review');
  if (error) throw error;
  return (data as ChurchAdminAccessItem[]) || [];
}

export async function listChurchAdminAudit(): Promise<ChurchAdminAuditItem[]> {
  const { data, error } = await supabase.rpc('list_church_admin_audit');
  if (error) throw error;
  return (data as ChurchAdminAuditItem[]) || [];
}

export async function reviewChurchAdminClaim(
  claimId: string,
  decision: 'approved' | 'rejected',
): Promise<boolean> {
  const { error } = await supabase.rpc('review_church_admin_claim', {
    p_claim_id: claimId,
    p_decision: decision,
  });
  if (error) {
    console.error('[Admin] church access review failed', { code: error.code, message: error.message });
    return false;
  }
  return true;
}

export async function revokeChurchAdminAccess(membershipId: string): Promise<boolean> {
  const { error } = await supabase.rpc('revoke_church_admin_access', {
    p_membership_id: membershipId,
  });
  if (error) {
    console.error('[Admin] church access revoke failed', { code: error.code, message: error.message });
    return false;
  }
  return true;
}


export async function listChurchStudiesForAdmin(): Promise<AdminChurchStudyItem[]> {
  const { data, error } = await supabase.rpc('list_church_studies_for_admin');
  if (error) throw error;
  return (data as AdminChurchStudyItem[]) || [];
}

export async function adminDeleteChurchStudy(studyId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('admin_delete_church_study', {
    p_study_id: studyId,
  });
  if (error) {
    console.error('[Admin] church study delete failed', { code: error.code, message: error.message });
    return false;
  }
  const result = data as { deleted?: unknown } | null;
  return result?.deleted === true;
}
