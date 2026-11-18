import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowRightLeft, Languages, Mic, Square, Volume2, VolumeX, X } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import {
  startLiveSermonTranslation,
  type LiveTranslationSession,
  type LiveTranslationState,
} from '@/lib/liveSermonTranslation';

interface Props {
  onBack: () => void;
}

type Direction = 'en-es' | 'es-en';

const MAX_SESSION_SECONDS = 90 * 60;

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function LiveSermonTranslatorScreen({ onBack }: Props) {
  const { t } = useLanguage();
  const [direction, setDirection] = useState<Direction>('en-es');
  const [connectionState, setConnectionState] = useState<LiveTranslationState>('closed');
  const [sourceTranscript, setSourceTranscript] = useState('');
  const [translatedTranscript, setTranslatedTranscript] = useState('');
  const [translatedAudioEnabled, setTranslatedAudioEnabled] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<LiveTranslationSession | null>(null);
  const timerRef = useRef<number | null>(null);

  const active = connectionState !== 'closed';
  const sourceLanguage = direction === 'en-es' ? t('English') : t('Spanish');
  const targetLanguage = direction === 'en-es' ? t('Spanish') : t('English');
  const targetCode = direction === 'en-es' ? 'es' : 'en';

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopSession() {
    clearTimer();
    sessionRef.current?.stop();
    sessionRef.current = null;
    setConnectionState('closed');
    setTranslatedAudioEnabled(false);
  }

  useEffect(() => {
    return () => {
      clearTimer();
      sessionRef.current?.stop();
      sessionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    if (elapsedSeconds < MAX_SESSION_SECONDS) return;
    setError(t('The 90-minute beta session limit was reached. Start a new session to continue.'));
    stopSession();
  }, [active, elapsedSeconds, t]);

  async function handleStart() {
    if (active) return;
    vibrate(12);
    setError(null);
    setSourceTranscript('');
    setTranslatedTranscript('');
    setElapsedSeconds(0);
    setTranslatedAudioEnabled(false);
    setConnectionState('connecting');

    try {
      const session = await startLiveSermonTranslation(targetCode, {
        onSourceDelta: (delta) => setSourceTranscript((current) => current + delta),
        onTranslationDelta: (delta) => setTranslatedTranscript((current) => current + delta),
        onStateChange: (state) => setConnectionState(state),
        onError: (message) => setError(message),
      });
      sessionRef.current = session;
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((seconds) => seconds + 1);
      }, 1000);
    } catch (cause) {
      sessionRef.current = null;
      setConnectionState('closed');
      setError(cause instanceof Error ? cause.message : t('Live translation could not start. Please try again.'));
    }
  }

  async function toggleTranslatedAudio() {
    const session = sessionRef.current;
    if (!session) return;
    const next = !translatedAudioEnabled;
    try {
      await session.setTranslatedAudioEnabled(next);
      setTranslatedAudioEnabled(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Translated audio could not play.'));
    }
  }

  function handleStop() {
    vibrate(10);
    stopSession();
  }

  function handleBack() {
    if (active) stopSession();
    onBack();
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col text-ivory-100">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={handleBack} className="btn-ghost" aria-label={t('Close')}>
          <X size={20} />
        </button>
        <p className="ui-label">{t('Live Sermon Translator')}</p>
        <span className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="premium-card p-6 mb-4">
            <div className="w-12 h-12 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-4">
              <Languages size={21} className="text-gold-300" />
            </div>
            <h2 className="font-serif text-2xl text-ivory-50 mb-2">{t('Translate the sermon as it is preached')}</h2>
            <p className="text-ivory-400 text-sm leading-relaxed">
              {t('SOLAPATH streams microphone audio for live translation. This live session is not saved automatically.')}
            </p>
          </div>

          <div className="premium-card p-5 mb-4">
            <p className="ui-label mb-3">{t('Translation Direction')}</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDirection('en-es')}
                disabled={active}
                className={`rounded-2xl border px-3 py-4 text-sm transition-all disabled:opacity-50 ${
                  direction === 'en-es'
                    ? 'border-gold-500/50 bg-gold-500/10 text-ivory-50'
                    : 'border-ivory-100/10 bg-ivory-100/5 text-ivory-400'
                }`}
              >
                {t('English')} → {t('Spanish')}
              </button>
              <button
                onClick={() => setDirection('es-en')}
                disabled={active}
                className={`rounded-2xl border px-3 py-4 text-sm transition-all disabled:opacity-50 ${
                  direction === 'es-en'
                    ? 'border-gold-500/50 bg-gold-500/10 text-ivory-50'
                    : 'border-ivory-100/10 bg-ivory-100/5 text-ivory-400'
                }`}
              >
                {t('Spanish')} → {t('English')}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 mb-4 px-1">
              <AlertCircle size={15} className="text-error shrink-0 mt-0.5" />
              <p className="text-ivory-300 text-xs leading-relaxed">{error}</p>
            </div>
          )}

          {!active ? (
            <div className="mb-5">
              <button onClick={() => void handleStart()} className="btn-primary w-full h-14">
                <Mic size={17} /> {t('Start Live Translation')}
              </button>
              <p className="text-ivory-600 text-xs leading-relaxed mt-3 text-center">
                {t('Beta sessions are limited to 90 minutes. Live translated audio is off by default.')}
              </p>
            </div>
          ) : (
            <>
              <div className="premium-card p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      connectionState === 'connected' ? 'bg-error animate-pulse' : 'bg-gold-400 animate-pulse'
                    }`} />
                    <span className="ui-label">
                      {connectionState === 'connected' ? t('Live') : t('Connecting...')}
                    </span>
                  </div>
                  <span className="font-mono text-sm text-ivory-300 tabular-nums">{formatClock(elapsedSeconds)}</span>
                </div>

                <div className="flex items-center justify-center gap-3 text-ivory-400 text-sm mb-5">
                  <span>{sourceLanguage}</span>
                  <ArrowRightLeft size={14} className="text-gold-300" />
                  <span>{targetLanguage}</span>
                </div>

                <button
                  onClick={() => void toggleTranslatedAudio()}
                  disabled={connectionState !== 'connected'}
                  className="btn-secondary w-full mb-3 disabled:opacity-40"
                >
                  {translatedAudioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  {translatedAudioEnabled ? t('Translated Audio On') : t('Translated Audio Off')}
                </button>
                <p className="text-ivory-600 text-xs leading-relaxed text-center">
                  {t('Use headphones when listening to translated audio to prevent microphone feedback.')}
                </p>
              </div>

              <div className="premium-card p-5 mb-4">
                <p className="ui-label mb-3">{t('Live Translation')}</p>
                <p className="font-serif text-xl leading-relaxed text-ivory-50 whitespace-pre-wrap min-h-24">
                  {translatedTranscript || t('Listening for the sermon...')}
                </p>
              </div>

              <div className="premium-card p-5 mb-4">
                <p className="ui-label mb-3">{t('Original')}</p>
                <p className="text-ivory-400 text-sm leading-relaxed whitespace-pre-wrap min-h-16">
                  {sourceTranscript || t('Original words will appear here as they are heard.')}
                </p>
              </div>

              <button onClick={handleStop} className="btn-secondary w-full text-clay-300 mb-5">
                <Square size={16} /> {t('Stop Translation')}
              </button>
            </>
          )}

          <div className="premium-card p-5 mb-8">
            <p className="ui-label mb-2">{t('For best results')}</p>
            <p className="text-ivory-500 text-xs leading-relaxed">
              {t('Place the phone where the preacher can be heard clearly. Accuracy can vary with room noise, accents, overlapping speech, names, and theological terms.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
