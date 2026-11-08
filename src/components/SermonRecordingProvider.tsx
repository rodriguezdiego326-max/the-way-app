import { useState, type ReactNode } from 'react';
import { useSermonRecorder } from '@/hooks/useSermonRecorder';
import { SermonRecordingContext } from '@/hooks/sermonRecordingContext';

export default function SermonRecordingProvider({ children }: { children: ReactNode }) {
  const recorder = useSermonRecorder();
  const [recorderScreenOpen, setRecorderScreenOpen] = useState(false);
  return (
    <SermonRecordingContext.Provider value={{ recorder, recorderScreenOpen, setRecorderScreenOpen }}>
      {children}
    </SermonRecordingContext.Provider>
  );
}
