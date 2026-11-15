import { useCallback, useEffect, useState } from 'react';
import { Clock, Crown, LogOut, Plus, Trash2, X } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import {
  familyErrorMessage,
  getCurrentAccountId,
  leaveFamily,
  listFamilyAdults,
  listPendingInvitations,
  removeFamilyAdult,
  revokeFamilyInvitation,
  type FamilyAdultSummary,
  type FamilyInvitation,
} from '@/lib/familyAccountEngine';

interface FamilyAdultsPanelProps {
  familyProfileId: string;
  onInviteAdult: () => void;
  onLeft: () => void;
}

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return 'No expiry';
  return `Expires ${new Date(expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export default function FamilyAdultsPanel({ familyProfileId, onInviteAdult, onLeft }: FamilyAdultsPanelProps) {
  const [adults, setAdults] = useState<FamilyAdultSummary[]>([]);
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [confirmingKey, setConfirmingKey] = useState<string | null>(null);

  const isOwner = adults.some((a) => a.profile_id === accountId && a.family_role === 'OWNER');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [currentId, adultRows] = await Promise.all([
        getCurrentAccountId(),
        listFamilyAdults(familyProfileId),
      ]);
      setAccountId(currentId);
      setAdults(adultRows);
      const ownerNow = adultRows.some((a) => a.profile_id === currentId && a.family_role === 'OWNER');
      setInvitations(ownerNow ? await listPendingInvitations(familyProfileId) : []);
    } catch (e) {
      setError(familyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [familyProfileId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function runAction(key: string, action: () => Promise<void>, onSuccess?: () => void) {
    vibrate(10);
    setBusyKey(key);
    setError(null);
    try {
      await action();
      setConfirmingKey(null);
      onSuccess?.();
    } catch (e) {
      setError(familyErrorMessage(e));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleRemove(adult: FamilyAdultSummary) {
    await runAction(`remove:${adult.profile_id}`, async () => {
      await removeFamilyAdult(familyProfileId, adult.profile_id);
      setAdults((prev) => prev.filter((a) => a.profile_id !== adult.profile_id));
    });
  }

  async function handleRevoke(invitation: FamilyInvitation) {
    await runAction(`revoke:${invitation.id}`, async () => {
      await revokeFamilyInvitation(invitation.id);
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
    });
  }

  async function handleLeave() {
    await runAction('leave', () => leaveFamily(familyProfileId), onLeft);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="ui-label">Adults With Access</p>
        {isOwner && (
          <button onClick={() => { vibrate(8); onInviteAdult(); }} className="btn-ghost text-xs">
            <Plus size={14} /> Invite Adult
          </button>
        )}
      </div>

      {loading ? (
        <div className="premium-card h-16 animate-pulse" />
      ) : (
        <div className="premium-card divide-y divide-ink-700/50">
          {adults.map((adult) => {
            const isSelf = adult.profile_id === accountId;
            const removeKey = `remove:${adult.profile_id}`;
            const confirmingRemove = confirmingKey === removeKey;
            return (
              <div key={adult.profile_id} className="flex items-center gap-3 p-4">
                <div className="w-8 h-8 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0">
                  {adult.family_role === 'OWNER' ? (
                    <Crown size={14} className="text-gold-300" />
                  ) : (
                    <span className="text-ivory-400 text-xs font-medium">
                      {adult.display_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-ivory-200 text-sm font-medium truncate">
                    {isSelf ? 'You' : adult.display_name}
                  </p>
                  <p className="text-ivory-600 text-xs">
                    {adult.family_role === 'OWNER' ? 'Owner' : 'Adult'} · Joined{' '}
                    {new Date(adult.joined_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                {isOwner && !isSelf && adult.family_role !== 'OWNER' && (
                  confirmingRemove ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setConfirmingKey(null)}
                        className="btn-ghost text-xs"
                        aria-label="Cancel removing adult"
                      >
                        <X size={14} />
                      </button>
                      <button
                        onClick={() => handleRemove(adult)}
                        disabled={busyKey === removeKey}
                        className="text-error text-xs font-medium min-h-[44px] px-2 disabled:opacity-40"
                      >
                        {busyKey === removeKey ? 'Removing...' : 'Confirm'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { vibrate(8); setConfirmingKey(removeKey); }}
                      className="btn-ghost text-xs"
                      aria-label={`Remove ${adult.display_name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {isOwner && invitations.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-ivory-500 text-xs uppercase tracking-[0.15em]">Pending Invitations</p>
          {invitations.map((inv) => (
            <div key={inv.id} className="premium-card p-4 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-ivory-100 text-sm font-mono tracking-wider truncate">{inv.invite_code}</p>
                <p className="text-ivory-600 text-xs flex items-center gap-1 mt-1">
                  <Clock size={11} /> {formatExpiry(inv.expires_at)}
                </p>
              </div>
              <button
                onClick={() => handleRevoke(inv)}
                disabled={busyKey === `revoke:${inv.id}`}
                className="text-error text-xs font-medium min-h-[44px] px-2 disabled:opacity-40"
              >
                {busyKey === `revoke:${inv.id}` ? 'Cancelling...' : 'Cancel'}
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && !isOwner && accountId && adults.some((a) => a.profile_id === accountId) && (
        <div className="premium-card p-4 flex items-center justify-between gap-3">
          <p className="text-ivory-500 text-xs leading-relaxed flex-1">
            Leaving removes your access to shared Family content. Your personal data stays with you.
          </p>
          {confirmingKey === 'leave' ? (
            <button
              onClick={handleLeave}
              disabled={busyKey === 'leave'}
              className="text-error text-xs font-medium min-h-[44px] px-2 disabled:opacity-40"
            >
              {busyKey === 'leave' ? 'Leaving...' : 'Confirm'}
            </button>
          ) : (
            <button
              onClick={() => { vibrate(8); setConfirmingKey('leave'); }}
              className="btn-ghost text-xs shrink-0"
            >
              <LogOut size={14} /> Leave
            </button>
          )}
        </div>
      )}

      {!loading && isOwner && (
        <p className="text-ivory-600 text-xs leading-relaxed px-1">
          Owners cannot leave their Family. Ownership moves to another adult only when the owner deletes their account.
        </p>
      )}

      {error && (
        <div className="premium-card p-3 border-error/30 animate-fade-in">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
