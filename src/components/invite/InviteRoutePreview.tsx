import { useEffect, useRef, useState } from 'react';
import { Users, X } from 'lucide-react';
import { ErrorState, LoadingState } from '@/components/States';
import {
  acceptFamilyInvitation,
  familyErrorMessage,
  FAMILY_ERROR_COPY,
  previewFamilyInvitation,
  type InvitationPreview,
  type InvitationPreviewStatus,
} from '@/lib/familyAccountEngine';
import { formatInviteExpiry } from '@/lib/familyInviteShare';
import { acceptCircleInvitation, getCircle, previewCircleInvitation } from '@/lib/togetherEngine';
import type { Circle, CircleInvitePreview, CircleInviteStatus } from '@/lib/togetherTypes';
import type { InviteRoute } from '@/lib/inviteRouter';
import { vibrate } from '@/lib/utils';

interface Props {
  route: InviteRoute;
  onTerminal: () => void;
  onClose: () => void;
  onOpenFamily: () => void;
  onOpenCircle: (circle: Circle) => void;
  onOpenTogether: () => void;
}

type Loaded =
  | { kind: 'family'; preview: InvitationPreview }
  | { kind: 'circle'; preview: CircleInvitePreview }
  | { kind: 'message'; message: string }
  | { kind: 'error' };

const FAMILY_STATUS_COPY: Partial<Record<InvitationPreviewStatus, string>> = {
  invalid: 'We could not find that invitation. Ask for a new one.',
  expired: 'This invitation has expired. Ask for a new invitation.',
  revoked: 'This invitation was revoked.',
  used: 'This invitation has already been used.',
  already_in_family: FAMILY_ERROR_COPY.already_in_family,
  family_full: FAMILY_ERROR_COPY.family_full,
  already_member: "You're already part of this Family.",
};

const CIRCLE_STATUS_COPY: Partial<Record<CircleInviteStatus, string>> = {
  invalid: 'We could not find that invitation. Ask for a new one.',
  expired: 'This invitation has expired. Ask for a new invitation.',
  revoked: 'This invitation was revoked.',
  used: 'This invitation has already been used.',
  full: 'This Circle is full right now.',
  already_member: "You're already part of this Circle.",
};

const UNSUPPORTED_COPY = "This type of SOLAPATH invitation isn't available yet.";
const INVALID_COPY = "This SOLAPATH invitation link isn't valid.";
const FAMILY_JOIN_COPY = 'Joining adds you as an adult in this Family.';

