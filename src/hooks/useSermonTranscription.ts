import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getSermonTranscript, deleteSermonTranscript, type SermonTranscript,
} from '@/lib/sermonRecordingStore';
import {
  createTranscriptionJob, runTranscriptionJob, cancelTranscriptionJob, discardServerTranscript,
  TranscriptionCancelledError, TranscriptionError, TRANSCRIPT_FAILURE_MESSAGE,
  type TranscriptionJob, type TranscriptionProgress,
} from '@/lib/sermonTranscription';

export type TranscriptionStatus = 'idle' | 'running' | 'failed';

export function useSermonTranscription(recordingId: string, fileName: string | null) {
  const [transcript, setTranscript] = useState<SermonTranscript | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<TranscriptionStatus>('idle');
  const [progress, setProgress] = useState<TranscriptionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const jobRef = useRef<TranscriptionJob | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    getSermonTranscript(recordingId)
      .then((saved) => {
        if (mountedRef.current) setTranscript(saved);
      })
      .catch(() => undefined)
      .finally(() => {
        if (mountedRef.current) setLoaded(true);
      });
    return () => {
      mountedRef.current = false;
    };
  }, [recordingId]);

  const run = useCallback(async (job: TranscriptionJob) => {
    if (!fileName) return;
    jobRef.current = job;
    setStatus('running');
    setProgress({ stage: 'preparing' });
    setError(null);
    try {
      const saved = await runTranscriptionJob(job, fileName, (next) => {
        if (mountedRef.current && jobRef.current === job) setProgress(next);
      });
      if (jobRef.current !== job) return;
      jobRef.current = null;
      if (mountedRef.current) {
        setTranscript(saved);
        setStatus('idle');
        setProgress(null);
      }
    } catch (cause) {
      if (jobRef.current !== job || cause instanceof TranscriptionCancelledError) return;
      if (mountedRef.current) {
        setStatus('failed');
        setProgress(null);
        setError(cause instanceof TranscriptionError ? cause.message : TRANSCRIPT_FAILURE_MESSAGE);
      }
    }
  }, [fileName]);

  const start = useCallback(() => run(createTranscriptionJob(recordingId)), [recordingId, run]);

  const retry = useCallback(() => {
    if (jobRef.current) void run(jobRef.current);
  }, [run]);

  const cancel = useCallback(async () => {
    const job = jobRef.current;
    jobRef.current = null;
    setStatus('idle');
    setProgress(null);
    setError(null);
    if (job) await cancelTranscriptionJob(job);
  }, []);

  const removeTranscript = useCallback(async () => {
    await deleteSermonTranscript(recordingId);
    await discardServerTranscript(recordingId);
    setTranscript(null);
  }, [recordingId]);

  return {
    transcript,
    loaded,
    status,
    progress,
    error,
    canRetry: status === 'failed' && jobRef.current !== null,
    start,
    retry,
    cancel,
    removeTranscript,
  };
}

export type SermonTranscriptionState = ReturnType<typeof useSermonTranscription>;
