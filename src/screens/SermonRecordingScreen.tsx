import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Pause, Play, Square, X, AlertCircle, NotebookPen } from 'lucide-react';
import { vibrate, formatDuration } from '@/lib/utils';
import { useSermonRecording } from '@/hooks/sermonRecordingContext';
import type { FinishedSermonRecording } from '@/lib/sermonRecorderNative';
import { saveSermonRecording } from '@/lib/sermonRecordingStore';

interface Props {
  profileId: string;
  onExit: () => void;
  onTakeNotes: () => void;
  onCaptured: (recordingId: string, interrupted: boolean) => void;
}

const START_ERROR: Record<string, string> = {
  denied: 'Microphone access is needed to record a sermon. You can enable it in iPhone Settings.',
  failed: 'Recording could not start. Please try again.',
};

export default function SermonRecordingScreen({ profileId, onExit, onTakeNotes, onCaptured }: Props) {
  const { recorder, setRecorderScreenOpen } = useSermonRecording();
  const { snapshot, busy, error, start, pause, resume, finish, discard } = recorder;
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const pendingRef = useRef<FinishedSermonRecording | null>(null);

  useEffect(() => {
    setRecorderScreenOpen(true);
    return () => setRecorderScreenOpen(false);
  }, [setRecorderScreenOpen]);

  const persist = useCallback(async (pending: FinishedSermonRecording) => {
    setSaving(true);
    setSaveError(null);
    try {
      const meta = await saveSermonRecording({
        profileId,
        fileName: pending.fileName,
        durationMs: pending.durationMs,
        startedAt: pending.startedAt,
      });
      pendingRef.current = null;
      onCaptured(meta.id, pending.interrupted);
    } catch {
      setSaveError('The recording could not be saved on this device. Try saving again.');
    } finally {
      setSaving(false);
    }
  }, [profileId, onCaptured]);

  const isActive = snapshot.state !== 'idle';

  async function handleFinish() {
    vibrate(10);
    setSaving(true);
    const result = await finish();
    if (!result) {
      setSaving(false);
      return;
    }
    pendingRef.current = result;
    await persist(result);
  }

  async function handleDiscard() {
    vibrate(15);
    setDiscardOpen(false);
    setLeaveOpen(false);
    const ok = await discard();
    if (ok) onExit();
  }

  function handleClose() {
    if (isActive) {
      setLeaveOpen(true);
      return;
    }
    onExit();
  }

  const isPaused = snapshot.state === 'paused';
  const statusLabel = isPaused ? (snapshot.interrupted ? 'Interrupted' : 'Paused') : 'Recording';

  return (
    <div className="app-container bg-ink-950 min-h-screen flex flex-col text-ivory-100">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={handleClose} className="btn-ghost" aria-label="Close recording"><X size={20} /></button>
        <p className="ui-label">Sermon Assistant</p>
        <span className="w-8" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {!isActive && !saving && !pendingRef.current && (
          <div className="w-full max-w-sm animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-ivory-100/5 border border-ivory-100/10 flex items-center justify-center mx-auto mb-6">
              <Mic size={26} className="text-gold-300" />
            </div>
            <h2 className="font-serif text-3xl text-ivory-50 mb-3">Ready to record</h2>
            <p className="text-ivory-400 text-sm leading-relaxed mb-8">
              Your recording stays on this device. Nothing is uploaded or analyzed. It keeps recording while you take notes or use other apps.
            </p>

            {error && (
              <div className="flex items-start gap-2 text-left mb-6 px-1">
                <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
                <p className="text-ivory-300 text-xs leading-relaxed">{START_ERROR[error]}</p>
              </div>
            )}

            <button
              onClick={() => { vibrate(12); void start(); }}
              disabled={busy}
              className="btn-primary w-full h-14 disabled:opacity-40"
            >
              {busy ? 'Requesting Microphone...' : 'Start Recording'}
            </button>
          </div>
        )}

        {isActive && !saving && (
          <div className="w-full max-w-sm animate-fade-in-up">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-ivory-600' : 'bg-error animate-pulse'}`} />
              <p className="ui-label">{statusLabel}</p>
            </div>
            <p className="font-mono text-6xl text-ivory-50 tabular-nums tracking-tight mb-3">{formatDuration(snapshot.elapsedMs)}</p>
            <p className="text-ivory-500 text-xs mb-10">
              {isPaused && snapshot.interrupted
                ? 'iPhone interrupted this recording. Tap Resume to continue.'
                : isPaused
                  ? 'Paused. Tap Resume to continue.'
                  : 'Microphone on'}
            </p>

            <div className="flex items-center justify-center gap-8 mb-8">
              {isPaused ? (
                <button onClick={() => { vibrate(8); void resume(); }} disabled={busy} className="w-20 h-20 rounded-full bg-gold-500 flex items-center justify-center hover:bg-gold-400 transition-colors disabled:opacity-40" aria-label="Resume recording">
                  <Play size={28} className="text-ink-950 ml-1" />
                </button>
              ) : (
                <button onClick={() => { vibrate(8); void pause(); }} disabled={busy} className="w-20 h-20 rounded-full bg-ivory-100/10 border border-ivory-100/20 flex items-center justify-center hover:bg-ivory-100/15 transition-colors disabled:opacity-40" aria-label="Pause recording">
                  <Pause size={28} className="text-ivory-50" />
                </button>
              )}
              <button onClick={() => void handleFinish()} disabled={busy} className="w-20 h-20 rounded-full bg-ivory-100/10 border border-ivory-100/20 flex items-center justify-center hover:bg-ivory-100/15 transition-colors disabled:opacity-40" aria-label="Finish recording">
                <Square size={24} className="text-ivory-50" />
              </button>
            </div>

            <button onClick={() => { vibrate(8); onTakeNotes(); }} className="btn-secondary w-full mb-6">
              <NotebookPen size={16} /> Take Notes
            </button>

            <div className="flex justify-center text-sm">
              <button onClick={() => { vibrate(8); setDiscardOpen(true); }} className="text-ivory-400 hover:text-ivory-200 transition-colors">Cancel</button>
            </div>
            {error && <p className="text-ivory-300 text-xs leading-relaxed mt-4">The recording could not be updated. Please try again.</p>}
          </div>
        )}

        {saving && (
          <div className="animate-fade-in-up">
            <p className="ui-label mb-3">Saving</p>
            <p className="text-ivory-400 text-sm">Saving your recording on this device...</p>
          </div>
        )}

        {saveError && !saving && (
          <div className="w-full max-w-sm animate-fade-in-up">
            <p className="text-ivory-300 text-xs leading-relaxed mb-4">{saveError}</p>
            <button onClick={() => { vibrate(10); if (pendingRef.current) void persist(pendingRef.current); }} className="btn-secondary w-full">Try Saving Again</button>
          </div>
        )}
      </div>

      {discardOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDiscardOpen(false)}>
          <div className="w-full max-w-md bg-ink-900 rounded-t-3xl p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-xl text-ivory-50 mb-2">Discard this recording?</h3>
            <p className="text-ivory-400 text-sm leading-relaxed mb-6">The audio recorded so far will be permanently deleted.</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => setDiscardOpen(false)} className="btn-primary w-full">Keep Recording</button>
              <button onClick={() => void handleDiscard()} className="btn-secondary w-full text-clay-400">Discard</button>
            </div>
          </div>
        </div>
      )}

      {leaveOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setLeaveOpen(false)}>
          <div className="w-full max-w-md bg-ink-900 rounded-t-3xl p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-xl text-ivory-50 mb-2">A sermon recording is still in progress.</h3>
            <p className="text-ivory-400 text-sm leading-relaxed mb-6">Choose what to do with this recording before you leave.</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => setLeaveOpen(false)} className="btn-primary w-full">Continue Recording</button>
              <button onClick={() => { setLeaveOpen(false); void handleFinish(); }} className="btn-secondary w-full">Finish Recording</button>
              <button onClick={() => void handleDiscard()} className="btn-secondary w-full text-clay-400">Discard Recording</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
