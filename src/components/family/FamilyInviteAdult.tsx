import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import {
  createFamilyInvitation,
  familyErrorMessage,
  revokeFamilyInvitation,
  type FamilyInvitation,
  type InvitationExpiryHours,
} from '@/lib/familyAccountEngine';
import CircleConfirmDialog from '@/components/circle/CircleConfirmDialog';
import FamilyInviteCard from '@/components/family/FamilyInviteCard';
import { REVOKE_INVITATION_DIALOG } from '@/lib/familyInviteShare';

interface FamilyInviteAdultProps {
  familyProfileId: string;
  familyName: string;
  onBack: () => void;
}

const EXPIRY_OPTIONS: { hours: InvitationExpiryHours; label: string }[] = [
  { hours: 24, label: '24 hours' },
  { hours: 168, label: '7 days' },
  { hours: null, label: 'No expiry' },
];

export default function FamilyInviteAdult({ familyProfileId, familyName, onBack }: FamilyInviteAdultProps) {
  const [expiresIn, setExpiresIn] = useState<InvitationExpiryHours>(168);
  const [invitation, setInvitation] = useState<FamilyInvitation | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const creatingRef = useRef(false);

  async function generateCode() {
    if (creatingRef.current) return;
    creatingRef.current = true;
    vibrate(10);
    setCreating(true);
    setCreateError(null);
    try {
      const created = await createFamilyInvitation(familyProfileId, expiresIn);
      setNotice(invitation ? 'Your earlier code stays valid until you revoke it or it expires.' : null);
      setInvitation(created);
      setHasGenerated(true);
    } catch (e) {
      setCreateError(familyErrorMessage(e));
    } finally {
      setCreating(false);
      creatingRef.current = false;
    }
  }

  async function confirmRevoke() {
    if (!invitation || revoking) return;
    setRevoking(true);
    setRevokeError(null);
    try {
      await revokeFamilyInvitation(invitation.id);
      setInvitation(null);
      setNotice('Invitation revoked. This code can no longer be used to join your Family.');
      setRevokeOpen(false);
    } catch (e) {
      setRevokeError(familyErrorMessage(e));
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost" aria-label="Close invite">
          <X size={20} />
        </button>
        <p className="ui-label">Invite Adult</p>
        <span className="w-10" />
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pt-6 nav-safe-padding animate-fade-in">
        <div className="flex flex-col gap-6">
          <p className="text-ivory-400 text-sm leading-relaxed">
            Invite another adult, such as a spouse, to share your Family. Shared content includes Family Prayer, Journey, Catechism, Walks, and Sermon Discussions. Children are not given accounts.
          </p>

          <div>
            <p className="ui-label mb-3">Code expires after</p>
            <div className="grid grid-cols-3 gap-2">
              {EXPIRY_OPTIONS.map((option) => {
                const selected = expiresIn === option.hours;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => { vibrate(6); setExpiresIn(option.hours); }}
                    aria-pressed={selected}
                    className={`min-h-[44px] rounded-xl border px-2 text-xs font-medium transition-all duration-300 ${
                      selected
                        ? 'border-gold-400/60 bg-gold-500/10 text-gold-200'
                        : 'border-ink-700 text-ivory-400 hover:border-ink-600'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {invitation && (
            <div className="flex flex-col gap-3 animate-fade-in-up">
              <FamilyInviteCard
                invitation={invitation}
                familyName={familyName}
                shareLabel="Share Invite"
                revokeLabel="Revoke Invitation"
                onRevoke={() => {
                  setRevokeError(null);
                  setRevokeOpen(true);
                }}
              />
              <p className="text-ivory-600 text-xs leading-relaxed px-1">
                Only share this code with an adult you trust. Anyone with it can join your Family until it expires or is revoked.
              </p>
            </div>
          )}

          {notice && (
            <p className="text-ivory-400 text-sm leading-relaxed animate-fade-in" role="status">{notice}</p>
          )}

          {createError && (
            <div className="premium-card p-3 border-error/30 animate-fade-in">
              <p className="text-error text-sm">{createError}</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-10 safe-bottom grid grid-cols-2 gap-3">
        <button onClick={onBack} className="btn-secondary w-full">
          Done
        </button>
        <button onClick={generateCode} disabled={creating} className="btn-primary w-full disabled:opacity-40">
          {creating ? 'Creating...' : hasGenerated ? 'Generate Another' : 'Create Invite Code'}
        </button>
      </div>

      {revokeOpen && (
        <CircleConfirmDialog
          title={REVOKE_INVITATION_DIALOG.title}
          body={REVOKE_INVITATION_DIALOG.body}
          confirmLabel={REVOKE_INVITATION_DIALOG.confirmLabel}
          cancelLabel={REVOKE_INVITATION_DIALOG.cancelLabel}
          destructive
          busy={revoking}
          error={revokeError}
          onConfirm={confirmRevoke}
          onCancel={() => setRevokeOpen(false)}
        />
      )}
    </div>
  );
}
