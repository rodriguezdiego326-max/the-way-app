import { useSermonRecording, OPEN_SERMON_RECORDER_EVENT } from '@/hooks/sermonRecordingContext';
import { formatDuration } from '@/lib/utils';

export default function SermonRecordingIndicator() {
  const { recorder, recorderScreenOpen } = useSermonRecording();
  const { snapshot } = recorder;
  if (snapshot.state === 'idle' || recorderScreenOpen) return null;

  const paused = snapshot.state === 'paused';
  const label = paused ? (snapshot.interrupted ? 'Interrupted' : 'Paused') : 'Recording';

  return (
    <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-md z-40 px-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] pointer-events-none">
      <button
        onClick={() => window.dispatchEvent(new Event(OPEN_SERMON_RECORDER_EVENT))}
        className="pointer-events-auto w-full flex items-center justify-between gap-3 rounded-2xl bg-ink-900 border border-ivory-100/10 px-4 py-3 shadow-lg transition-colors hover:bg-ink-800"
        aria-label={`Return to sermon recording, ${label}`}
      >
        <span className="flex items-center gap-2 text-sm text-ivory-100">
          <span className={`w-2 h-2 rounded-full ${paused ? 'bg-ivory-500' : 'bg-error animate-pulse'}`} />
          {label}
          <span className="text-ivory-500">·</span>
          <span className="font-mono tabular-nums">{formatDuration(snapshot.elapsedMs)}</span>
        </span>
        <span className="text-gold-300 text-sm font-medium">Return</span>
      </button>
    </div>
  );
}
