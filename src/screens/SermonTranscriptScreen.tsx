import { useState } from 'react';
import { X, Copy, Check, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import { vibrate, formatDate } from '@/lib/utils';
import type { SermonRecordingMeta } from '@/lib/sermonRecordingStore';
import type { SermonTranscriptionState } from '@/hooks/useSermonTranscription';
import SermonConfirmSheet from '@/components/sermon/SermonConfirmSheet';
import TranscriptionProgressCard from '@/components/sermon/TranscriptionProgressCard';

interface Props {
  meta: SermonRecordingMeta;
  transcription: SermonTranscriptionState;
  onBack: () => void;
}

type ConfirmAction = 'retranscribe' | 'delete' | null;

export default function SermonTranscriptScreen({ meta, transcription, onBack }: Props) {
  const { transcript, status, progress, error, canRetry, start, retry, cancel, removeTranscript } = transcription;
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleCopy() {
    if (!transcript) return;
    vibrate(8);
    try {
      await navigator.clipboard.writeText(transcript.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setActionError('The transcript could not be copied. Please select the text and copy it instead.');
    }
  }

  async function handleConfirm() {
    if (!confirm) return;
    setBusy(true);
    setActionError(null);
    try {
      if (confirm === 'retranscribe') {
        setConfirm(null);
        void start();
      } else {
        await removeTranscript();
        setConfirm(null);
        onBack();
      }
    } catch {
      setActionError('This transcript could not be deleted. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost" aria-label="Back"><X size={20} /></button>
        <p className="ui-label">Transcript</p>
        <span className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="mb-5">
            <p className="font-serif text-2xl text-ivory-50 leading-tight">{meta.title || 'Untitled Sermon'}</p>
            <p className="text-ivory-500 text-xs mt-2">
              {[meta.preacher, formatDate(meta.startedAt)].filter(Boolean).join(' · ')}
            </p>
          </div>

          {status !== 'idle' && (
            <TranscriptionProgressCard
              status={status}
              progress={progress}
              error={error}
              canRetry={canRetry}
              onRetry={retry}
              onCancel={() => void cancel()}
            />
          )}

          {transcript ? (
            <div className="premium-card p-5 mb-4">
              <p className="text-ivory-200 text-sm leading-[1.5] whitespace-pre-wrap select-text">{transcript.text}</p>
            </div>
          ) : (
            status === 'idle' && (
              <div className="premium-card p-5 mb-4">
                <p className="text-ivory-400 text-sm leading-relaxed">This transcript is no longer available on this device.</p>
              </div>
            )
          )}

          {actionError && (
            <div className="flex items-start gap-2 mb-3 px-1">
              <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
              <p className="text-ivory-300 text-xs leading-relaxed">{actionError}</p>
            </div>
          )}

          {transcript && status === 'idle' && (
            <div className="flex flex-col gap-2 mb-8">
              <button onClick={handleCopy} className="btn-primary w-full">
                {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy Transcript</>}
              </button>
              <button onClick={() => { vibrate(8); setConfirm('retranscribe'); }} className="btn-secondary w-full">
                <RefreshCw size={16} /> Retranscribe
              </button>
              <button onClick={() => { vibrate(8); setConfirm('delete'); }} className="btn-secondary w-full text-clay-400">
                <Trash2 size={16} /> Delete Transcript
              </button>
            </div>
          )}
        </div>
      </div>

      <SermonConfirmSheet
        open={confirm === 'retranscribe'}
        title="Retranscribe this sermon?"
        body="Replace the current transcript with a new transcription?"
        confirmLabel="Retranscribe"
        busy={busy}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
      <SermonConfirmSheet
        open={confirm === 'delete'}
        title="Delete this transcript?"
        body="The sermon recording will remain on this device."
        confirmLabel="Delete Transcript"
        busy={busy}
        destructive
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
