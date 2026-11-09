import { useState, useEffect, useCallback } from 'react';
import { Copy, Share2, Ban, Check } from 'lucide-react';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import { getPendingCircleInvitations, revokeCircleInvitation } from '@/lib/togetherEngine';
import { vibrate } from '@/lib/utils';
import type { CircleInvitation } from '@/lib/togetherTypes';
import CircleConfirmDialog from './CircleConfirmDialog';
import { formatInviteCreated, formatInviteExpiry, shareInvitation } from './circleInviteFormat';

interface Props {
  circleId: string;
  circleName: string;
  refreshKey: number;
}

export default function PendingInvitationsList({ circleId, circleName, refreshKey }: Props) {
  const [invitations, setInvitations] = useState<CircleInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<CircleInvitation | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      setInvitations(await getPendingCircleInvitations(circleId));
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [circleId]);

  useEffect(() => { load(); }, [load, refreshKey]);

  async function handleCopy(inv: CircleInvitation) {
    vibrate(8);
    try {
      await navigator.clipboard.writeText(inv.invite_code);
      setCopiedId(inv.id);
      setTimeout(() => setCopiedId((current) => (current === inv.id ? null : current)), 2000);
    } catch {
      setShareError('Could not copy the code. Select it and copy it manually.');
    }
  }

  async function handleShareAgain(inv: CircleInvitation) {
    vibrate(8);
    setShareError(null);
    try {
      await shareInvitation(circleName, inv.invite_code, inv.expires_at);
    } catch {
      setShareError('Sharing is not available right now. Use Copy instead.');
    }
  }

  async function handleRevoke() {
    if (!revokeTarget || revoking) return;
    setRevoking(true);
    setRevokeError(null);
    try {
      await revokeCircleInvitation(revokeTarget.id);
      const revokedId = revokeTarget.id;
      setInvitations((list) => list.filter((i) => i.id !== revokedId));
      setRevokeTarget(null);
    } catch {
      setRevokeError("We couldn't revoke this invitation. Please try again.");
    } finally {
      setRevoking(false);
    }
  }

  return (
    <>
      <p className="ui-label mb-3">Pending Invitations</p>

      {loading && <LoadingState message="Loading invitations..." />}
      {!loading && loadFailed && <ErrorState message="We couldn't load pending invitations." onRetry={load} />}

      {!loading && !loadFailed && invitations.length === 0 && (
        <EmptyState message="No pending invitations. Generate an invitation when you're ready to add someone to this Circle." />
      )}

      {!loading && !loadFailed && invitations.length > 0 && (
        <div className="flex flex-col gap-2 mb-6">
          {shareError && <p className="text-error text-xs mb-1" role="alert">{shareError}</p>}
          {invitations.map((inv) => (
            <div key={inv.id} className="premium-card p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-ivory-500 text-xs">Created {formatInviteCreated(inv.created_at)}</p>
                <p className="text-ivory-500 text-xs">{inv.expires_at ? `Expires ${formatInviteExpiry(inv.expires_at)}` : 'No expiration'}</p>
              </div>
              <p className="font-mono text-gold-300 tracking-wider text-base break-all select-all mb-3">{inv.invite_code}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => handleCopy(inv)} className="btn-secondary text-xs flex-1">
                  {copiedId === inv.id ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
                <button onClick={() => handleShareAgain(inv)} className="btn-secondary text-xs flex-1">
                  <Share2 size={12} /> Share Again
                </button>
                <button
                  onClick={() => { vibrate(6); setRevokeError(null); setRevokeTarget(inv); }}
                  className="btn-ghost text-xs text-ivory-500 hover:text-error"
                  aria-label="Revoke invitation"
                >
                  <Ban size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {revokeTarget && (
        <CircleConfirmDialog
          title="Revoke this invitation?"
          body="This code will no longer be able to join the Circle. Existing members will not be affected."
          confirmLabel="Revoke"
          cancelLabel="Cancel"
          destructive
          busy={revoking}
          error={revokeError}
          onConfirm={handleRevoke}
          onCancel={() => setRevokeTarget(null)}
        />
      )}
    </>
  );
}
