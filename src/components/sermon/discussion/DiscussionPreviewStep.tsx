import { AlertCircle, Check, Lock } from 'lucide-react';
import type { Circle, CircleSermonDiscussion } from '@/lib/togetherTypes';

interface Props {
  circle: Circle;
  sermonTitle: string | null;
  body: string;
  scriptures: string[];
  sharing: boolean;
  shareError: string | null;
  created: CircleSermonDiscussion | null;
  onBack: () => void;
  onShare: () => void;
  onDone: () => void;
  onView: () => void;
}

const CONSENT_TEXT = 'This will be visible to members of this Circle. Your recording, audio, transcript, and full Sermon Insights stay private on your device.';
const CONSENT_DETAIL = 'Only what you see on this page is shared. Only you can delete it from the Circle.';

export default function DiscussionPreviewStep({
  circle, sermonTitle, body, scriptures, sharing, shareError, created, onBack, onShare, onDone, onView,
}: Props) {
  if (created) {
    return (
      <div className="premium-card p-6 animate-fade-in-up text-center">
        <div className="w-12 h-12 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-4">
          <Check size={20} className="text-gold-300" />
        </div>
        <p className="font-serif text-xl text-ivory-50 mb-2">Shared with {circle.name}</p>
        <p className="text-ivory-400 text-sm leading-relaxed mb-6">Your Circle can now read this discussion.</p>
        <div className="flex flex-col gap-2">
          <button onClick={onView} className="btn-primary w-full">View in Together</button>
          <button onClick={onDone} className="btn-secondary w-full">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <p className="text-ivory-400 text-sm leading-relaxed mb-5">This is exactly what {circle.name} will see.</p>

      <article className="premium-card p-5 mb-4">
        <div className="mb-4">
          <p className="ui-label mb-1.5">From a sermon</p>
          {sermonTitle && <p className="font-serif text-lg text-ivory-50 leading-snug">{sermonTitle}</p>}
        </div>
        <p className="ui-label mb-1.5">Discussion</p>
        <p className="text-ivory-200 text-sm leading-[1.5] whitespace-pre-line">{body}</p>
        {scriptures.length > 0 && (
          <div className="mt-4 pt-4 border-t border-ink-700/60">
            <p className="ui-label mb-2">Scripture to read</p>
            <div className="flex flex-wrap gap-2">
              {scriptures.map((reference) => (
                <span key={reference} className="text-gold-200 text-xs px-2.5 py-1 rounded-full border border-gold-500/20 bg-gold-500/5">{reference}</span>
              ))}
            </div>
          </div>
        )}
      </article>

      <div className="premium-card p-4 mb-6 flex items-start gap-3">
        <Lock size={14} className="text-gold-400/70 shrink-0 mt-0.5" />
        <div>
          <p className="text-ivory-100 text-sm leading-relaxed mb-1">{CONSENT_TEXT}</p>
          <p className="text-ivory-400 text-xs leading-relaxed">{CONSENT_DETAIL}</p>
        </div>
      </div>

      {shareError && (
        <div className="flex items-start gap-2 mb-4 px-1" role="alert">
          <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
          <p className="text-ivory-300 text-xs leading-relaxed">{shareError}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button onClick={onShare} disabled={sharing} className="btn-primary w-full disabled:opacity-40">
          {sharing ? 'Sharing...' : shareError ? 'Try Again' : `Share to ${circle.name}`}
        </button>
        <button onClick={onBack} disabled={sharing} className="btn-secondary w-full disabled:opacity-40">Edit</button>
      </div>
    </div>
  );
}
