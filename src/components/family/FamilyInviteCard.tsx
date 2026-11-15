import { useEffect, useState } from 'react';
import { Check, Copy, Link, Share2, Trash2 } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import type { FamilyInvitation } from '@/lib/familyAccountEngine';
import { copyFamilyInviteCode, copyFamilyInviteLink, formatInviteExpiry, shareFamilyInvite } from '@/lib/familyInviteShare';

interface FamilyInviteCardProps {
  invitation: FamilyInvitation;
  familyName: string;
  shareLabel: string;
  revokeLabel: string;
  onRevoke: () => void;
}

export default function FamilyInviteCard({
  invitation,
  familyName,
  shareLabel,
  revokeLabel,
  onRevoke,
}: FamilyInviteCardProps) {
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopyLink() {
    vibrate(8);
    setActionError(null);
    try {
      await copyFamilyInviteLink(invitation.invite_code);
      setCopied(true);
    } catch {
      setActionError('We could not copy the link. Copy the code instead.');
    }
  }

  async function handleCopyCode() {
    vibrate(8);
    setActionError(null);
    try {
      await copyFamilyInviteCode(invitation.invite_code);
      setCopiedCode(true);
    } catch {
      setActionError('We could not copy the code. Select it and copy it manually.');
    }
  }

  async function handleShare() {
    vibrate(8);
    setActionError(null);
    try {
      await shareFamilyInvite(familyName, invitation);
    } catch {
      setActionError('Sharing did not finish. You can copy the code instead.');
    }
  }

  return (
    <div className="premium-card p-5 flex flex-col gap-4">
      <div>
        <p className="text-ivory-500 text-xs uppercase tracking-[0.15em]">Invitation code</p>
        <p className="font-mono text-ivory-50 text-lg tracking-wider break-all select-all mt-2">
          {invitation.invite_code}
        </p>
        <p className="text-ivory-600 text-xs mt-2">
          {invitation.expires_at
            ? `Expires ${formatInviteExpiry(invitation.expires_at)}`
            : 'Does not expire'}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleCopyLink} className="btn-secondary w-full">
          {copied ? <Check size={16} /> : <Link size={16} />}
          {copied ? 'Link Copied' : 'Copy Invite Link'}
        </button>
        <button onClick={handleShare} className="btn-secondary w-full">
          <Share2 size={16} /> {shareLabel}
        </button>
      </div>
      <button onClick={handleCopyCode} className="text-ivory-400 text-xs font-medium min-h-[44px] flex items-center justify-center gap-2">
        {copiedCode ? <Check size={14} /> : <Copy size={14} />}
        {copiedCode ? 'Code copied' : 'Copy Code'}
      </button>
      <button
        onClick={() => {
          vibrate(8);
          onRevoke();
        }}
        className="text-error text-sm font-medium min-h-[44px] flex items-center justify-center gap-2"
      >
        <Trash2 size={14} /> {revokeLabel}
      </button>
      {actionError && (
        <p className="text-error text-xs" role="alert">{actionError}</p>
      )}
    </div>
  );
}
