import { useState } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate } from '@/lib/utils';
import type { PrayerCopy } from '@/lib/prayerCopy';

interface Props {
  prayerId: string;
  copy: PrayerCopy;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeletePrayerDialog({ prayerId, copy, onClose, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (deleting) return;
    onClose();
  };

  const handleConfirm = async () => {
    setDeleting(true);
    setError(null);
    vibrate(20);
    const { error: rpcError } = await supabase.rpc('delete_own_prayer', { p_prayer_id: prayerId });
    if (rpcError) {
      setDeleting(false);
      setError(copy.deletePrayerError);
      return;
    }
    setDeleting(false);
    onDeleted();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center px-4 animate-fade-in" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="absolute inset-0 bg-ink-950/60" onClick={close} />
      <div role="alertdialog" aria-labelledby="delete-prayer-title" className="relative w-full max-w-lg bg-ink-800/95 backdrop-blur-md border border-error/30 rounded-2xl p-5 shadow-xl shadow-ink-950/50 animate-fade-in-up mb-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle size={18} className="text-error" />
          <p id="delete-prayer-title" className="text-ivory-50 text-base font-medium font-serif">{copy.deletePrayerTitle}</p>
        </div>
        <p className="text-ivory-400 text-sm leading-relaxed mb-4">{copy.deletePrayerBody}</p>
        {error && <p className="text-error text-xs mb-3">{error}</p>}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="btn-secondary w-full text-error border-error/30 hover:bg-error/10 disabled:opacity-40"
          >
            <Trash2 size={16} /> {deleting ? copy.deletePrayerDeleting : copy.deletePrayer}
          </button>
          <button onClick={close} disabled={deleting} className="btn-secondary w-full">
            {copy.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
