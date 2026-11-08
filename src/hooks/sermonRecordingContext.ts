import { createContext, useContext } from 'react';
import type { useSermonRecorder } from '@/hooks/useSermonRecorder';

export const OPEN_SERMON_RECORDER_EVENT = 'solapath:open-sermon-recorder';

export interface SermonRecordingContextValue {
  recorder: ReturnType<typeof useSermonRecorder>;
  recorderScreenOpen: boolean;
  setRecorderScreenOpen: (open: boolean) => void;
}

export const SermonRecordingContext = createContext<SermonRecordingContextValue | null>(null);

export function useSermonRecording(): SermonRecordingContextValue {
  const value = useContext(SermonRecordingContext);
  if (!value) throw new Error('useSermonRecording must be used inside SermonRecordingProvider');
  return value;
}
