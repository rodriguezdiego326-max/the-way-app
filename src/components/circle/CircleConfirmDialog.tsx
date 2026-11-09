import { vibrate } from '@/lib/utils';

interface Props {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel?: () => void;
}

export default function CircleConfirmDialog({
  title, body, confirmLabel, cancelLabel, destructive, busy, error, onConfirm, onCancel,
}: Props) {
  function handleConfirm() {
    if (busy) return;
    vibrate(destructive ? 15 : 8);
    onConfirm();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6" onClick={onCancel}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="circle-confirm-title" className="w-full max-w-sm bg-ink-900 rounded-3xl p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <h3 id="circle-confirm-title" className="font-serif text-xl text-ivory-50 mb-2">{title}</h3>
        <p className="text-ivory-400 text-sm leading-relaxed mb-5">{body}</p>
        {error && <p className="text-error text-xs mb-4" role="alert">{error}</p>}
        <div className={`grid gap-2 ${onCancel ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {onCancel && (
            <button onClick={onCancel} disabled={busy} className="btn-secondary w-full disabled:opacity-40">
              {cancelLabel ?? 'Cancel'}
            </button>
          )}
          <button onClick={handleConfirm} disabled={busy} className={`${destructive ? 'btn-secondary text-error' : 'btn-primary'} w-full disabled:opacity-40`}>
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
