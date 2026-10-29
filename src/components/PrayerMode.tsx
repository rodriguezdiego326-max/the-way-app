import { useState } from 'react';
import { X, Check, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate } from '@/lib/utils';
import type { PrayerCopy } from '@/lib/prayerCopy';
import type { Prayer, PrayerSession } from '@/lib/types';

interface Props {
  prayer: Prayer;
  copy: PrayerCopy;
  viewportHeight: number;
  onClose: () => void;
  onRecorded: (session: PrayerSession) => void;
}

export default function PrayerMode({ prayer, copy, viewportHeight, onClose, onRecorded }: Props) {
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState<PrayerSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const guidance = [
    { title: copy.modeBeStillTitle, body: copy.modeBeStillBody },
    { title: copy.modeBringTitle, body: copy.modeBringBody },
    { title: copy.modeEntrustTitle, body: copy.modeEntrustBody },
  ];

  async function recordPrayer() {
    if (recording || recorded) return;
    setRecording(true);
    setError(null);
    vibrate(10);

    const { data, error: insertError } = await supabase
      .from('prayer_sessions')
      .insert({ prayer_id: prayer.id })
      .select('*')
      .single();

    setRecording(false);

    if (insertError || !data || data.prayer_id !== prayer.id) {
      setError(copy.modeSaveError);
      return;
    }

    const session = data as PrayerSession;
    setRecorded(session);
    window.setTimeout(() => onRecorded(session), 900);
  }

  return (
    <div
      className="fixed inset-0 z-[90] bg-ink-950 bg-parchment flex flex-col"
      style={{ height: `${viewportHeight}px` }}
    >
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onClose} className="btn-ghost" aria-label={copy.modeClose}>
          <X size={20} />
        </button>
        <p className="ui-label">{copy.pray}</p>
        <span className="w-10" />
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 animate-fade-in-up">
        <h2 className="font-serif text-3xl text-ivory-50 leading-tight mb-4">{prayer.title}</h2>

        {prayer.description && (
          <div className="mb-5">
            <p className="ui-label mb-2">{copy.modeRequestLabel}</p>
            <p className="text-ivory-300 leading-relaxed">{prayer.description}</p>
          </div>
        )}

        {prayer.related_scripture && (
          <div className="flex items-center gap-2 text-gold-300 text-sm mb-6">
            <BookOpen size={14} />
            <span className="font-serif italic">{prayer.related_scripture}</span>
          </div>
        )}

        <div className="gold-divider mb-6" />

        <div className="flex flex-col gap-5">
          {guidance.map((item) => (
            <div key={item.title}>
              <p className="font-serif text-lg text-gold-300 mb-1">{item.title}</p>
              <p className="text-ivory-400 text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pt-3 pb-8 safe-bottom shrink-0 flex flex-col items-center gap-3">
        {error && <p className="text-error text-sm text-center">{error}</p>}
        {recorded ? (
          <p className="flex items-center gap-2 text-sage-400 text-sm font-medium animate-fade-in">
            <Check size={16} /> {copy.modeRecorded}
          </p>
        ) : (
          <button onClick={recordPrayer} disabled={recording} className="btn-primary w-full disabled:opacity-40">
            {recording ? copy.modeRecording : copy.modeComplete}
          </button>
        )}
      </div>
    </div>
  );
}
