import { useState } from 'react';
import { Users, X } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import {
  acceptFamilyInvitation,
  familyErrorMessage,
  FAMILY_ERROR_COPY,
  previewFamilyInvitation,
  type InvitationPreview,
  type InvitationPreviewStatus,
} from '@/lib/familyAccountEngine';

interface FamilyJoinFormProps {
  onBack: () => void;
  onJoined: () => void;
}

const INVITATION_STATUS_COPY: Record<Exclude<InvitationPreviewStatus, 'valid'>, string> = {
  invalid: FAMILY_ERROR_COPY.invalid_code,
  expired: FAMILY_ERROR_COPY.expired,
  revoked: FAMILY_ERROR_COPY.revoked,
  used: FAMILY_ERROR_COPY.already_used,
  already_member: FAMILY_ERROR_COPY.already_member,
  already_in_family: FAMILY_ERROR_COPY.already_in_family,
  family_full: FAMILY_ERROR_COPY.family_full,
};

export default function FamilyJoinForm({ onBack, onJoined }: FamilyJoinFormProps) {
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [checking, setChecking] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedCode = code.replace(/\s+/g, '').toLowerCase();

  function changeCode(value: string) {
    setCode(value);
    setPreview(null);
    setError(null);
  }

  async function checkCode() {
    if (!normalizedCode || checking) return;
    vibrate(8);
    setChecking(true);
    setError(null);
    setPreview(null);
    try {
      const result = await previewFamilyInvitation(normalizedCode);
      if (result.status === 'valid') {
        setPreview(result);
      } else {
        setError(INVITATION_STATUS_COPY[result.status]);
      }
    } catch (e) {
      setError(familyErrorMessage(e));
    } finally {
      setChecking(false);
    }
  }

  async function joinFamily() {
    if (joining) return;
    vibrate(12);
    setJoining(true);
    setError(null);
    try {
      await acceptFamilyInvitation(normalizedCode);
      onJoined();
    } catch (e) {
      setError(familyErrorMessage(e));
      setJoining(false);
    }
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost" aria-label="Back to Family">
          <X size={20} />
        </button>
        <p className="ui-label">Join a Family</p>
        <span className="w-10" />
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pt-6 nav-safe-padding animate-fade-in">
        <div className="flex flex-col gap-6">
          <p className="text-ivory-400 text-sm leading-relaxed">
            Enter the invite code another adult shared with you. Once you join, you can use the Family's shared content together.
          </p>

          <div>
            <label htmlFor="family-invite-code" className="text-sm text-ivory-400 mb-2 block">Invite code</label>
            <input
              id="family-invite-code"
              autoFocus
              type="text"
              value={code}
              onChange={(e) => changeCode(e.target.value)}
              placeholder="Paste or type the code"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={64}
              className="input-field font-mono tracking-wider"
            />
          </div>

          {preview && (
            <div className="premium-card p-5 flex items-center gap-4 animate-fade-in-up">
              <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
                <Users size={18} className="text-gold-300" />
              </div>
              <div className="min-w-0">
                <p className="text-ivory-100 font-medium text-sm truncate">
                  {preview.family_name || 'My Family'}
                </p>
                <p className="text-ivory-600 text-xs mt-1">
                  {preview.adult_count ?? 1} {preview.adult_count === 1 ? 'adult' : 'adults'} in this Family
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="premium-card p-3 border-error/30 animate-fade-in">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-10 safe-bottom">
        {preview ? (
          <button onClick={joinFamily} disabled={joining} className="btn-primary w-full disabled:opacity-40">
            <Users size={18} />
            {joining ? 'Joining...' : 'Join this Family'}
          </button>
        ) : (
          <button onClick={checkCode} disabled={!normalizedCode || checking} className="btn-primary w-full disabled:opacity-40">
            {checking ? 'Checking...' : 'Check Code'}
          </button>
        )}
      </div>
    </div>
  );
}
