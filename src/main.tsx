import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initNative } from '@/lib/nativeInit';
import SermonRecordingProvider from '@/components/SermonRecordingProvider';
import SermonRecordingIndicator from '@/components/SermonRecordingIndicator';

initNative();

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <SermonRecordingProvider>
        <App />
        <SermonRecordingIndicator />
      </SermonRecordingProvider>
    </StrictMode>
  );
}
