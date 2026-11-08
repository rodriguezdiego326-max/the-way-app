import { useCallback, useRef, useState } from 'react';
import { Mic, Pause, Play, Square, X, AlertCircle } from 'lucide-react';
import { vibrate, formatDuration } from '@/lib/utils';
import { useSermonRecorder, type CapturedSermonAudio, type CaptureEndReason } from '@/hooks/useSermonRecorder';
import { saveSermonRecording } from '@/lib/sermonRecordingStore';

interface Props {
  profileId: string;
  onExit: () => void;
  onCaptured: (recordingId: string, interrupted: boolean) => void;
}

const MIC_LABEL: Record<string, string> = {
  idle: 'Microphone off',
  requesting: 'Requesting microphone access',
  recording: 'Microphone on',
  paused: 'Microphone paused',
  finalizing: 'Microphone off',
  denied: 'Microphone off',
  unavailable: 'Microphone unavailable',
  error: 'Microphone off',
};

export default function SermonRecordingScreen({ profileId, onExit, onCaptured }: Props) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const pendingRef = useRef<{ capture: CapturedSermonAudio; interrupted: boolean } | null>(null);

  const persist = useCallback(async (capture: CapturedSermonAudio, interrupted: boolean) => {
    setSaving(true);
    setSaveError(null);
    try {
      const meta = await saveSermonRecording({ profileId, ...capture });
      pendingRef.current = null;
      onCaptured(meta.id, interrupted);
    } catch {
      setSaveError('The recording could not be saved on this device. Try saving again.');
    } finally {
      setSaving(false);
    }
  }, [profileId, onCaptured]);

  const handleCapture = useCallback((capture: CapturedSermonAudio, reason: CaptureEndReason) => {
    const interrupted = reason === 'interrupted';
    pendingRef.current = { capture, interrupted };
    void persist(capture, interrupted);
  }, [persist]);

  const recorder = useSermonRecorder(handleCapture);
  const { status, elapsedMs } = recorder;
  const isActive = status === 'recording' || status === 'paused' || status === 'finalizing';

  function handleClose() {
    if (isActive) {
      setLeaveOpen(true);
      return;
    }
    onExit();
  }

  function handleCancelTap() {
    vibrate(8);
    if (isActive) {
      setDiscardOpen(true);
      return;
    }
    onExit();
  }

  function handleDiscard() {
    vibrate(15);
    setDiscardOpen(false);
    setLeaveOpen(false);
    recorder.discard();
    onExit();
  }

  function handleRetrySave() {
    const pending = pendingRef.current;
    if (pending) void persist(pending.capture, pending.interrupted);
  }

  const showingPreStart = status === 'idle' || status === 'requesting' || status === 'denied' || status === 'unavailable' || status === 'error';

  return (
    <div className="app-container bg-ink-950 min-h-screen flex flex-col text-ivory-100">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={handleClose} className="btn-ghost" aria-label="Close recording"><X size={20} /></button>
        <p className="ui-label">Sermon Assistant</p>
        <span className="w-8" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {showingPreStart && !saving && (
          <div className="w-full max-w-sm animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-ivory-100/5 border border-ivory-100/10 flex items-center justify-center mx-auto mb-6">
              <Mic size={26} className="text-gold-300" />
            </div>
            <h2 className="font-serif text-3xl text-ivory-50 mb-3">Ready to record</h2>
            <p className="text-ivory-400 text-sm leading-relaxed mb-8">
              Your recording stays on this device. Nothing is uploaded or analyzed.
            </p>

            {status === 'denied' && (
              <div className="flex items-start gap-2 text-left mb-6 px-1">
                <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
                <p className="text-ivory-300 text-xs leading-relaxed">
                  Microphone access is needed to record a sermon. You can enable it in iPhone Settings.
                </p>
              </div>
            )}
            {status === 'unavailable' && (
              <p className="text-ivory-300 text-xs leading-relaxed mb-6">Recording is not available on this device.</p>
            )}
            {status === 'error' && (
              <p className="text-ivory-300 text-xs leading-relaxed mb-6">Recording could not start. Please try again.</p>
            )}

            <button
              onClick={() => { vibrate(12); void recorder.start(); }}
              disabled={status === 'requesting' || status === 'unavailable'}
              className="btn-primary w-full h-14 disabled:opacity-40"
            >
              {status === 'requesting' ? 'Requesting Microphone...' : 'Start Recording'}
            </button>
            <p className="text-ivory-600 text-xs mt-4">{MIC_LABEL[status]}</p>
          </div>
        )}

        {!showingPreStart && !saving && (
          <div className="w-full max-w-sm animate-fade-in-up">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span
                className={`w-2.5 h-2.5 rounded-full ${status === 'recording' ? 'bg-error animate-pulse' : 'bg-ivory-600'}`}
              />
              <p className="ui-label">{status === 'paused' ? 'Paused' : status === 'finalizing' ? 'Finishing' : 'Recording'}</p>
            </div>
            <p className="font-mono text-6xl text-ivory-50 tabular-nums tracking-tight mb-3">{formatDuration(elapsedMs)}</p>
            <p className="text-ivory-500 text-xs mb-12">{MIC_LABEL[status]}</p>

            {status !== 'finalizing' && (
              <div className="flex items-center justify-center gap-8 mb-10">
                {status === 'recording' ? (
                  <button onClick={() => { vibrate(8); recorder.pause(); }} className="w-20 h-20 rounded-full bg-ivory-100/10 border border-ivory-100/20 flex items-center justify-center hover:bg-ivory-100/15 transition-colors" aria-label="Pause recording">
                    <Pause size={28} className="text-ivory-50" />
                  </button>
                ) : (
                  <button onClick={() => { vibrate(8); recorder.resume(); }} className="w-20 h-20 rounded-full bg-gold-500 flex items-center justify-center hover:bg-gold-400 transition-colors" aria-label="Resume recording">
                    <Play size={28} className="text-ink-950 ml-1" />
                  </button>
                )}
                <button onClick={() => { vibrate(10); recorder.finish(); }} className="w-20 h-20 rounded-full bg-ivory-100/10 border border-ivory-100/20 flex items-center justify-center hover:bg-ivory-100/15 transition-colors" aria-label="Finish recording">
                  <Square size={24} className="text-ivory-50" />
                </button>
              </div>
            )}
            {status !== 'finalizing' && (
              <div className="flex justify-center gap-6 text-sm">
                <button onClick={handleCancelTap} className="text-ivory-400 hover:text-ivory-200 transition-colors">Cancel</button>
              </div>
            )}
          </div>
        )}

        {saving && (
          <div className="animate-fade-in-up">
            <p className="ui-label mb-3">Saving</p>
            <p className="text-ivory-400 text-sm">Saving your recording on this device...</p>
          </div>
        )}

        {saveError && !saving && (
          <div className="w-full max-w-sm mt-6 animate-fade-in-up">
            <p className="text-ivory-300 text-xs leading-relaxed mb-4">{saveError}</p>
            <button onClick={() => { vibrate(10); handleRetrySave(); }} className="btn-secondary w-full">Try Saving Again</button>
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
              <button onClick={handleDiscard} className="btn-secondary w-full text-clay-400">Discard</button>
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
              <button onClick={() => { setLeaveOpen(false); recorder.finish(); }} className="btn-secondary w-full">Finish Recording</button>
              <button onClick={handleDiscard} className="btn-secondary w-full text-clay-400">Discard Recording</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
