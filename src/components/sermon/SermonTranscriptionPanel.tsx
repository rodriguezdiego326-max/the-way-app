import { useState } from 'react';
import { FileText, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { hasTranscriptionConsent, grantTranscriptionConsent } from '@/lib/sermonTranscription';
import type { SermonRecordingMeta } from '@/lib/sermonRecordingStore';
import type { SermonTranscriptionState } from '@/hooks/useSermonTranscription';
import SermonConfirmSheet from '@/components/sermon/SermonConfirmSheet';
import TranscriptionProgressCard from '@/components/sermon/TranscriptionProgressCard';

interface Props {
  meta: SermonRecordingMeta;
  transcription: SermonTranscriptionState;
  onOpenTranscript: () => void;
}

export default function SermonTranscriptionPanel({ meta, transcription, onOpenTranscript }: Props) {
  const [consentOpen, setConsentOpen] = useState(false);
  const { transcript, loaded, status, progress, error, canRetry, start, retry, cancel } = transcription;

  function handleTranscribe() {
    if (hasTranscriptionConsent(meta.profileId)) {
      void start();
    } else {
      setConsentOpen(true);
    }
  }

  function handleConsent() {
    grantTranscriptionConsent(meta.profileId);
    setConsentOpen(false);
    void start();
  }

  return (
    <div className="premium-card p-5 mb-4">
      <p className="ui-label mb-2">Transcript</p>

      {!loaded && <p className="text-ivory-500 text-xs">Checking for a transcript...</p>}

      {loaded && status !== 'idle' && (
        <TranscriptionProgressCard
          status={status}
          progress={progress}
          error={error}
          canRetry={canRetry}
          onRetry={retry}
          onCancel={() => void cancel()}
        />
      )}

      {loaded && status === 'idle' && transcript && (
        <button onClick={onOpenTranscript} className="w-full flex items-center justify-between gap-3 text-left group">
          <span className="flex items-center gap-3">
            <FileText size={18} className="text-success shrink-0" />
            <span>
              <span className="block text-ivory-100 text-sm font-medium">Transcript ready</span>
              <span className="block text-ivory-500 text-xs mt-0.5">Created {formatDate(transcript.createdAt)}</span>
            </span>
          </span>
          <ChevronRight size={16} className="text-ivory-500 transition-transform group-hover:translate-x-0.5" />
        </button>
      )}

      {loaded && status === 'idle' && !transcript && (
        <>
          <p className="text-ivory-500 text-xs leading-relaxed mb-4">
            Create a written transcript of this sermon. The transcript is saved on this device and is not added to your SOLAPATH Memory.
          </p>
          {meta.fileName ? (
            <button onClick={handleTranscribe} className="btn-primary w-full">
              <FileText size={16} /> Transcribe Sermon
            </button>
          ) : (
            <p className="text-ivory-500 text-xs leading-relaxed">
              This recording was saved in an older format and can't be transcribed.
            </p>
          )}
        </>
      )}

      <SermonConfirmSheet
        open={consentOpen}
        title="Transcribe this sermon?"
        confirmLabel="Continue & Transcribe"
        onConfirm={handleConsent}
        onCancel={() => setConsentOpen(false)}
        body={
          <>
            <p>To create a transcript, SOLAPATH will temporarily send this sermon recording to our transcription service for processing. The audio is used to create the transcript and is not added to your SOLAPATH Memory.</p>
            <p>SOLAPATH uses a third-party AI transcription service to convert your sermon recording into text.</p>
            <p>Your original recording stays on your device.</p>
          </>
        }
      />
    </div>
  );
}