export default function InviteRoutePreview({ route, onTerminal, onClose, onOpenFamily, onOpenCircle, onOpenTogether }: Props) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const terminalRef = useRef(onTerminal);
  useEffect(() => { terminalRef.current = onTerminal; });

  const invite = route.kind === 'valid' ? route.invite : null;

  useEffect(() => {
    let cancelled = false;
    if (!invite) {
      setLoaded({ kind: 'message', message: INVALID_COPY });
      terminalRef.current();
      return;
    }
    if (invite.type !== 'family' && invite.type !== 'circle') {
      setLoaded({ kind: 'message', message: UNSUPPORTED_COPY });
      terminalRef.current();
      return;
    }
    setLoaded(null);
    setActionError(null);

    (async () => {
      try {
        if (invite.type === 'family') {
          const preview = await previewFamilyInvitation(invite.code);
          if (cancelled) return;
          setLoaded({ kind: 'family', preview });
          if (preview.status !== 'valid') terminalRef.current();
        } else {
          const preview = await previewCircleInvitation(invite.code);
          if (cancelled) return;
          setLoaded({ kind: 'circle', preview });
          if (preview.status !== 'valid') terminalRef.current();
        }
      } catch {
        if (!cancelled) setLoaded({ kind: 'error' });
      }
    })();

    return () => { cancelled = true; };
  }, [invite, reloadKey]);

  async function openExistingCircle(circleId: string) {
    const circle = await getCircle(circleId);
    terminalRef.current();
    if (circle) onOpenCircle(circle);
    else onOpenTogether();
  }

  async function handleJoin() {
    if (!invite || busy) return;
    vibrate(10);
    setBusy(true);
    setActionError(null);
    try {
      if (invite.type === 'family') {
        const result = await acceptFamilyInvitation(invite.code);
        if (result.status !== 'joined') throw new Error('invalid_code');
        terminalRef.current();
        onOpenFamily();
      } else {
        const result = await acceptCircleInvitation(invite.code);
        if (result.status === 'joined' && result.circle_id) {
          await openExistingCircle(result.circle_id);
        } else {
          setLoaded({ kind: 'circle', preview: { status: result.status } });
          terminalRef.current();
        }
      }
    } catch (error) {
      setActionError(invite.type === 'family'
        ? familyErrorMessage(error)
        : 'This invitation could not be accepted. Check the Circle and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleOpenExisting() {
    if (loaded?.kind !== 'circle' || !loaded.preview.circle_id) {
      onOpenFamily();
      return;
    }
    await openExistingCircle(loaded.preview.circle_id);
  }

  function handleClose() {
    terminalRef.current();
    onClose();
  }

  return (
    <div className="app-container bg-ink-950 min-h-screen flex flex-col px-6 py-10">
      <div className="flex justify-end">
        <button onClick={handleClose} className="btn-ghost min-h-[44px] min-w-[44px] text-ivory-400" aria-label="Close invitation">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">
        {!loaded && <LoadingState message="Checking your invitation..." />}

        {loaded?.kind === 'error' && (
          <ErrorState message="We couldn't check this invitation. Check your connection and try again." onRetry={() => setReloadKey((k) => k + 1)} />
        )}

        {loaded?.kind === 'message' && (
          <div className="text-center flex flex-col gap-6">
            <p className="font-serif text-2xl text-ivory-50">{loaded.message}</p>
            <button onClick={handleClose} className="btn-secondary w-full">Close</button>
          </div>
        )}

        {loaded?.kind === 'family' && (
          <FamilyPreviewCard
            preview={loaded.preview}
            busy={busy}
            actionError={actionError}
            onJoin={handleJoin}
            onOpenExisting={onOpenFamily}
            onClose={handleClose}
          />
        )}

        {loaded?.kind === 'circle' && (
          <CirclePreviewCard
            preview={loaded.preview}
            busy={busy}
            actionError={actionError}
            onJoin={handleJoin}
            onOpenExisting={handleOpenExisting}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
}

function FamilyPreviewCard({
  preview, busy, actionError, onJoin, onOpenExisting, onClose,
}: {
  preview: InvitationPreview;
  busy: boolean;
  actionError: string | null;
  onJoin: () => void;
  onOpenExisting: () => void;
  onClose: () => void;
}) {
  if (preview.status !== 'valid') {
    const message = FAMILY_STATUS_COPY[preview.status] ?? INVALID_COPY;
    return (
      <StatusMessage message={message} actionLabel={preview.status === 'already_member' ? 'Open Family' : undefined} onAction={onOpenExisting} onClose={onClose} />
    );
  }
  return (
    <div className="premium-card p-6 flex flex-col gap-5">
      <Users size={28} className="text-gold-300" aria-hidden="true" />
      <div>
        <p className="text-ivory-500 text-xs uppercase tracking-[0.15em]">You're invited to join</p>
        <h1 className="font-serif text-3xl text-ivory-50 mt-2">{preview.family_name || 'this Family'}</h1>
        {typeof preview.adult_count === 'number' && (
          <p className="text-ivory-400 text-sm mt-2">{preview.adult_count} {preview.adult_count === 1 ? 'adult' : 'adults'} in this Family</p>
        )}
        <p className="text-ivory-500 text-xs mt-2">
          {preview.expires_at ? `Expires ${formatInviteExpiry(preview.expires_at)}` : 'Does not expire'}
        </p>
      </div>
      <p className="text-ivory-400 text-sm leading-relaxed">{FAMILY_JOIN_COPY}</p>
      <JoinActions busy={busy} joinLabel="Join Family" actionError={actionError} onJoin={onJoin} onClose={onClose} />
    </div>
  );
}

function CirclePreviewCard({
  preview, busy, actionError, onJoin, onOpenExisting, onClose,
}: {
  preview: CircleInvitePreview;
  busy: boolean;
  actionError: string | null;
  onJoin: () => void;
  onOpenExisting: () => void;
  onClose: () => void;
}) {
  if (preview.status !== 'valid') {
    const message = CIRCLE_STATUS_COPY[preview.status] ?? INVALID_COPY;
    return (
      <StatusMessage message={message} actionLabel={preview.status === 'already_member' ? 'Open Circle' : undefined} onAction={onOpenExisting} onClose={onClose} />
    );
  }
  return (
    <div className="premium-card p-6 flex flex-col gap-5">
      <Users size={28} className="text-gold-300" aria-hidden="true" />
      <div>
        <p className="text-ivory-500 text-xs uppercase tracking-[0.15em]">You're invited to join</p>
        <h1 className="font-serif text-3xl text-ivory-50 mt-2">{preview.circle_name || 'this Circle'}</h1>
        {preview.circle_type && <p className="text-ivory-400 text-sm mt-2">{preview.circle_type}</p>}
        {typeof preview.member_count === 'number' && typeof preview.max_members === 'number' && (
          <p className="text-ivory-400 text-sm mt-1">{preview.member_count} of {preview.max_members} members</p>
        )}
        <p className="text-ivory-500 text-xs mt-2">
          {preview.expires_at ? `Expires ${formatInviteExpiry(preview.expires_at)}` : 'Does not expire'}
        </p>
      </div>
      <JoinActions busy={busy} joinLabel="Join Circle" actionError={actionError} onJoin={onJoin} onClose={onClose} />
    </div>
  );
}

function JoinActions({
  busy, joinLabel, actionError, onJoin, onClose,
}: {
  busy: boolean;
  joinLabel: string;
  actionError: string | null;
  onJoin: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {actionError && <p className="text-error text-sm" role="alert">{actionError}</p>}
      <button onClick={onJoin} disabled={busy} className="btn-primary w-full">
        {busy ? 'Joining...' : joinLabel}
      </button>
      <button onClick={onClose} disabled={busy} className="btn-ghost w-full min-h-[44px] text-ivory-400">Not now</button>
    </div>
  );
}

function StatusMessage({
  message, actionLabel, onAction, onClose,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
}) {
  return (
    <div className="text-center flex flex-col gap-6">
      <p className="font-serif text-2xl text-ivory-50">{message}</p>
      {actionLabel && onAction && <button onClick={onAction} className="btn-primary w-full">{actionLabel}</button>}
      <button onClick={onClose} className="btn-secondary w-full">Close</button>
    </div>
  );
}
