import { useRef, useState } from 'react';
import { Check, Copy, Share2, X } from 'lucide-react';
import { Share } from '@capacitor/share';
import { vibrate } from '@/lib/utils';
import {
  createFamilyInvitation,
  familyErrorMessage,
  type FamilyInvitation,
  type InvitationExpiryHours,
} from '@/lib/familyAccountEngine';

interface FamilyInviteAdultProps {
  familyProfileId: string;
  onBack: () => void;
}

const EXPIRY_OPTIONS: { hours: InvitationExpiryHours; label: string }[] = [
  { hours: 24, label: '24 hours' },
  { hours: 168, label: '7 days' },
  { hours: null, label: 'No expiry' },
];

function describeExpiry(expiresAt: string | null): string {
  if (!expiresAt) return 'This code does not expire.';
  return `This code expires ${new Date(expiresAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })}.`;
}

export default function FamilyInviteAdult({ familyProfileId, onBack }: FamilyInviteAdultProps) {
  const [expiresIn, setExpiresIn] = useState<InvitationExpiryHours>(168);
  const [invitation, setInvitation] = useState<FamilyInvitation | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const creatingRef = useRef(false);

  async function generateCode() {
    if (creatingRef.current) return;
    creatingRef.current = true;
    vibrate(10);
    setCreating(true);
    setError(null);
    setCopied(false);
    try {
      setInvitation(await createFamilyInvitation(familyProfileId, expiresIn));
    } catch (e) {
      setError(familyErrorMessage(e));
    } finally {
      setCreating(false);
      creatingRef.current = false;
    }
  }

  async function shareCode() {
    if (!invitation) return;
    vibrate(8);
    try {
      await Share.share({
        title: 'Join my SOLAPATH Family',
        text: `Join my SOLAPATH Family with this invite code: ${invitation.invite_code}`,
        dialogTitle: 'Share invite code',
      });
    } catch {
      setError('Sharing did not finish. You can copy the code instead.');
    }
  }

  async function copyCode() {
    if (!invitation) return;
    vibrate(8);
    try {
      await navigator.clipboard.writeText(invitation.invite_code);
      setCopied(true);
    } catch {
      setError('We could not copy the code. Select it and copy it manually.');
    }
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost" aria-label="Back to Family">
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

          {invitation ? (
            <div className="premium-card p-5 flex flex-col gap-4 animate-fade-in-up">
              <p className="text-ivory-500 text-xs uppercase tracking-[0.15em]">Invite code</p>
              <p className="font-mono text-ivory-50 text-lg tracking-wider break-all select-all">
                {invitation.invite_code}
              </p>
              <p className="text-ivory-600 text-xs leading-relaxed">{describeExpiry(invitation.expires_at)}</p>
              <p className="text-ivory-600 text-xs leading-relaxed">
                Only share this code with an adult you trust. Anyone with it can join your Family until it expires or you cancel it.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={shareCode} className="btn-primary w-full">
                  <Share2 size={16} /> Share
                </button>
                <button onClick={copyCode} className="btn-ghost w-full border border-ink-700 rounded-xl min-h-[44px]">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          ) : null}

          {error && (
            <div className="premium-card p-3 border-error/30 animate-fade-in">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-10 safe-bottom">
        <button onClick={generateCode} disabled={creating} className="btn-primary w-full disabled:opacity-40">
          {creating ? 'Creating...' : invitation ? 'Create New Code' : 'Create Invite Code'}
        </button>
      </div>
    </div>
  );
}
