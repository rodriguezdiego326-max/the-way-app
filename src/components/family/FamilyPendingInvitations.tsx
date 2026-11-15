import { useCallback, useEffect, useState } from 'react';
import {
  familyErrorMessage,
  listPendingInvitations,
  revokeFamilyInvitation,
  type FamilyInvitation,
} from '@/lib/familyAccountEngine';
import CircleConfirmDialog from '@/components/circle/CircleConfirmDialog';
import FamilyInviteCard from '@/components/family/FamilyInviteCard';
import { REVOKE_INVITATION_DIALOG } from '@/lib/familyInviteShare';

interface FamilyPendingInvitationsProps {
  familyProfileId: string;
  familyName: string;
}

export default function FamilyPendingInvitations({ familyProfileId, familyName }: FamilyPendingInvitationsProps) {
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<FamilyInvitation | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      setInvitations(await listPendingInvitations(familyProfileId));
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [familyProfileId]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmRevoke() {
    if (!revokeTarget || revoking) return;
    setRevoking(true);
    setRevokeError(null);
    try {
      await revokeFamilyInvitation(revokeTarget.id);
      setInvitations((prev) => prev.filter((inv) => inv.id !== revokeTarget.id));
      setRevokeTarget(null);
    } catch (e) {
      setRevokeError(familyErrorMessage(e));
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-ivory-500 text-xs uppercase tracking-[0.15em]">Pending Invitations</p>

      {loading ? (
        <div className="premium-card h-24 animate-pulse" />
      ) : loadFailed ? (
        <div className="premium-card p-4 flex items-center justify-between gap-3">
          <p className="text-error text-sm flex-1">We couldn't load pending invitations. Please try again.</p>
          <button onClick={load} className="btn-ghost text-xs min-h-[44px] px-3">Retry</button>
        </div>
      ) : invitations.length === 0 ? (
        <p className="text-ivory-600 text-xs px-1">No pending invitations.</p>
      ) : (
        invitations.map((inv) => (
          <FamilyInviteCard
            key={inv.id}
            invitation={inv}
            familyName={familyName}
            shareLabel="Share Again"
            revokeLabel="Revoke"
            onRevoke={() => {
              setRevokeError(null);
              setRevokeTarget(inv);
            }}
          />
        ))
      )}

      {revokeTarget && (
        <CircleConfirmDialog
          title={REVOKE_INVITATION_DIALOG.title}
          body={REVOKE_INVITATION_DIALOG.body}
          confirmLabel={REVOKE_INVITATION_DIALOG.confirmLabel}
          cancelLabel={REVOKE_INVITATION_DIALOG.cancelLabel}
          destructive
          busy={revoking}
          error={revokeError}
          onConfirm={confirmRevoke}
          onCancel={() => setRevokeTarget(null)}
        />
      )}
    </div>
  );
}
