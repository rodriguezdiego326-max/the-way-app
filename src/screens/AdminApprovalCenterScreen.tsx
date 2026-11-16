import { useCallback, useEffect, useState } from 'react';
import { Ban, BookOpen, Check, History, RefreshCw, ShieldCheck, Trash2, UserCheck, X, XCircle } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import {
  adminDeleteChurchStudy,
  getAppAdminRole,
  listChurchAdminAccessForReview,
  listChurchAdminAudit,
  listChurchAdminClaimsForReview,
  listChurchStudiesForAdmin,
  reviewChurchAdminClaim,
  revokeChurchAdminAccess,
  verifyPastorClaim,
} from '@/lib/appAdminEngine';
import { formatRelative, vibrate } from '@/lib/utils';
import type {
  AdminChurchStudyItem,
  AppAdminRole,
  ChurchAdminAccessItem,
  ChurchAdminAuditItem,
  ChurchAdminReviewItem,
  VerifiedChurchRole,
} from '@/lib/togetherTypes';
import { VERIFIED_CHURCH_ROLE_LABELS } from '@/lib/togetherTypes';

interface Props {
  currentProfileId: string;
  onBack: () => void;
}

type Tab = 'pending' | 'access' | 'studies' | 'audit';

type PendingAction =
  | { kind: 'approve'; id: string; title: string; body: string }
  | { kind: 'reject'; id: string; title: string; body: string }
  | { kind: 'revoke'; id: string; title: string; body: string }
  | { kind: 'delete_study'; id: string; title: string; body: string };

function roleLabel(role: VerifiedChurchRole | null | undefined): string {
  return role ? VERIFIED_CHURCH_ROLE_LABELS[role] || role : 'Church access';
}

