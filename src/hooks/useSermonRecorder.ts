import { useCallback, useEffect, useRef, useState } from 'react';

export type SermonRecorderStatus =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'paused'
  | 'finalizing'
  | 'denied'
  | 'unavailable'
  | 'error';

export interface CapturedSermonAudio {
  blob: Blob;
  mimeType: string;
  durationMs: number;
  startedAt: string;
}

export type CaptureEndReason = 'finished' | 'interrupted';

const MIME_CANDIDATES = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return undefined;
  return MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t));
}

export function useSermonRecorder(onCapture: (capture: CapturedSermonAudio, reason: CaptureEndReason) => void) {
  const [status, setStatus] = useState<SermonRecorderStatus>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);

  const statusRef = useRef<SermonRecorderStatus>('idle');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const accumulatedRef = useRef(0);
  const segmentStartRef = useRef(0);
  const startedAtRef = useRef('');
  const discardRef = useRef(false);
  const endReasonRef = useRef<CaptureEndReason>('finished');
  const finalDurationRef = useRef(0);
  const tickRef = useRef<number | null>(null);
  const onCaptureRef = useRef(onCapture);

  useEffect(() => {
    onCaptureRef.current = onCapture;
  }, [onCapture]);

  const updateStatus = useCallback((next: SermonRecorderStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const stopTicker = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const startTicker = useCallback(() => {
    stopTicker();
    tickRef.current = window.setInterval(() => {
      setElapsedMs(accumulatedRef.current + (Date.now() - segmentStartRef.current));
    }, 250);
  }, [stopTicker]);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stopRecorder = useCallback((reason: CaptureEndReason) => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    if (recorder.state === 'recording') {
      accumulatedRef.current += Date.now() - segmentStartRef.current;
    }
    finalDurationRef.current = accumulatedRef.current;
    endReasonRef.current = reason;
    stopTicker();
    setElapsedMs(accumulatedRef.current);
    updateStatus('finalizing');
    recorder.stop();
  }, [stopTicker, updateStatus]);

  const start = useCallback(async () => {
    if (statusRef.current !== 'idle' && statusRef.current !== 'denied' && statusRef.current !== 'error') return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      updateStatus('unavailable');
      return;
    }

    updateStatus('requesting');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const denied = err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      updateStatus(denied ? 'denied' : 'error');
      return;
    }

    const mimeType = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      updateStatus('error');
      return;
    }

    chunksRef.current = [];
    accumulatedRef.current = 0;
    discardRef.current = false;
    startedAtRef.current = new Date().toISOString();
    streamRef.current = stream;
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onerror = () => stopRecorder('interrupted');
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || 'audio/mp4' });
      chunksRef.current = [];
      releaseStream();
      recorderRef.current = null;
      setElapsedMs(0);

      if (discardRef.current) {
        updateStatus('idle');
        return;
      }
      if (blob.size === 0) {
        updateStatus('error');
        return;
      }
      updateStatus('idle');
      onCaptureRef.current(
        { blob, mimeType: blob.type, durationMs: finalDurationRef.current, startedAt: startedAtRef.current },
        endReasonRef.current,
      );
    };

    stream.getAudioTracks().forEach((track) => {
      track.addEventListener('ended', () => {
        const active = recorderRef.current;
        if (active && active.state !== 'inactive') stopRecorder('interrupted');
      });
    });

    recorder.start(1000);
    segmentStartRef.current = Date.now();
    updateStatus('recording');
    startTicker();
  }, [releaseStream, startTicker, stopRecorder, updateStatus]);

  const pause = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;
    try {
      recorder.pause();
    } catch {
      return;
    }
    accumulatedRef.current += Date.now() - segmentStartRef.current;
    stopTicker();
    setElapsedMs(accumulatedRef.current);
    updateStatus('paused');
  }, [stopTicker, updateStatus]);

  const resume = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'paused') return;
    try {
      recorder.resume();
    } catch {
      return;
    }
    segmentStartRef.current = Date.now();
    updateStatus('recording');
    startTicker();
  }, [startTicker, updateStatus]);

  const finish = useCallback(() => stopRecorder('finished'), [stopRecorder]);

  const discard = useCallback(() => {
    discardRef.current = true;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    } else {
      releaseStream();
      updateStatus('idle');
    }
  }, [releaseStream, updateStatus]);

  useEffect(() => {
    return () => {
      stopTicker();
      stopRecorder('interrupted');
    };
  }, [stopRecorder, stopTicker]);

  return { status, elapsedMs, start, pause, resume, finish, discard };
}
