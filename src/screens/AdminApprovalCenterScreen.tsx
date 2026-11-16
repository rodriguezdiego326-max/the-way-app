import { useCallback, useEffect, useState } from 'react';
import { Ban, Check, History, RefreshCw, ShieldCheck, UserCheck, X, XCircle } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import {
  getAppAdminRole,
  listChurchAdminAccessForReview,
  listChurchAdminAudit,
  listChurchAdminClaimsForReview,
  reviewChurchAdminClaim,
  revokeChurchAdminAccess,
} from '@/lib/appAdminEngine';
import { formatRelative, vibrate } from '@/lib/utils';
import type {
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

type Tab = 'pending' | 'access' | 'audit';

type PendingAction =
  | { kind: 'approve'; id: string; title: string; body: string }
  | { kind: 'reject'; id: string; title: string; body: string }
  | { kind: 'revoke'; id: string; title: string; body: string };

function roleLabel(role: VerifiedChurchRole | null | undefined): string {
  return role ? VERIFIED_CHURCH_ROLE_LABELS[role] || role : 'Church access';
}

export default function AdminApprovalCenterScreen({ currentProfileId, onBack }: Props) {
  const [adminRole, setAdminRole] = useState<AppAdminRole | null>(null);
  const [claims, setClaims] = useState<ChurchAdminReviewItem[]>([]);
  const [access, setAccess] = useState<ChurchAdminAccessItem[]>([]);
  const [audit, setAudit] = useState<ChurchAdminAuditItem[]>([]);
  const [tab, setTab] = useState<Tab>('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

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
        setAudit([]);
        setError('This account does not have SOLAPATH app-owner administration access.');
        return;
      }
      const [claimRows, accessRows, auditRows] = await Promise.all([
        listChurchAdminClaimsForReview('pending'),
        listChurchAdminAccessForReview(),
        listChurchAdminAudit(),
      ]);
      setClaims(claimRows);
      setAccess(accessRows);
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
                Approve, reject, or revoke verified church administration access. Personal church titles never grant these permissions by themselves.
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {([
            ['pending', 'Requests', claims.length],
            ['access', 'Access', access.length],
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
                                className="btn-primary text-sm"
                                onClick={() => setPendingAction({
                                  kind: 'approve',
                                  id: claim.claim_id,
                                  title: 'Approve verified access?',
                                  body: `${name} will receive ${roleLabel(claim.requested_role)} access for ${claim.church_name}.`,
                                })}
                              >
                                <Check size={14} /> Approve
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
                {actionBusy ? 'Working...' : pendingAction.kind === 'approve' ? 'Approve' : pendingAction.kind === 'reject' ? 'Reject' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
