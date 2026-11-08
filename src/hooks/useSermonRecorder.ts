import { useCallback, useEffect, useState } from 'react';
import {
  sermonRecorderNative,
  type FinishedSermonRecording,
  type SermonRecorderSnapshot,
} from '@/lib/sermonRecorderNative';

export type SermonRecorderError = 'denied' | 'failed';

const IDLE: SermonRecorderSnapshot = { state: 'idle', elapsedMs: 0, interrupted: false, startedAt: '' };
const POLL_MS = 500;

function errorCode(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    return String((err as { code: unknown }).code);
  }
  return undefined;
}

export function useSermonRecorder() {
  const [snapshot, setSnapshot] = useState<SermonRecorderSnapshot>(IDLE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<SermonRecorderError | null>(null);

  const refresh = useCallback(async () => {
    try {
      setSnapshot(await sermonRecorderNative.status());
    } catch {
      setError('failed');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isLive = snapshot.state !== 'idle';
  useEffect(() => {
    if (!isLive) return;
    const intervalId = window.setInterval(() => void refresh(), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isLive, refresh]);

  const runControl = useCallback(async (action: () => Promise<SermonRecorderSnapshot>) => {
    setBusy(true);
    setError(null);
    try {
      setSnapshot(await action());
      return true;
    } catch (err) {
      setError(errorCode(err) === 'denied' ? 'denied' : 'failed');
      await refresh();
      return false;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const start = useCallback(() => runControl(() => sermonRecorderNative.start()), [runControl]);
  const pause = useCallback(() => runControl(() => sermonRecorderNative.pause()), [runControl]);
  const resume = useCallback(() => runControl(() => sermonRecorderNative.resume()), [runControl]);

  const finish = useCallback(async (): Promise<FinishedSermonRecording | null> => {
    setBusy(true);
    setError(null);
    try {
      const result = await sermonRecorderNative.finish();
      setSnapshot(IDLE);
      return result;
    } catch {
      setError('failed');
      await refresh();
      return null;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const discard = useCallback(async (): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      await sermonRecorderNative.discard();
      setSnapshot(IDLE);
      return true;
    } catch {
      setError('failed');
      await refresh();
      return false;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  return { snapshot, busy, error, start, pause, resume, finish, discard };
}
