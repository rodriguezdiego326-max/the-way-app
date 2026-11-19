import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Cable, Check, Copy, Headphones, Languages, Mic, Radio, ShieldCheck, Square, Volume2, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { vibrate } from '@/lib/utils';
import type { ChurchMembership } from '@/lib/togetherTypes';
import { isVerifiedChurchLeadership } from '@/lib/togetherTypes';
import { getChurch, getChurchMembershipForChurch } from '@/lib/churchEngine';
import {
  getChurchLiveFeedCredentials,
  getChurchLiveTranslationSettings,
  provisionChurchLiveFeed,
  type ChurchLiveFeedCredentials,
  type ChurchLiveInputType,
  type ChurchLiveLanguage,
  type ChurchLiveTranslationSettings,
} from '@/lib/churchLiveTranslationEngine';
import {
  startChurchLiveListener,
  type ChurchLiveListenerSession,
  type ChurchLiveListenerState,
} from '@/lib/churchLiveListener';

interface Props {
  profileId: string;
  churchId: string | null;
  onBack: () => void;
  onOpenMicrophoneTranslator: () => void;
}

function statusLabel(status: ChurchLiveTranslationSettings['provider_status'] | undefined) {
  switch (status) {
    case 'ready': return 'Ready';
    case 'live': return 'Live';
    case 'offline': return 'Offline';
    case 'provisioning': return 'Connecting';
    case 'error': return 'Needs attention';
    default: return 'Not connected';
  }
}

function selectedButton(selected: boolean) {
  return 'rounded-xl border px-3 py-3 text-xs font-medium ' + (
    selected
      ? 'border-gold-500/50 bg-gold-500/10 text-ivory-50'
      : 'border-ink-700/50 bg-ink-800/30 text-ivory-500'
  );
}

