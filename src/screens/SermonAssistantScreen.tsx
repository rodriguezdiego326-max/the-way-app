import { useEffect, useState } from 'react';
import { X, Mic, ChevronRight, AudioLines } from 'lucide-react';
import { vibrate, formatDate, formatDuration } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import { listSermonRecordings, type SermonRecordingMeta } from '@/lib/sermonRecordingStore';
import type { Profile } from '@/lib/types';

interface Props {
  profile: Profile;
  onBack: () => void;
  onRecord: () => void;
  onOpenRecording: (recordingId: string) => void;
}

export default function SermonAssistantScreen({ profile, onBack, onRecord, onOpenRecording }: Props) {
  const [recordings, setRecordings] = useState<SermonRecordingMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listSermonRecordings(profile.id)
      .then((rows) => { if (!cancelled) setRecordings(rows); })
      .catch(() => { if (!cancelled) setError('Could not load your saved recordings on this device.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [profile.id]);

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Sermon Assistant</p>
        <span className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="premium-card p-6 mb-6">
            <div className="w-12 h-12 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-4">
              <AudioLines size={20} className="text-gold-300" />
            </div>
            <h2 className="font-serif text-2xl text-ivory-50 leading-tight mb-2">Sermon Assistant</h2>
            <p className="text-ivory-400 text-sm leading-relaxed mb-5">
              Record a sermon while you listen. Your recording stays under your control.
            </p>
            <button onClick={() => { vibrate(10); onRecord(); }} className="btn-primary w-full">
              <Mic size={16} /> Record Sermon
            </button>
            <p className="text-ivory-600 text-xs leading-relaxed mt-4">
              Transcription and sermon insights will be added after recording is complete.
            </p>
          </div>

          <p className="ui-label mb-3">Saved Recordings</p>

          {loading && <LoadingState message="Loading recordings..." />}
          {!loading && error && <ErrorState message={error} />}
          {!loading && !error && recordings.length === 0 && (
            <div className="premium-card p-5 mb-6">
              <p className="text-ivory-400 text-sm leading-relaxed">
                No recordings yet. Sermons you record stay on this device until you choose to delete them.
              </p>
            </div>
          )}
          {!loading && !error && recordings.length > 0 && (
            <div className="flex flex-col gap-2 mb-8">
              {recordings.map((rec) => (
                <button
                  key={rec.id}
                  onClick={() => { vibrate(8); onOpenRecording(rec.id); }}
                  className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-ivory-100 text-sm font-medium truncate">{rec.title || 'Untitled Sermon'}</p>
                    <p className="text-ivory-600 text-xs mt-1 truncate">
                      {formatDate(rec.startedAt)} · {formatDuration(rec.durationMs)}
                      {rec.preacher ? ` · ${rec.preacher}` : ''}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-ivory-600 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
