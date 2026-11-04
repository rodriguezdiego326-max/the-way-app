import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Send, X } from 'lucide-react';
import { vibrate, formatRelative } from '@/lib/utils';
import { getMyChurchAdminClaims, requestChurchAdminClaim, withdrawChurchAdminClaim } from '@/lib/churchAdminEngine';
import type { ChurchAdminClaim, ChurchMembership, VerifiedChurchRole } from '@/lib/togetherTypes';
import {
  VERIFIED_CHURCH_ROLES, VERIFIED_CHURCH_ROLE_LABELS, isVerifiedChurchPublisher,
} from '@/lib/togetherTypes';

interface Props {
  churchId: string;
  membership: ChurchMembership;
  onManageStudies: () => void;
}

export default function ChurchAdministrationCard({ churchId, membership, onManageStudies }: Props) {
  const [claims, setClaims] = useState<ChurchAdminClaim[]>([]);
  const [claimsLoaded, setClaimsLoaded] = useState(false);
  const [requestRole, setRequestRole] = useState<VerifiedChurchRole>('CHURCH_ADMIN');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClaims = useCallback(async () => {
    const all = await getMyChurchAdminClaims();
    setClaims(all.filter((c) => c.church_id === churchId));
    setClaimsLoaded(true);
  }, [churchId]);

  useEffect(() => { loadClaims(); }, [loadClaims, membership.verified_church_role]);

  const verifiedRole = membership.verified_church_role;
  const isPublisher = isVerifiedChurchPublisher(verifiedRole);
  const pending = claims.find((c) => c.status === 'pending');
  const latest = claims[0];

  async function handleRequest() {
    if (busy) return;
    vibrate(10);
    setBusy(true);
    setError(null);
    const created = await requestChurchAdminClaim(churchId, requestRole);
    setBusy(false);
    if (!created) {
      setError('Could not send your request. Please try again.');
      return;
    }
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

  return (
    <div className="premium-card p-5 mb-4">
      <p className="ui-label mb-3">Church Administration</p>

      {isPublisher && verifiedRole ? (
        <>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={16} className="text-gold-300 shrink-0" />
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-gold-500/10 text-gold-300">
              Verified Church Publisher
            </span>
          </div>
          <p className="text-ivory-200 text-sm">Role: {VERIFIED_CHURCH_ROLE_LABELS[verifiedRole]}</p>
          <p className="text-ivory-600 text-xs mt-2 leading-relaxed">
            This confirms publishing access for this church. It is not a statement of theological endorsement.
          </p>
          <button type="button" onClick={() => { vibrate(8); onManageStudies(); }} className="btn-secondary w-full text-sm mt-4">
            Manage Church Studies
          </button>
        </>
      ) : !claimsLoaded ? (
        <p className="text-ivory-600 text-xs">Checking your request...</p>
      ) : pending ? (
        <>
          <p className="text-ivory-200 text-sm">Request pending</p>
          <p className="text-ivory-600 text-xs mt-1 leading-relaxed">
            You asked for {VERIFIED_CHURCH_ROLE_LABELS[pending.requested_role]} access {formatRelative(pending.created_at)}. It is reviewed before any access is granted.
          </p>
          {error && <p className="text-error text-xs mt-3">{error}</p>}
          <button type="button" onClick={handleWithdraw} disabled={busy} className="btn-secondary w-full text-sm mt-4 disabled:opacity-40">
            <X size={14} /> {busy ? 'Working...' : 'Withdraw Request'}
          </button>
        </>
      ) : (
        <>
          {latest?.status === 'rejected' && (
            <p className="text-clay-400 text-xs mb-3 leading-relaxed">
              Your last request was not approved. You can ask again.
            </p>
          )}
          <p className="text-ivory-500 text-xs leading-relaxed mb-3">
            Church administration access is reviewed before it is granted. Membership, church ownership, and choosing a title such as Pastor do not grant it.
          </p>
          <p className="ui-label mb-2">Requested Role</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {VERIFIED_CHURCH_ROLES.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => { vibrate(6); setRequestRole(r); }}
                className={`px-3 py-2 rounded-xl border text-xs font-medium ${requestRole === r ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'}`}
              >
                {VERIFIED_CHURCH_ROLE_LABELS[r]}
              </button>
            ))}
          </div>
          {error && <p className="text-error text-xs mb-3">{error}</p>}
          <button type="button" onClick={handleRequest} disabled={busy} className="btn-primary w-full text-sm disabled:opacity-40">
            <Send size={14} /> {busy ? 'Sending...' : 'Request Church Admin Access'}
          </button>
        </>
      )}
    </div>
  );
}
