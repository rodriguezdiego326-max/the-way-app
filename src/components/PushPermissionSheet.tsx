import { Bell } from 'lucide-react';

interface Props {
  busy: boolean;
  onNotNow: () => void;
  onAllow: () => void;
}

export default function PushPermissionSheet({ busy, onNotNow, onAllow }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="push-permission-title"
        className="w-full max-w-md bg-ink-900 border border-ink-700 rounded-t-3xl sm:rounded-3xl p-6 pb-10 animate-fade-in-up"
      >
        <div className="w-11 h-11 rounded-full bg-gold-500/15 flex items-center justify-center mb-4">
          <Bell size={20} className="text-gold-400" />
        </div>
        <h3 id="push-permission-title" className="font-serif text-xl text-ivory-50 mb-3">
          Stay connected without exposing private details
        </h3>
        <p className="text-ivory-300 text-sm leading-relaxed mb-3">
          SOLAPATH can notify you when new Family or Circle activity is available.
        </p>
        <p className="text-ivory-500 text-sm leading-relaxed mb-6">
          Notifications never include prayer text, Check-In details, sermon content, private notes, or child information.
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            onClick={onNotNow}
            disabled={busy}
            className="flex-1 h-12 rounded-full border border-ink-700 text-ivory-200 text-sm font-medium transition-colors hover:bg-ink-800 disabled:opacity-50"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onAllow}
            disabled={busy}
            className="flex-1 h-12 rounded-full bg-gold-500 text-ink-950 text-sm font-semibold transition-colors hover:bg-gold-400 disabled:opacity-50"
          >
            {busy ? 'Working...' : 'Allow notifications'}
          </button>
        </div>
      </div>
    </div>
  );
}
