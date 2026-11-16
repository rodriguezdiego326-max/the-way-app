import { useState, useEffect, useCallback } from 'react';
import { Check, ShieldCheck, Send, X, XCircle } from 'lucide-react';
import { vibrate, formatRelative } from '@/lib/utils';
import {
  getChurchRoleClaimsForDelegation,
  getMyChurchAdminClaims,
  requestChurchAdminClaim,
  reviewChurchRoleClaimAsLeader,
  withdrawChurchAdminClaim,
} from '@/lib/churchAdminEngine';
import type {
  ChurchAdminClaim,
  ChurchMembership,
  DelegatableChurchRoleClaim,
  VerifiedChurchRole,
} from '@/lib/togetherTypes';
import {
  VERIFIED_CHURCH_ROLES,
  VERIFIED_CHURCH_ROLE_LABELS,
  isVerifiedChurchLeadership,
  isVerifiedChurchPublisher,
} from '@/lib/togetherTypes';

interface Props {
  churchId: string;
  membership: ChurchMembership;
  onManageStudies: () => void;
}

export default function ChurchAdministrationCard({ churchId, membership, onManageStudies }: Props) {
  const [claims, setClaims] = useState<ChurchAdminClaim[]>([]);
  const [delegatedClaims, setDelegatedClaims] = useState<DelegatableChurchRoleClaim[]>([]);
  const [claimsLoaded, setClaimsLoaded] = useState(false);
  const [requestRole, setRequestRole] = useState<VerifiedChurchRole>('CHURCH_ADMIN');
  const [pastorStaffUrl, setPastorStaffUrl] = useState('');
  const [pastorChurchContact, setPastorChurchContact] = useState('');
  const [busy, setBusy] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifiedRole = membership.verified_church_role;
  const isLeadership = isVerifiedChurchLeadership(verifiedRole);
  const isPublisher = isVerifiedChurchPublisher(verifiedRole);
  const canDelegate = verifiedRole === 'PASTOR' || verifiedRole === 'CHURCH_ADMIN';

  const loadClaims = useCallback(async () => {
    const all = await getMyChurchAdminClaims();
    setClaims(all.filter((c) => c.church_id === churchId));
    setClaimsLoaded(true);
  }, [churchId]);

  const loadDelegatedClaims = useCallback(async () => {
    if (!canDelegate) {
      setDelegatedClaims([]);
      return;
    }
    setDelegatedClaims(await getChurchRoleClaimsForDelegation(churchId));
  }, [canDelegate, churchId]);

  useEffect(() => {
    void loadClaims();
    void loadDelegatedClaims();
  }, [loadClaims, loadDelegatedClaims, membership.verified_church_role]);

  const pending = claims.find((c) => c.status === 'pending');
  const latest = claims[0];

  async function handleRequest() {
    if (busy) return;
    if (requestRole === 'PASTOR' && (!pastorStaffUrl.trim() || !pastorChurchContact.trim())) {
      setError('Pastor verification requires an official staff page and an official church contact.');
      return;
    }
    vibrate(10);
    setBusy(true);
    setError(null);
    const created = await requestChurchAdminClaim(
      churchId,
      requestRole,
      requestRole === 'PASTOR'
        ? { staffUrl: pastorStaffUrl, churchContact: pastorChurchContact }
        : undefined,
    );
    setBusy(false);
    if (!created) {
      setError('Could not send your request. Please try again.');
      return;
    }
    setPastorStaffUrl('');
    setPastorChurchContact('');
    await loadClaims();
  }

  async function handleWithdraw() {
    if (!pending || busy) return;
    vibrate(8);
    setBusy(true);
    setError(null);
    const ok = await withdrawChurchAdminClaim(pending.id);
    setBusy(false);
    if (!ok) {
      setError('Could not withdraw your request. Please try again.');
      return;
    }
    await loadClaims();
  }

  async function handleDelegatedReview(claimId: string, decision: 'approved' | 'rejected') {
    if (reviewingId) return;
    vibrate(10);
    setReviewingId(claimId);
    setError(null);
    const ok = await reviewChurchRoleClaimAsLeader(claimId, decision);
    setReviewingId(null);
    if (!ok) {
      setError('Could not update that leadership request.');
      return;
    }
    await loadDelegatedClaims();
  }

  return (
    <div className="premium-card p-5 mb-4">
      <p className="ui-label mb-3">Church Administration</p>

      {isLeadership && verifiedRole ? (
        <>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={16} className="text-gold-300 shrink-0" />
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-gold-500/10 text-gold-300">
              Verified Church Leadership
            </span>
          </div>
          <p className="text-ivory-200 text-sm">Role: {VERIFIED_CHURCH_ROLE_LABELS[verifiedRole as VerifiedChurchRole]}</p>
          <p className="text-ivory-600 text-xs mt-2 leading-relaxed">
            Verified leadership can manage church prayer and small groups for this church. Only a verified Pastor can create or manage Church Studies.
          </p>
          {isPublisher && (
            <button type="button" onClick={() => { vibrate(8); onManageStudies(); }} className="btn-secondary w-full text-sm mt-4">
              Manage Church Studies
            </button>
          )}

          {canDelegate && (
            <div className="mt-5 pt-5 border-t border-ink-700/40">
              <p className="ui-label mb-2">Leadership Requests</p>
              <p className="text-ivory-600 text-xs mb-3 leading-relaxed">
                You can authorize Church Admins, Elders, and Leaders for this church. Pastor verification is handled by SOLAPATH App Admin.
              </p>
              {delegatedClaims.length === 0 ? (
                <p className="text-ivory-600 text-xs">No pending leadership requests.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {delegatedClaims.map((claim) => (
                    <div key={claim.claim_id} className="rounded-xl border border-ink-700/40 bg-ink-800/30 p-3">
                      <p className="text-ivory-100 text-sm font-medium">{claim.claimant_name || 'SOLAPATH member'}</p>
                      <p className="text-ivory-500 text-xs mt-1">
                        {VERIFIED_CHURCH_ROLE_LABELS[claim.requested_role]} · {formatRelative(claim.created_at)}
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <button
                          type="button"
                          className="btn-secondary text-xs"
                          disabled={reviewingId === claim.claim_id}
                          onClick={() => void handleDelegatedReview(claim.claim_id, 'rejected')}
                        >
                          <XCircle size={13} /> Reject
                        </button>
                        <button
                          type="button"
                          className="btn-primary text-xs"
                          disabled={reviewingId === claim.claim_id}
                          onClick={() => void handleDelegatedReview(claim.claim_id, 'approved')}
                        >
                          <Check size={13} /> Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {error && <p className="text-error text-xs mt-3">{error}</p>}
        </>
      ) : !claimsLoaded ? (
        <p className="text-ivory-600 text-xs">Checking your request...</p>
      ) : pending ? (
        <>
          <p className="text-ivory-200 text-sm">Request pending</p>
          <p className="text-ivory-600 text-xs mt-1 leading-relaxed">
            You asked for {VERIFIED_CHURCH_ROLE_LABELS[pending.requested_role]} access {formatRelative(pending.created_at)}.
          </p>
          {pending.requested_role === 'PASTOR' && (
            <div className="rounded-xl border border-gold-500/20 bg-gold-500/5 p-3 mt-3">
              <p className="text-gold-200 text-xs font-medium">Pastor identity verification required</p>
              <p className="text-ivory-600 text-xs mt-1 leading-relaxed">
                SOLAPATH App Admin must confirm your name on an official church staff source and independently confirm your role with the church before Pastor access can be granted.
              </p>
            </div>
          )}
          {error && <p className="text-error text-xs mt-3">{error}</p>}
          <button type="button" onClick={handleWithdraw} disabled={busy} className="btn-secondary w-full text-sm mt-4 disabled:opacity-40">
            <X size={14} /> {busy ? 'Working...' : 'Withdraw Request'}
          </button>
        </>
      ) : (
        <>
          {latest?.status === 'rejected' && (
            <p className="text-clay-400 text-xs mb-3 leading-relaxed">Your last request was not approved. You can ask again.</p>
          )}
          {latest?.status === 'revoked' && (
            <p className="text-clay-400 text-xs mb-3 leading-relaxed">Your previous verified access was revoked. You can submit a new request.</p>
          )}
          <p className="text-ivory-500 text-xs leading-relaxed mb-3">
            Choosing a church title does not grant administrative access. Pastor requests require identity verification; other leadership roles require approval by a verified Pastor, Church Admin, or SOLAPATH App Admin.
          </p>
          <p className="ui-label mb-2">Requested Role</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {VERIFIED_CHURCH_ROLES.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => { vibrate(6); setRequestRole(r); setError(null); }}
                className={`px-3 py-2 rounded-xl border text-xs font-medium ${requestRole === r ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'}`}
              >
                {VERIFIED_CHURCH_ROLE_LABELS[r]}
              </button>
            ))}
          </div>

          {requestRole === 'PASTOR' && (
            <div className="rounded-xl border border-gold-500/20 bg-gold-500/5 p-4 mb-4">
              <p className="text-gold-200 text-xs font-medium mb-2">Pastor verification evidence</p>
              <p className="text-ivory-600 text-xs mb-3 leading-relaxed">
                Provide official sources. Approval still requires an independent church confirmation by SOLAPATH App Admin.
              </p>
              <input
                value={pastorStaffUrl}
                onChange={(e) => setPastorStaffUrl(e.target.value)}
                placeholder="Official church staff/pastor page URL"
                className="input-field mb-3"
                inputMode="url"
              />
              <input
                value={pastorChurchContact}
                onChange={(e) => setPastorChurchContact(e.target.value)}
                placeholder="Official church email or contact page"
                className="input-field"
              />
            </div>
          )}

          {error && <p className="text-error text-xs mb-3">{error}</p>}
          <button type="button" onClick={handleRequest} disabled={busy} className="btn-primary w-full text-sm disabled:opacity-40">
            <Send size={14} /> {busy ? 'Sending...' : requestRole === 'PASTOR' ? 'Request Pastor Verification' : 'Request Church Leadership Access'}
          </button>
        </>
      )}
    </div>
  );
}
