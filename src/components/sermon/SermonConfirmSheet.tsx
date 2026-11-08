import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  busy?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SermonConfirmSheet({ open, title, body, confirmLabel, busy = false, destructive = false, onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => !busy && onCancel()}>
      <div role="dialog" aria-modal="true" aria-labelledby="sermon-confirm-title" className="w-full max-w-md bg-ink-900 rounded-t-3xl p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <h3 id="sermon-confirm-title" className="font-serif text-xl text-ivory-50 mb-2">{title}</h3>
        <div className="text-ivory-400 text-sm leading-relaxed mb-6 space-y-3">{body}</div>
        <div className="flex flex-col gap-2">
          <button onClick={onConfirm} disabled={busy} className={`${destructive ? 'btn-secondary text-error border-error/30' : 'btn-primary'} w-full disabled:opacity-40`}>
            {busy ? 'Working...' : confirmLabel}
          </button>
          <button onClick={onCancel} disabled={busy} className="btn-secondary w-full disabled:opacity-40">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
