import { useState } from 'react';
import { X, Copy, Share2, Ban, Check } from 'lucide-react';
import { createCircleInvitation, revokeCircleInvitation } from '@/lib/togetherEngine';
import { vibrate } from '@/lib/utils';
import type { CircleInvitation } from '@/lib/togetherTypes';
import {
  INVITE_EXPIRY_OPTIONS,
  DEFAULT_INVITE_EXPIRY_HOURS,
  formatInviteExpiry,
  shareInvitation,
} from './circleInviteFormat';

interface Props {
  circleId: string;
  circleName: string;
  onChanged: () => void;
  onClose: () => void;
}

export default function InvitePeopleSheet({ circleId, circleName, onChanged, onClose }: Props) {
  const [expiryHours, setExpiryHours] = useState<number | null>(DEFAULT_INVITE_EXPIRY_HOURS);
  const [invitation, setInvitation] = useState<CircleInvitation | null>(null);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (generating || invitation) return;
    vibrate(10);
    setGenerating(true);
    setError(null);
    try {
      const inv = await createCircleInvitation(circleId, expiryHours);
      setInvitation(inv);
      setCopied(false);
      onChanged();
    } catch {
      setError("We couldn't create this invitation. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!invitation) return;
    vibrate(8);
    try {
      await navigator.clipboard.writeText(invitation.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy the code. Select it and copy it manually.');
    }
  }

  async function handleShare() {
    if (!invitation) return;
    vibrate(8);
    try {
      await shareInvitation(circleName, invitation.invite_code, invitation.expires_at);
    } catch {
      setError('Sharing is not available right now. Use Copy Code instead.');
    }
  }

  async function handleRevoke() {
    if (!invitation || revoking) return;
    setRevoking(true);
    setError(null);
    try {
      await revokeCircleInvitation(invitation.id);
      setInvitation(null);
      setConfirmRevoke(false);
      onChanged();
    } catch {
      setError("We couldn't revoke this invitation. Please try again.");
      setConfirmRevoke(false);
    } finally {
      setRevoking(false);
    }
  }

  function handleGenerateAnother() {
    setInvitation(null);
    setCopied(false);
    setError(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-ink-900 rounded-t-3xl p-6 max-h-[90dvh] overflow-y-auto animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl text-ivory-50">Invite People</h3>
          <button onClick={onClose} className="btn-ghost" aria-label="Close"><X size={18} /></button>
        </div>

        {!invitation ? (
          <>
            <p className="text-ivory-300 text-sm leading-relaxed mb-2">Each invitation can be used once. Generate a new invitation for each person you want to add.</p>
            <p className="ui-label mt-5 mb-2">Expires</p>
            <div className="grid grid-cols-3 gap-2 mb-5" role="radiogroup" aria-label="Invitation expiration">
              {INVITE_EXPIRY_OPTIONS.map((opt) => {
                const active = expiryHours === opt.hours;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={generating}
                    onClick={() => { vibrate(6); setExpiryHours(opt.hours); }}
                    className={`px-2 py-3 rounded-xl border text-xs font-medium transition-colors disabled:opacity-40 ${active ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {error && <p className="text-error text-xs mb-4" role="alert">{error}</p>}
            <button onClick={handleGenerate} disabled={generating} className="btn-primary w-full disabled:opacity-40">
              {generating ? 'Generating...' : 'Generate Invitation'}
            </button>
          </>
        ) : (
          <>
            <p className="text-ivory-400 text-sm leading-relaxed mb-3">Share this code with one person you trust.</p>
            <div className="premium-card p-4 mb-2 text-center">
              <p className="font-mono text-lg text-gold-300 tracking-wider break-all select-all">{invitation.invite_code}</p>
            </div>
            <p className="text-ivory-500 text-xs text-center mb-5">Expires: {formatInviteExpiry(invitation.expires_at)}</p>

            {error && <p className="text-error text-xs mb-4" role="alert">{error}</p>}

            <div className="grid grid-cols-2 gap-2 mb-2">
              <button onClick={handleCopy} className="btn-secondary w-full">
                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Code</>}
              </button>
              <button onClick={handleShare} className="btn-secondary w-full">
                <Share2 size={14} /> Share Invite
              </button>
            </div>

            {confirmRevoke ? (
              <div className="premium-card p-4 my-4">
                <p className="text-ivory-200 text-sm font-medium mb-1">Revoke this invitation?</p>
                <p className="text-ivory-500 text-xs leading-relaxed mb-4">This code will no longer be able to join the Circle. Existing members will not be affected.</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setConfirmRevoke(false)} disabled={revoking} className="btn-secondary w-full disabled:opacity-40">Cancel</button>
                  <button onClick={handleRevoke} disabled={revoking} className="btn-primary w-full disabled:opacity-40">{revoking ? 'Revoking...' : 'Revoke'}</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmRevoke(true)} disabled={revoking} className="w-full flex items-center justify-center gap-2 py-3 text-xs text-ivory-500 hover:text-error transition-colors disabled:opacity-40 mb-2">
                <Ban size={14} /> Revoke Invitation
              </button>
            )}

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={handleGenerateAnother} disabled={revoking} className="btn-secondary w-full disabled:opacity-40">Generate Another</button>
              <button onClick={onClose} className="btn-primary w-full">Done</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
