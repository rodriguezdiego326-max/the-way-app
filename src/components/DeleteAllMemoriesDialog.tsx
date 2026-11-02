import { useState } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteAllMemoriesDialog({ open, onClose, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const close = () => {
    if (deleting) return;
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    setDeleting(true);
    setError(null);
    vibrate(20);
    const { error: deleteError } = await supabase
      .from('memories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    setDeleting(false);
    if (deleteError) {
      setError('We could not delete your memories. Please try again.');
      return;
    }
    setError(null);
    onDeleted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center px-4 animate-fade-in" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="absolute inset-0 bg-ink-950/60" onClick={close} />
      <div role="alertdialog" aria-labelledby="delete-all-memories-title" className="relative w-full max-w-lg bg-ink-800/95 backdrop-blur-md border border-error/30 rounded-2xl p-5 shadow-xl shadow-ink-950/50 animate-fade-in-up mb-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle size={18} className="text-error" />
          <p id="delete-all-memories-title" className="text-ivory-50 text-base font-medium font-serif">Delete All Memories?</p>
        </div>
        <p className="text-ivory-400 text-sm leading-relaxed mb-3">
          This permanently deletes all saved SOLAPATH memories. It cannot be undone.
        </p>
        <p className="text-ivory-500 text-xs leading-relaxed mb-4">
          Your account, prayers, Family data, Ask conversations, Bible notes, bookmarks, highlights, and other records are not affected.
        </p>
        {error && <p className="text-error text-xs mb-3">{error}</p>}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="btn-secondary w-full text-error border-error/30 hover:bg-error/10 disabled:opacity-40"
          >
            <Trash2 size={16} /> {deleting ? 'Deleting...' : 'Delete All Memories'}
          </button>
          <button onClick={close} disabled={deleting} className="btn-secondary w-full">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
