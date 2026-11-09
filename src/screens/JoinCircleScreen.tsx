import { useState } from 'react';
import { X, KeyRound, Users, Check, AlertCircle } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { previewCircleInvitation, acceptCircleInvitation } from '@/lib/togetherEngine';
import type { CircleInvitePreview } from '@/lib/togetherTypes';

interface Props {
  onBack: () => void;
  onJoined: () => void;
}

type Step =
  | { kind: 'enter' }
  | { kind: 'checking' }
  | { kind: 'preview'; code: string; preview: CircleInvitePreview }
  | { kind: 'joining' }
  | { kind: 'joined'; circleName: string }
  | { kind: 'failed'; message: string };

const FAILURE_MESSAGES: Record<string, string> = {
  invalid: 'That code does not match an invitation. Check it and try again.',
  revoked: 'This invitation was cancelled by the Circle leader. Ask for a new one.',
  expired: 'This invitation has expired. Ask for a new one.',
  used: 'This invitation has already been used. Ask for a new one.',
  full: 'This Circle is full. It can hold up to 12 members.',
  already_member: 'You are already a member of this Circle.',
};

function failureMessage(status: string): string {
  return FAILURE_MESSAGES[status] ?? 'This invitation cannot be used right now.';
}

export default function JoinCircleScreen({ onBack, onJoined }: Props) {
  const [step, setStep] = useState<Step>({ kind: 'enter' });
  const [code, setCode] = useState('');

  async function handleCheck() {
    const trimmed = code.trim();
    if (!trimmed) return;
    vibrate(8);
    setStep({ kind: 'checking' });
    try {
      const preview = await previewCircleInvitation(trimmed);
      if (preview.status === 'valid') {
        setStep({ kind: 'preview', code: trimmed, preview });
      } else {
        setStep({ kind: 'failed', message: failureMessage(preview.status) });
      }
    } catch {
      setStep({ kind: 'failed', message: 'Could not check this code. Please try again.' });
    }
  }

  async function handleJoin(joinCode: string) {
    vibrate(10);
    setStep({ kind: 'joining' });
    try {
      const result = await acceptCircleInvitation(joinCode);
      if (result.status === 'joined') {
        setStep({ kind: 'joined', circleName: result.circle_name ?? 'your Circle' });
      } else {
        setStep({ kind: 'failed', message: failureMessage(result.status) });
      }
    } catch {
      setStep({ kind: 'failed', message: 'Could not join this Circle. Please try again.' });
    }
  }

  function resetToEntry() {
    setCode('');
    setStep({ kind: 'enter' });
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost" aria-label="Close"><X size={20} /></button>
        <p className="ui-label">Join a Circle</p>
        <span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        {(step.kind === 'enter' || step.kind === 'checking') && (
          <div className="premium-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound size={18} className="text-gold-300" />
              <p className="text-ivory-100 font-medium text-sm">Enter your invitation code</p>
            </div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste or type the code"
              className="input-field mb-3"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              onClick={handleCheck}
              disabled={!code.trim() || step.kind === 'checking'}
              className="btn-primary w-full disabled:opacity-40"
            >
              {step.kind === 'checking' ? 'Checking...' : 'Check Code'}
            </button>
          </div>
        )}

        {step.kind === 'preview' && (
          <div className="premium-card p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users size={18} className="text-gold-300" />
              <p className="text-ivory-100 font-medium">{step.preview.circle_name}</p>
            </div>
            <p className="text-ivory-600 text-xs mb-3">
              {step.preview.circle_type} · {step.preview.member_count} of {step.preview.max_members} members
            </p>
            {step.preview.description && (
              <p className="text-ivory-400 text-sm leading-relaxed mb-4">{step.preview.description}</p>
            )}
            <p className="text-ivory-600 text-xs mb-4">
              Joining makes you a member. Members can see the Circle's shared prayers and discussions.
            </p>
            <button onClick={() => handleJoin(step.code)} className="btn-primary w-full">
              Join Circle
            </button>
            <button onClick={resetToEntry} className="btn-secondary w-full mt-2">
              Use a different code
            </button>
          </div>
        )}

        {step.kind === 'joining' && (
          <div className="premium-card p-6 text-center">
            <p className="text-ivory-400 text-sm">Joining Circle...</p>
          </div>
        )}

        {step.kind === 'joined' && (
          <div className="premium-card p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-success/10 border border-success/30 flex items-center justify-center mx-auto mb-4">
              <Check size={22} className="text-success" />
            </div>
            <p className="text-ivory-100 font-medium">You joined {step.circleName}.</p>
            <button onClick={onJoined} className="btn-primary w-full mt-5">Done</button>
          </div>
        )}

        {step.kind === 'failed' && (
          <div className="premium-card p-6 text-center">
            <AlertCircle size={24} className="text-error mx-auto mb-3" />
            <p className="text-ivory-300 text-sm leading-relaxed">{step.message}</p>
            <button onClick={resetToEntry} className="btn-secondary w-full mt-5">Try another code</button>
          </div>
        )}
      </div>
    </div>
  );
}