export default function AdminApprovalCenterScreen({ currentProfileId, onBack }: Props) {
  const [adminRole, setAdminRole] = useState<AppAdminRole | null>(null);
  const [claims, setClaims] = useState<ChurchAdminReviewItem[]>([]);
  const [access, setAccess] = useState<ChurchAdminAccessItem[]>([]);
  const [studies, setStudies] = useState<AdminChurchStudyItem[]>([]);
  const [audit, setAudit] = useState<ChurchAdminAuditItem[]>([]);
  const [tab, setTab] = useState<Tab>('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [verifyingClaimId, setVerifyingClaimId] = useState<string | null>(null);
  const [staffPageConfirmed, setStaffPageConfirmed] = useState(false);
  const [directChurchConfirmed, setDirectChurchConfirmed] = useState(false);
  const [verificationNote, setVerificationNote] = useState('');
  const [verificationBusy, setVerificationBusy] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const role = await getAppAdminRole();
      setAdminRole(role);
      if (!role) {
        setClaims([]);
        setAccess([]);
        setStudies([]);
        setAudit([]);
        setError('This account does not have SOLAPATH app-owner administration access.');
        return;
      }
      const [claimRows, accessRows, studyRows, auditRows] = await Promise.all([
        listChurchAdminClaimsForReview('pending'),
        listChurchAdminAccessForReview(),
        listChurchStudiesForAdmin(),
        listChurchAdminAudit(),
      ]);
      setClaims(claimRows);
      setAccess(accessRows);
      setStudies(studyRows);
      setAudit(auditRows);
    } catch (err) {
      console.error('[Admin] approval center load failed', err);
      setError('Could not load the approval center. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmAction() {
    if (!pendingAction || actionBusy) return;
    vibrate(12);
    setActionBusy(true);
    setError(null);

    const ok = pendingAction.kind === 'revoke'
      ? await revokeChurchAdminAccess(pendingAction.id)
      : pendingAction.kind === 'delete_study'
        ? await adminDeleteChurchStudy(pendingAction.id)
        : await reviewChurchAdminClaim(
          pendingAction.id,
          pendingAction.kind === 'approve' ? 'approved' : 'rejected',
        );

    setActionBusy(false);
    if (!ok) {
      setError('The access change could not be completed. Refresh and try again.');
      setPendingAction(null);
      return;
    }

    setPendingAction(null);
    await load(true);
  }

  async function handleVerifyPastor(claimId: string) {
    if (verificationBusy || !staffPageConfirmed || !directChurchConfirmed || !verificationNote.trim()) return;
    vibrate(12);
    setVerificationBusy(true);
    setError(null);
    const ok = await verifyPastorClaim(claimId, verificationNote);
    setVerificationBusy(false);
    if (!ok) {
      setError('Pastor verification could not be saved. Confirm both checks and try again.');
      return;
    }
    setVerifyingClaimId(null);
    setStaffPageConfirmed(false);
    setDirectChurchConfirmed(false);
    setVerificationNote('');
    await load(true);
  }

  const ownerLabel = adminRole === 'APP_OWNER' ? 'App Owner' : 'App Admin';

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost" aria-label="Close admin approval center">
          <X size={20} />
        </button>
        <p className="ui-label">Admin Approval Center</p>
        <button
          type="button"
          onClick={() => { vibrate(6); void load(true); }}
          className="btn-ghost"
          aria-label="Refresh admin approval center"
          disabled={refreshing}
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto nav-safe-padding px-6 py-6">
        <section className="premium-card p-5 border-gold-500/20 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} className="text-gold-300" />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-xl text-ivory-50">{ownerLabel}</p>
              <p className="text-ivory-500 text-xs mt-1 leading-relaxed">
                Approve, reject, or revoke verified church administration access, and remove church studies when development or moderation cleanup requires it.
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-4 gap-2 mb-5">
          {([
            ['pending', 'Requests', claims.length],
            ['access', 'Access', access.length],
            ['studies', 'Studies', studies.length],
            ['audit', 'Audit', audit.length],
          ] as const).map(([id, label, count]) => (
            <button
              type="button"
              key={id}
              onClick={() => { vibrate(5); setTab(id); }}
              className={`rounded-xl border px-2 py-3 text-xs font-medium transition-colors ${
                tab === id
                  ? 'bg-gold-500/10 border-gold-500/40 text-gold-200'
                  : 'bg-ink-800/40 border-ink-700/40 text-ivory-500'
              }`}
            >
              {label}
              <span className="block font-serif text-lg text-ivory-100 mt-0.5">{count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingState message="Loading administration requests..." />
        ) : error && !adminRole ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : (
          <>
            {error && <div className="premium-card p-3 mb-4 border-error/30"><p className="text-error text-xs">{error}</p></div>}

            {tab === 'pending' && (
              <section>
                <p className="ui-label mb-3">Pending Church & Pastor Access</p>
                {claims.length === 0 ? (
                  <EmptyState message="No pending church or pastor access requests." />
                ) : (
                  <div className="flex flex-col gap-3">
                    {claims.map((claim) => {
                      const self = claim.profile_id === currentProfileId;
                      const name = claim.claimant_name || 'SOLAPATH member';
                      return (
                        <div key={claim.claim_id} className="premium-card p-5">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-ink-700/50 flex items-center justify-center shrink-0">
                              <UserCheck size={16} className="text-gold-300" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-ivory-100 text-sm font-medium">{name}</p>
                                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-gold-500/10 text-gold-300">
                                  {roleLabel(claim.requested_role)}
                                </span>
                              </div>
                              <p className="text-ivory-400 text-xs mt-1">{claim.church_name}{claim.church_city ? ` · ${claim.church_city}` : ''}</p>
                              <p className="text-ivory-600 text-[11px] mt-2">Requested {formatRelative(claim.created_at)}</p>
                              {self && (
                                <p className="text-clay-400 text-xs mt-3">Self-review is blocked by the server. Another app admin would need to review this request.</p>
                              )}
                            </div>
                          </div>

                          {claim.requested_role === 'PASTOR' && (
                            <div className="rounded-xl border border-gold-500/20 bg-gold-500/5 p-4 mt-4">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-gold-200 text-xs font-medium">Pastor Identity Verification</p>
                                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                                  claim.pastor_verification_status === 'verified'
                                    ? 'bg-sage-500/10 text-sage-400'
                                    : 'bg-gold-500/10 text-gold-300'
                                }`}>
                                  {claim.pastor_verification_status === 'verified' ? 'Verified' : 'Verification Required'}
                                </span>
                              </div>
                              <div className="mt-3 space-y-2 text-xs">
                                {claim.church_website && (
                                  <p className="text-ivory-500">
                                    Church website: <a href={claim.church_website} target="_blank" rel="noreferrer" className="text-gold-300 underline">Open</a>
                                  </p>
                                )}
                                <p className="text-ivory-500">
                                  Staff evidence: {claim.evidence_staff_url
                                    ? <a href={claim.evidence_staff_url} target="_blank" rel="noreferrer" className="text-gold-300 underline">Open official staff page</a>
                                    : <span className="text-clay-400">Missing</span>}
                                </p>
                                <p className="text-ivory-500">Church contact: <span className="text-ivory-300">{claim.evidence_church_contact || 'Missing'}</span></p>
                              </div>

                              {claim.pastor_verification_status !== 'verified' && verifyingClaimId !== claim.claim_id && !self && (
                                <button
                                  type="button"
                                  className="btn-secondary w-full text-xs mt-3"
                                  onClick={() => {
                                    setVerifyingClaimId(claim.claim_id);
                                    setStaffPageConfirmed(false);
                                    setDirectChurchConfirmed(false);
                                    setVerificationNote('');
                                  }}
                                >
                                  <ShieldCheck size={13} /> Verify Pastor Identity
                                </button>
                              )}

                              {verifyingClaimId === claim.claim_id && (
                                <div className="mt-4 pt-4 border-t border-gold-500/10">
                                  <label className="flex items-start gap-2 text-xs text-ivory-300 mb-3">
                                    <input
                                      type="checkbox"
                                      checked={staffPageConfirmed}
                                      onChange={(e) => setStaffPageConfirmed(e.target.checked)}
                                      className="mt-0.5"
                                    />
                                    I confirmed this person is listed as a pastor on an official church source.
                                  </label>
                                  <label className="flex items-start gap-2 text-xs text-ivory-300 mb-3">
                                    <input
                                      type="checkbox"
                                      checked={directChurchConfirmed}
                                      onChange={(e) => setDirectChurchConfirmed(e.target.checked)}
                                      className="mt-0.5"
                                    />
                                    I independently confirmed the pastor's identity/role through the church's official contact channel.
                                  </label>
                                  <textarea
                                    value={verificationNote}
                                    onChange={(e) => setVerificationNote(e.target.value)}
                                    placeholder="Verification note — e.g. staff page matched and church office confirmed."
                                    className="input-field min-h-[80px] resize-none text-sm"
                                  />
                                  <div className="grid grid-cols-2 gap-2 mt-3">
                                    <button
                                      type="button"
                                      className="btn-secondary text-xs"
                                      disabled={verificationBusy}
                                      onClick={() => setVerifyingClaimId(null)}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-primary text-xs"
                                      disabled={verificationBusy || !staffPageConfirmed || !directChurchConfirmed || !verificationNote.trim()}
                                      onClick={() => void handleVerifyPastor(claim.claim_id)}
                                    >
                                      {verificationBusy ? 'Saving...' : 'Mark Verified'}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {claim.pastor_verification_status === 'verified' && claim.pastor_verification_note && (
                                <p className="text-sage-400 text-xs mt-3 leading-relaxed">{claim.pastor_verification_note}</p>
                              )}
                            </div>
                          )}

                          {!self && (
                            <div className="grid grid-cols-2 gap-2 mt-4">
                              <button
                                type="button"
                                className="btn-secondary text-sm"
                                onClick={() => setPendingAction({
                                  kind: 'reject',
                                  id: claim.claim_id,
                                  title: 'Reject access request?',
                                  body: `${name} will not receive ${roleLabel(claim.requested_role)} access for ${claim.church_name}.`,
                                })}
                              >
                                <XCircle size={14} /> Reject
                              </button>
                              <button
                                type="button"
                                className="btn-primary text-sm disabled:opacity-40"
                                disabled={claim.requested_role === 'PASTOR' && claim.pastor_verification_status !== 'verified'}
                                onClick={() => setPendingAction({
                                  kind: 'approve',
                                  id: claim.claim_id,
                                  title: claim.requested_role === 'PASTOR' ? 'Approve verified Pastor?' : 'Approve verified access?',
                                  body: `${name} will receive ${roleLabel(claim.requested_role)} access for ${claim.church_name}.`,
                                })}
                              >
                                <Check size={14} /> {claim.requested_role === 'PASTOR' && claim.pastor_verification_status !== 'verified' ? 'Verify First' : 'Approve'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {tab === 'access' && (
              <section>
                <p className="ui-label mb-3">Verified Access</p>
                {access.length === 0 ? (
                  <EmptyState message="No verified church administration access is active." />
                ) : (
                  <div className="flex flex-col gap-3">
                    {access.map((item) => {
                      const self = item.profile_id === currentProfileId;
                      const name = item.member_name || 'SOLAPATH member';
                      return (
                        <div key={item.membership_id} className="premium-card p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-ivory-100 text-sm font-medium">{name}{self ? ' · You' : ''}</p>
                                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-sage-500/10 text-sage-400">
                                  {roleLabel(item.verified_role)}
                                </span>
                              </div>
                              <p className="text-ivory-400 text-xs mt-1">{item.church_name}{item.church_city ? ` · ${item.church_city}` : ''}</p>
                              {item.granted_at && <p className="text-ivory-600 text-[11px] mt-2">Approved {formatRelative(item.granted_at)}</p>}
                            </div>
                            {!self && (
                              <button
                                type="button"
                                className="btn-ghost text-clay-400 shrink-0"
                                onClick={() => setPendingAction({
                                  kind: 'revoke',
                                  id: item.membership_id,
                                  title: 'Revoke verified access?',
                                  body: `${name} will lose ${roleLabel(item.verified_role)} access for ${item.church_name}. They can request access again later.`,
                                })}
                              >
                                <Ban size={15} /> Revoke
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {tab === 'studies' && (
              <section>
                <p className="ui-label mb-3">Church Studies</p>
                <div className="premium-card p-4 mb-4 border-clay-500/20">
                  <p className="text-ivory-200 text-xs font-medium">App Admin Cleanup</p>
                  <p className="text-ivory-500 text-xs mt-1 leading-relaxed">
                    Delete is permanent. Removing a study also removes its study assignments. Church profiles and member accounts are not deleted.
                  </p>
                </div>
                {studies.length === 0 ? (
                  <EmptyState message="No church studies exist." />
                ) : (
                  <div className="flex flex-col gap-3">
                    {studies.map((study) => (
                      <div key={study.study_id} className="premium-card p-5">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-ink-700/50 flex items-center justify-center shrink-0">
                            <BookOpen size={16} className="text-gold-300" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-ivory-100 text-sm font-medium">{study.title}</p>
                              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-ink-700/60 text-ivory-400">
                                {study.status}
                              </span>
                            </div>
                            <p className="text-ivory-400 text-xs mt-1">
                              {study.church_name}{study.church_city ? ` · ${study.church_city}` : ''}
                            </p>
                            <p className="text-ivory-600 text-[11px] mt-2">
                              {study.assignment_count} {study.assignment_count === 1 ? 'assignment' : 'assignments'} · Updated {formatRelative(study.updated_at)}
                            </p>
                            {study.description && (
                              <p className="text-ivory-500 text-xs mt-2 line-clamp-2">{study.description}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn-ghost text-error shrink-0"
                            aria-label={`Delete ${study.title}`}
                            onClick={() => setPendingAction({
                              kind: 'delete_study',
                              id: study.study_id,
                              title: 'Permanently delete study?',
                              body: `"${study.title}" from ${study.church_name} will be permanently deleted along with ${study.assignment_count} ${study.assignment_count === 1 ? 'assignment' : 'assignments'}. This cannot be undone.`,
                            })}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {tab === 'audit' && (
              <section>
                <p className="ui-label mb-3">Approval Audit</p>
                {audit.length === 0 ? (
                  <EmptyState message="No app-owner access decisions have been recorded yet." />
                ) : (
                  <div className="flex flex-col gap-3">
                    {audit.map((item) => (
                      <div key={item.audit_id} className="premium-card p-4 flex items-start gap-3">
                        <History size={15} className="text-gold-300 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-ivory-200 text-sm">
                            {item.actor_name || 'App admin'} {item.action} {roleLabel(item.verified_role)} access
                          </p>
                          <p className="text-ivory-500 text-xs mt-1">
                            {item.target_name || 'Member'}{item.church_name ? ` · ${item.church_name}` : ''}
                          </p>
                          <p className="text-ivory-600 text-[11px] mt-1">{formatRelative(item.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      {pendingAction && (
        <div className="fixed inset-0 z-[90] bg-black/70 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-ink-700/60 bg-ink-900 p-5 shadow-2xl">
            <p className="font-serif text-xl text-ivory-50">{pendingAction.title}</p>
            <p className="text-ivory-400 text-sm mt-2 leading-relaxed">{pendingAction.body}</p>
            <div className="grid grid-cols-2 gap-2 mt-5">
              <button type="button" className="btn-secondary" disabled={actionBusy} onClick={() => setPendingAction(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={pendingAction.kind === 'approve' ? 'btn-primary' : 'btn-secondary text-clay-400 border-clay-500/30'}
                disabled={actionBusy}
                onClick={() => void confirmAction()}
              >
                {actionBusy
                  ? 'Working...'
                  : pendingAction.kind === 'approve'
                    ? 'Approve'
                    : pendingAction.kind === 'reject'
                      ? 'Reject'
                      : pendingAction.kind === 'delete_study'
                        ? 'Delete'
                        : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
