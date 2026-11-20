import { useCallback, useEffect, useState } from 'react';
import { Crown, LogOut, Plus, Trash2 } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import {
  familyErrorMessage,
  getCurrentAccountId,
  leaveFamily,
  listFamilyAdults,
  removeFamilyAdult,
  type FamilyAdultSummary,
} from '@/lib/familyAccountEngine';
import CircleConfirmDialog from '@/components/circle/CircleConfirmDialog';
import FamilyPendingInvitations from '@/components/family/FamilyPendingInvitations';
import { useLanguage } from '@/lib/i18n';

interface FamilyAdultsPanelProps {
  familyProfileId: string;
  familyName: string;
  onInviteAdult: () => void;
  onLeft: () => void;
}

const FALLBACK_NAME = 'SOLAPATH Member';

export default function FamilyAdultsPanel({ familyProfileId, familyName, onInviteAdult, onLeft }: FamilyAdultsPanelProps) {
  const [adults, setAdults] = useState<FamilyAdultSummary[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<FamilyAdultSummary | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { language, t } = useLanguage();

  const self = adults.find((a) => a.profile_id === accountId);
  const isOwner = self?.family_role === 'OWNER';

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const [currentId, rows] = await Promise.all([
        getCurrentAccountId(),
        listFamilyAdults(familyProfileId),
      ]);
      setAccountId(currentId);
      setAdults(rows);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [familyProfileId]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmRemove() {
    if (!removeTarget || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await removeFamilyAdult(familyProfileId, removeTarget.profile_id);
      setAdults((prev) => prev.filter((a) => a.profile_id !== removeTarget.profile_id));
      setRemoveTarget(null);
    } catch (e) {
      setActionError(familyErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function confirmLeave() {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await leaveFamily(familyProfileId);
      setLeaveOpen(false);
      onLeft();
    } catch (e) {
      setActionError(familyErrorMessage(e));
    } finally {
      setBusy(false);
    }
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
      ) : loadFailed ? (
        <div className="premium-card p-4 flex items-center justify-between gap-3">
          <p className="text-error text-sm flex-1">We couldn't load Adults With Access. Please try again.</p>
          <button onClick={load} className="btn-ghost text-xs min-h-[44px] px-3">Retry</button>
        </div>
      ) : (
        <div className="premium-card divide-y divide-ink-700/50">
          {adults.map((adult) => {
            const isSelf = adult.profile_id === accountId;
            const name = adult.display_name?.trim() || FALLBACK_NAME;
            const roleLabel = adult.family_role === 'OWNER' ? 'Owner' : 'Adult';
            const joinedDate = new Date(adult.joined_at).toLocaleDateString(language === 'es' ? 'es-US' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const metaLabel = `${t(roleLabel)}${isSelf ? ` · ${t('You')}` : ''} · ${t('Joined')} ${joinedDate}`;
            return (
              <div key={adult.profile_id} className="flex items-center gap-3 p-4">
                <div className="w-8 h-8 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0">
                  {adult.family_role === 'OWNER' ? (
                    <Crown size={14} className="text-gold-300" />
                  ) : (
                    <span className="text-ivory-400 text-xs font-medium">{name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-ivory-200 text-sm font-medium truncate">{name}</p>
                  <p className="text-ivory-600 text-xs">{metaLabel}</p>
                </div>
                {isOwner && !isSelf && adult.family_role !== 'OWNER' && (
                  <button
                    onClick={() => {
                      vibrate(8);
                      setActionError(null);
                      setRemoveTarget(adult);
                    }}
                    className="btn-ghost text-xs"
                    aria-label={`Remove ${name} from Family`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && !loadFailed && isOwner && (
        <FamilyPendingInvitations familyProfileId={familyProfileId} familyName={familyName} />
      )}

      {!loading && !loadFailed && self && !isOwner && (
        <div className="premium-card p-4 flex items-center justify-between gap-3">
          <p className="text-ivory-500 text-xs leading-relaxed flex-1">
            Leaving removes your access to this Family's shared content. Your personal data stays with you.
          </p>
          <button
            onClick={() => {
              vibrate(8);
              setActionError(null);
              setLeaveOpen(true);
            }}
            className="btn-ghost text-xs shrink-0"
          >
            <LogOut size={14} /> Leave
          </button>
        </div>
      )}

      {!loading && !loadFailed && isOwner && (
        <div className="premium-card p-4">
          <p className="text-ivory-200 text-sm font-medium mb-1">Family owners can't leave yet</p>
          <p className="text-ivory-500 text-xs leading-relaxed">
            To keep the Family from becoming ownerless, the owner must remain. If you delete your SOLAPATH account, ownership will be safely preserved for another adult when possible.
          </p>
        </div>
      )}

      {removeTarget && (
        <CircleConfirmDialog
          title="Remove this adult from your Family?"
          body="They will immediately lose access to this Family and its shared discipleship content. Their personal SOLAPATH account and private data will not be deleted. Family content already created in this household will remain."
          confirmLabel="Remove"
          cancelLabel="Cancel"
          destructive
          busy={busy}
          error={actionError}
          onConfirm={confirmRemove}
          onCancel={() => setRemoveTarget(null)}
        />
      )}

      {leaveOpen && (
        <CircleConfirmDialog
          title="Leave this Family?"
          body="You'll lose access to this Family's shared discipleship content. Your personal SOLAPATH data will remain private and unchanged. Shared Family content will remain with the Family."
          confirmLabel="Leave Family"
          cancelLabel="Cancel"
          destructive
          busy={busy}
          error={actionError}
          onConfirm={confirmLeave}
          onCancel={() => setLeaveOpen(false)}
        />
      )}
    </div>
  );
}
