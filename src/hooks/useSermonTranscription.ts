import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getSermonTranscript, deleteSermonTranscript, type SermonTranscript,
} from '@/lib/sermonRecordingStore';
import {
  createTranscriptionJob, runTranscriptionJob, cancelTranscriptionJob, discardServerTranscript,
  TranscriptionCancelledError, TranscriptionError, TRANSCRIPT_FAILURE_MESSAGE,
  type TranscriptionJob, type TranscriptionProgress,
} from '@/lib/sermonTranscription';

export type TranscriptionStatus = 'idle' | 'running' | 'cancelling' | 'failed';

export function useSermonTranscription(recordingId: string, fileName: string | null) {
  const [transcript, setTranscript] = useState<SermonTranscript | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<TranscriptionStatus>('idle');
  const [progress, setProgress] = useState<TranscriptionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const jobRef = useRef<TranscriptionJob | null>(null);
  const cancelPromiseRef = useRef<Promise<void> | null>(null);
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
        if (mountedRef.current && jobRef.current === job && !job.cancelled) setProgress(next);
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

  const start = useCallback(() => {
    if (jobRef.current || cancelPromiseRef.current) return Promise.resolve();
    return run(createTranscriptionJob(recordingId));
  }, [recordingId, run]);

  const retry = useCallback(() => {
    if (jobRef.current && !cancelPromiseRef.current) void run(jobRef.current);
  }, [run]);

  const cancel = useCallback((): Promise<void> => {
    if (cancelPromiseRef.current) return cancelPromiseRef.current;
    const job = jobRef.current;
    if (!job) return Promise.resolve();
    setStatus('cancelling');
    setProgress(null);
    setError(null);
    const pending = cancelTranscriptionJob(job).finally(() => {
      if (jobRef.current === job) jobRef.current = null;
      cancelPromiseRef.current = null;
      if (mountedRef.current) setStatus('idle');
    });
    cancelPromiseRef.current = pending;
    return pending;
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