export default function ChurchLiveTranslationScreen({
  profileId,
  churchId,
  onBack,
  onOpenMicrophoneTranslator,
}: Props) {
  const { t } = useLanguage();
  const [churchName, setChurchName] = useState<string | null>(null);
  const [membership, setMembership] = useState<ChurchMembership | null>(null);
  const [settings, setSettings] = useState<ChurchLiveTranslationSettings | null>(null);
  const [credentials, setCredentials] = useState<ChurchLiveFeedCredentials | null>(null);
  const [inputType, setInputType] = useState<ChurchLiveInputType>('rtmp');
  const [sourceLanguage, setSourceLanguage] = useState<ChurchLiveLanguage>('en');
  const [targetLanguage, setTargetLanguage] = useState<ChurchLiveLanguage>('es');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<'server' | 'key' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listenerState, setListenerState] = useState<ChurchLiveListenerState>('closed');
  const [listenerError, setListenerError] = useState<string | null>(null);
  const [needsAudioStart, setNeedsAudioStart] = useState(false);
  const [sourceTranscript, setSourceTranscript] = useState('');
  const [translatedTranscript, setTranslatedTranscript] = useState('');
  const listenerSessionRef = useRef<ChurchLiveListenerSession | null>(null);

  const isLeadership = isVerifiedChurchLeadership(membership?.verified_church_role);
  const feedAvailable = !!settings?.enabled && ['ready', 'live', 'offline'].includes(settings.provider_status);

  const directionLabel = useMemo(
    () => sourceLanguage === 'en'
      ? t('English') + ' → ' + t('Spanish')
      : t('Spanish') + ' → ' + t('English'),
    [sourceLanguage, t],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!churchId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const [church, member, next] = await Promise.all([
        getChurch(churchId),
        getChurchMembershipForChurch(profileId, churchId),
        getChurchLiveTranslationSettings(churchId),
      ]);
      if (cancelled) return;
      setChurchName(church?.name ?? null);
      setMembership(member);
      setSettings(next);

      if (next) {
        setInputType(next.input_type);
        setSourceLanguage(next.source_language);
        setTargetLanguage(next.target_language);
      }

      if (isLeadership && next && ['ready', 'live', 'offline'].includes(next.provider_status)) {
        const saved = await getChurchLiveFeedCredentials(churchId);
        if (!cancelled) setCredentials(saved);
      }

      if (!cancelled) setLoading(false);
    }

    void load();
    return () => { cancelled = true; };
  }, [churchId, isLeadership, profileId]);

  useEffect(() => {
    return () => {
      const activeSession = listenerSessionRef.current;
      listenerSessionRef.current = null;
      if (activeSession) void activeSession.stop();
    };
  }, [churchId]);

  function selectDirection(source: ChurchLiveLanguage) {
    setSourceLanguage(source);
    setTargetLanguage(source === 'en' ? 'es' : 'en');
  }

  async function handleProvision() {
    if (!churchId || !isLeadership || busy) return;
    vibrate(10);
    setBusy(true);
    setError(null);
    setCredentials(null);

    const result = await provisionChurchLiveFeed(
      churchId,
      inputType,
      sourceLanguage,
      targetLanguage,
    );

    const refreshed = await getChurchLiveTranslationSettings(churchId);
    setSettings(refreshed);
    setBusy(false);

    if (result.error || !result.credentials) {
      if (refreshed?.provider_status === 'not_connected') {
        setError(t('LiveKit still needs to be connected to SOLAPATH before encoder credentials can be created.'));
      } else {
        setError(t('The church live feed could not be prepared. Please try again.'));
      }
      return;
    }

    setCredentials(result.credentials);
  }

  async function copyValue(kind: 'server' | 'key', value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setError(t('Could not copy this value. Press and hold to copy it manually.'));
    }
  }

  async function handleStartListening() {
    if (!churchId || !feedAvailable || listenerSessionRef.current) return;

    vibrate(10);
    setListenerError(null);
    setSourceTranscript('');
    setTranslatedTranscript('');
    setNeedsAudioStart(false);
    setListenerState('connecting');

    try {
      const session = await startChurchLiveListener(churchId, {
        onStateChange: setListenerState,
        onSourceTranscript: setSourceTranscript,
        onTranslationTranscript: setTranslatedTranscript,
        onNeedsAudioStart: setNeedsAudioStart,
        onError: (message) => setListenerError(t(message)),
      });
      listenerSessionRef.current = session;
    } catch {
      listenerSessionRef.current = null;
      setListenerState('closed');
      setListenerError(t('Could not connect to the church translation feed.'));
    }
  }

  async function handleStopListening() {
    const session = listenerSessionRef.current;
    listenerSessionRef.current = null;
    if (session) await session.stop().catch(() => undefined);
    setListenerState('closed');
    setNeedsAudioStart(false);
  }

  async function handleResumeAudio() {
    const session = listenerSessionRef.current;
    if (!session) return;
    try {
      await session.startAudio();
      setNeedsAudioStart(false);
    } catch {
      setListenerError(t('The translated audio needs another tap to play on this device.'));
    }
  }

  const statusDot = settings?.provider_status === 'live'
    ? 'bg-error animate-pulse'
    : feedAvailable
      ? 'bg-sage-400'
      : 'bg-ivory-700';

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col text-ivory-100">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost" aria-label={t('Close')}>
          <X size={20} />
        </button>
        <p className="ui-label">{t('Live Sermon Translation')}</p>
        <span className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="premium-card p-6 mb-4">
            <div className="w-12 h-12 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-4">
              <Radio size={21} className="text-gold-300" />
            </div>
            <h2 className="font-serif text-2xl text-ivory-50 mb-2">{t('Church Live Feed')}</h2>
            <p className="text-ivory-400 text-sm leading-relaxed">
              {t('Translate the clean sermon feed from the church sound system instead of relying on each listener’s microphone.')}
            </p>
            {churchName && <p className="text-gold-300 text-xs mt-3">{churchName}</p>}
          </div>

          {!churchId ? (
            <div className="premium-card p-5 mb-4">
              <p className="text-ivory-300 text-sm">{t('Connect a church first to use Church Live Feed.')}</p>
            </div>
          ) : loading ? (
            <div className="premium-card p-5 mb-4">
              <p className="text-ivory-500 text-sm">{t('Loading church live feed...')}</p>
            </div>
          ) : (
            <>
              <div className="premium-card p-5 mb-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="ui-label">{t('Church Feed Status')}</p>
                    <p className="text-ivory-100 text-sm mt-1">{t(statusLabel(settings?.provider_status))}</p>
                  </div>
                  <span className={'w-3 h-3 rounded-full ' + statusDot} />
                </div>
                <div className="flex items-center gap-2 text-xs text-ivory-500">
                  <Languages size={13} className="text-gold-300" />
                  <span>
                    {settings
                      ? settings.source_language === 'en'
                        ? t('English') + ' → ' + t('Spanish')
                        : t('Spanish') + ' → ' + t('English')
                      : directionLabel}
                  </span>
                </div>

                {feedAvailable ? (
                  <div className="rounded-xl border border-gold-500/20 bg-gold-500/5 p-4 mt-4">
                    <div className="flex items-center gap-2">
                      <Headphones size={15} className="text-gold-300" />
                      <p className="text-gold-200 text-sm font-medium">
                        {listenerState === 'connecting'
                          ? t('Connecting to church feed...')
                          : listenerState === 'waiting'
                            ? t('Waiting for sermon audio...')
                            : listenerState === 'listening'
                              ? t('Translated audio is live')
                              : t('Church feed prepared')}
                      </p>
                    </div>
                    <p className="text-ivory-500 text-xs mt-2 leading-relaxed">
                      {t('Listen to the translated sermon from your church’s clean audio feed. Your microphone stays off.')}
                    </p>

                    {listenerError && (
                      <div className="flex items-start gap-2 mt-3">
                        <AlertCircle size={14} className="text-clay-400 shrink-0 mt-0.5" />
                        <p className="text-clay-300 text-xs leading-relaxed">{listenerError}</p>
                      </div>
                    )}

                    <div className="mt-4">
                      {listenerState === 'closed' ? (
                        <button
                          type="button"
                          className="btn-primary w-full"
                          onClick={() => void handleStartListening()}
                        >
                          <Headphones size={16} /> {t('Listen to Translation')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-secondary w-full"
                          disabled={listenerState === 'connecting'}
                          onClick={() => void handleStopListening()}
                        >
                          <Square size={14} /> {
                            listenerState === 'connecting'
                              ? t('Connecting...')
                              : t('Stop Listening')
                          }
                        </button>
                      )}
                    </div>

                    {needsAudioStart && (
                      <button
                        type="button"
                        className="btn-primary w-full mt-2"
                        onClick={() => void handleResumeAudio()}
                      >
                        <Volume2 size={16} /> {t('Start Translated Audio')}
                      </button>
                    )}

                    {listenerState !== 'closed' && (
                      <div className="mt-5 grid gap-3">
                        <div className="rounded-xl border border-ink-700/40 bg-ink-900/40 p-4">
                          <p className="ui-label mb-2">{t('Original Sermon')}</p>
                          <p className="text-ivory-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {sourceTranscript || t('Waiting for the pastor to begin speaking...')}
                          </p>
                        </div>
                        <div className="rounded-xl border border-gold-500/20 bg-gold-500/5 p-4">
                          <p className="ui-label mb-2">{t('Translated Sermon')}</p>
                          <p className="text-ivory-100 text-sm leading-relaxed whitespace-pre-wrap">
                            {translatedTranscript || t('Waiting for translation...')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-ivory-600 text-xs mt-4 leading-relaxed">
                    {t('Your church has not connected a clean sermon feed yet. You can still use the microphone translator below.')}
                  </p>
                )}
              </div>

              <div className="premium-card p-5 mb-4">
                <p className="ui-label mb-2">{t('Fallback')}</p>
                <p className="text-ivory-500 text-xs leading-relaxed mb-4">
                  {t('Use the phone microphone when your church does not have a direct feed available.')}
                </p>
                <button type="button" onClick={onOpenMicrophoneTranslator} className="btn-secondary w-full">
                  <Mic size={16} /> {t('Use My Microphone')}
                </button>
              </div>

              {isLeadership && (
                <div className="premium-card p-5 mb-4 border-gold-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={16} className="text-gold-300" />
                    <p className="ui-label">{t('Church Live Feed Setup')}</p>
                  </div>
                  <p className="text-ivory-500 text-xs leading-relaxed mb-4">
                    {t('Verified church leadership can connect the church mixer or OBS encoder. Stream keys are never shown to regular members.')}
                  </p>

                  <p className="ui-label mb-2">{t('Encoder Type')}</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {(['rtmp', 'whip'] as ChurchLiveInputType[]).map((type) => (
                      <button
                        type="button"
                        key={type}
                        disabled={busy}
                        onClick={() => setInputType(type)}
                        className={selectedButton(inputType === type)}
                      >
                        {type.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <p className="ui-label mb-2">{t('Translation Direction')}</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => selectDirection('en')}
                      className={selectedButton(sourceLanguage === 'en')}
                    >
                      {t('English')} → {t('Spanish')}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => selectDirection('es')}
                      className={selectedButton(sourceLanguage === 'es')}
                    >
                      {t('Spanish')} → {t('English')}
                    </button>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 mb-4">
                      <AlertCircle size={14} className="text-clay-400 shrink-0 mt-0.5" />
                      <p className="text-clay-300 text-xs leading-relaxed">{error}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleProvision()}
                    className="btn-primary w-full disabled:opacity-40"
                  >
                    <Cable size={16} /> {busy ? t('Preparing...') : t('Prepare Church Feed')}
                  </button>

                  {credentials && (
                    <div className="mt-5 pt-5 border-t border-ink-700/40">
                      <p className="text-sage-300 text-xs font-medium mb-3">{t('Encoder credentials ready')}</p>

                      <p className="ui-label mb-1">{t('Server URL')}</p>
                      <div className="flex gap-2 mb-3">
                        <input readOnly value={credentials.serverUrl} className="input-field flex-1 text-xs" />
                        <button type="button" className="btn-secondary px-3" onClick={() => void copyValue('server', credentials.serverUrl)}>
                          {copied === 'server' ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>

                      {credentials.streamKey && (
                        <>
                          <p className="ui-label mb-1">{t('Stream Key')}</p>
                          <div className="flex gap-2">
                            <input readOnly value={credentials.streamKey} className="input-field flex-1 text-xs" />
                            <button type="button" className="btn-secondary px-3" onClick={() => void copyValue('key', credentials.streamKey || '')}>
                              {copied === 'key' ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        </>
                      )}

                      <p className="text-ivory-600 text-[11px] mt-3 leading-relaxed">
                        {t('In OBS, choose Custom service, paste the Server URL, then paste the Stream Key. Send the pastor or sermon audio bus to this output.')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="premium-card p-5 mb-8">
                <p className="ui-label mb-2">{t('How it works')}</p>
                <p className="text-ivory-500 text-xs leading-relaxed">
                  {t('Church mixer or OBS → private SOLAPATH media room → live translation → church listeners. YouTube can remain a separate destination from the same church encoder.')}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
