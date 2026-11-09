import { AlertCircle } from 'lucide-react';
import type { TranscriptionProgress } from '@/lib/sermonTranscription';
import type { TranscriptionStatus } from '@/hooks/useSermonTranscription';

interface Props {
  status: Exclude<TranscriptionStatus, 'idle'>;
  progress: TranscriptionProgress | null;
  error: string | null;
  canRetry: boolean;
  onRetry: () => void;
  onCancel: () => void;
}

function progressLabel(progress: TranscriptionProgress | null): string {
  switch (progress?.stage) {
    case 'uploading': return `Uploading part ${progress.partIndex} of ${progress.partCount}`;
    case 'transcribing': return `Transcribing (part ${progress.partIndex} of ${progress.partCount})`;
    case 'finalizing': return 'Finishing transcript…';
    default: return 'Preparing audio…';
  }
}

function progressWidth(progress: TranscriptionProgress | null): number {
  switch (progress?.stage) {
    case 'uploading': return Math.round(((progress.partIndex - 1) / progress.partCount) * 100);
    case 'transcribing': return Math.round(((progress.partIndex - 1) / progress.partCount) * 100);
    case 'finalizing': return 100;
    default: return 0;
  }
}

export default function TranscriptionProgressCard({ status, progress, error, canRetry, onRetry, onCancel }: Props) {
  if (status === 'failed') {
    return (
      <div className="premium-card p-5 mb-4">
        <div className="flex items-start gap-2 mb-4">
          <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
          <p className="text-ivory-200 text-sm leading-relaxed">{error}</p>
        </div>
        <div className="flex flex-col gap-2">
          {canRetry && (
            <button onClick={onRetry} className="btn-primary w-full">Try Again</button>
          )}
          <button onClick={onCancel} className="btn-secondary w-full">Cancel</button>
        </div>
      </div>
    );
  }

  if (status === 'cancelling') {
    return (
      <div className="premium-card p-5 mb-4" role="status" aria-live="polite">
        <p className="text-ivory-100 text-sm font-medium mb-2">Cancelling transcription…</p>
        <p className="text-ivory-500 text-xs leading-relaxed">
          Stopping the current transfer and cleaning up temporary transcription data. Your original recording will remain on this device.
        </p>
      </div>
    );
  }

  return (
    <div className="premium-card p-5 mb-4" role="status" aria-live="polite">
      <p className="text-ivory-100 text-sm font-medium mb-3">{progressLabel(progress)}</p>
      <div className="h-1.5 w-full rounded-full bg-ink-800 overflow-hidden mb-4">
        <div className="h-full bg-success transition-all duration-500 ease-out" style={{ width: `${progressWidth(progress)}%` }} />
      </div>
      <p className="text-ivory-500 text-xs leading-relaxed mb-4">
        Your original recording stays on this device while the transcript is created.
      </p>
      {progress?.stage !== 'finalizing' && (
        <button onClick={onCancel} className="btn-secondary w-full">Cancel Transcript</button>
      )}
    </div>
  );
}
