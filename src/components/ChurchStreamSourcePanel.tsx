import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, ExternalLink, Headphones, Link, Radio, RefreshCw, Square, Trash2, Volume2 } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { useLanguage } from '@/lib/i18n';
import { churchStreamMessage, churchStreamRequest, type ChurchStreamResult, type StreamHint } from '@/lib/churchStreamEngine';
import { startChurchLiveListenerFromConnection, type ChurchLiveListenerSession, type ChurchLiveListenerState } from '@/lib/churchLiveListener';

export default function ChurchStreamSourcePanel({ churchId }: { churchId: string }) {
  const { t } = useLanguage();
  const [result, setResult] = useState<ChurchStreamResult | null>(null);
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [hint, setHint] = useState<StreamHint>('auto');
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listenerState, setListenerState] = useState<ChurchLiveListenerState>('closed');
  const [listenerError, setListenerError] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState('');
  const [translationText, setTranslationText] = useState('');
  const [needsAudio, setNeedsAudio] = useState(false);
  const listener = useRef<ChurchLiveListenerSession | null>(null);
  const mounted = useRef(true);
  const generation = useRef(0);
  const requestSequence = useRef(0);
  const editingInitialized = useRef(false);
  const inProgress = useRef(false);
  const refreshing = useRef<number | null>(null);

  const stopListening = useCallback(async () => {
    generation.current++;
    const current = listener.current;
    listener.current = null;
    if (mounted.current) { setListenerState('closed'); setNeedsAudio(false); }
    if (current) await current.stop().catch(() => undefined);
  }, []);

  const refresh = useCallback(async () => {
    if (inProgress.current || refreshing.current !== null) return;
    const sequence = ++requestSequence.current;
    refreshing.current = sequence;
    try {
      const next = await churchStreamRequest(churchId, 'get');
      if (!mounted.current || sequence !== requestSequence.current) return;
      if (next.error || !next.data) { setError(next.error ?? 'stream_update_failed'); return; }
      setError(null);
      setResult(next.data);
      if (!editingInitialized.current) {
        const source = next.data.source;
        setUrl(source?.sourceUrl ?? source?.watchUrl ?? '');
        setLabel(source?.label ?? '');
        setLanguage(source?.sourceLanguage ?? 'en');
        setHint(source?.kind === 'media' ? 'direct' : 'auto');
        editingInitialized.current = true;
      }
    } finally {
      if (refreshing.current === sequence) refreshing.current = null;
      if (mounted.current && sequence === requestSequence.current) setLoading(false);
    }
  }, [churchId]);

  const invalidateRequests = useCallback(() => {
    requestSequence.current++;
    refreshing.current = null;
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => {
      mounted.current = false;
      invalidateRequests();
      void stopListening();
    };
  }, [refresh, stopListening, invalidateRequests]);

  const source = result?.source;
  useEffect(() => {
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, source?.hasSession ? 8000 : 30000);
    const visible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener('visibilitychange', visible);
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', visible); };
  }, [refresh, source?.hasSession]);

  useEffect(() => {
    if (!source?.hasSession || source.state === 'offline' || source.state === 'error') void stopListening();
  }, [source?.hasSession, source?.state, stopListening]);

  async function update(action: 'save' | 'start' | 'stop' | 'remove') {
    if (!result?.canManage || inProgress.current) return;
    if (action === 'stop' && !window.confirm(t('Stop this stream connection for all church listeners?'))) return;
    if (action === 'remove' && !window.confirm(t('Remove this saved stream link from your church?'))) return;
    inProgress.current = true;
    ++requestSequence.current;
    setBusy(true);
    setError(null);
    try {
      if (action === 'stop' || action === 'remove') await stopListening();
      const next = await churchStreamRequest(churchId, action, {
        revision: result.revision,
        ...(action === 'save' ? { sourceUrl: url, label, hint, sourceLanguage: language } : {}),
      });
      if (!mounted.current) return;
      if (next.error || !next.data) { setError(next.error ?? 'stream_update_failed'); return; }
      setResult(next.data);
      if (action === 'save') { setUrl(next.data.source?.sourceUrl ?? url); setLabel(next.data.source?.label ?? label); }
      if (action === 'remove') { setUrl(''); setLabel(''); }
    } finally {
      inProgress.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function listen() {
    if (!source?.canListen || listenerState !== 'closed') return;
    await stopListening();
    const currentGeneration = ++generation.current;
    setListenerState('connecting'); setListenerError(null); setSourceText(''); setTranslationText('');
    const current = () => mounted.current && currentGeneration === generation.current;
    try {
      const response = await churchStreamRequest(churchId, 'listener_token');
      if (!current()) return;
      if (!response.data?.connection || response.error) throw new Error(response.error ?? 'feed_not_ready');
      const connection = response.data.connection;
      const session = await startChurchLiveListenerFromConnection(connection, connection.sourceIdentity, {
        onStateChange: state => { if (current()) setListenerState(state); },
        onSourceTranscript: text => { if (current()) setSourceText(text); },
        onTranslationTranscript: text => { if (current()) setTranslationText(text); },
        onNeedsAudioStart: needed => { if (current()) setNeedsAudio(needed); },
        onError: message => { if (current()) setListenerError(message); },
      });
      if (!current()) { await session.stop(); return; }
      listener.current = session;
    } catch (cause) {
      if (!current()) return;
      setListenerState('closed');
      setListenerError(churchStreamMessage(cause instanceof Error ? cause.message : null));
    }
  }

  async function watch() {
    if (!source?.watchUrl) return;
    await stopListening();
    try { await Browser.open({ url: source.watchUrl }); }
    catch { setError('stream_unreachable'); }
  }
  const stateLabel = source?.state === 'live' ? 'Source audio received'
    : source?.state === 'connecting' ? 'Checking source audio...'
    : source?.state === 'blocked' ? 'Translation unavailable'
    : source?.state === 'offline' ? 'Stream offline'
    : source?.state === 'error' ? 'Needs attention' : 'Stream link saved';

  return <div className="premium-card p-5 mb-4">
    <div className="flex items-center gap-2 mb-2"><Link size={18} className="text-gold-300" /><h3 className="font-serif text-xl">{t('Stream link')}</h3></div>
    <p className="text-ivory-400 text-xs leading-relaxed mb-4">{t('Add a viewing link from YouTube, Vimeo, Facebook, Twitch or your church website. Direct media links can also supply audio for translation.')}</p>
    {loading ? <p className="text-sm text-ivory-400">{t('Loading church live feed...')}</p> : <>
      {source ? <div className="rounded-xl bg-ink-900/50 border border-ink-700/50 p-4 mb-4">
        <p className="text-ivory-100 font-medium break-words">{source.label === source.provider ? t(source.label) : source.label}</p>
        <p className="text-ivory-500 text-xs mt-1">{t(source.provider)}</p>
        <p className="text-gold-300 text-sm mt-3" role="status">{t(stateLabel)}</p>
        <p className="text-ivory-500 text-xs mt-1">{source.sourceLanguage === 'en' ? `${t('English')} → ${t('Spanish')}` : `${t('Spanish')} → ${t('English')}`}</p>
        {source.error && <p className="text-clay-300 text-xs mt-3 leading-relaxed">{t(churchStreamMessage(source.error))}</p>}
        {source.watchUrl && <button type="button" className="btn-secondary w-full mt-4" onClick={() => void watch()}><ExternalLink size={15} />{t('Watch stream')}</button>}
        {!source.canTranslate && <p className="text-ivory-500 text-xs mt-3">{t('This link opens the provider’s player. Translation needs a direct audio or video feed.')}</p>}
        {source.canListen && listenerState === 'closed' && <button type="button" className="btn-primary w-full mt-3" onClick={() => void listen()}><Headphones size={16} />{t('Listen to Translation')}</button>}
        {listenerState !== 'closed' && <button type="button" className="btn-secondary w-full mt-3" onClick={() => void stopListening()}><Square size={14} />{listenerState === 'connecting' ? t('Cancel connection') : t('Stop Listening')}</button>}
        {needsAudio && <button type="button" className="btn-primary w-full mt-2" onClick={() => { void listener.current?.startAudio().then(() => setNeedsAudio(false)).catch(() => setListenerError('The translated audio needs another tap to play on this device.')); }}><Volume2 size={16} />{t('Start Translated Audio')}</button>}
        {listenerError && <p className="text-clay-300 text-xs mt-3" role="alert">{t(listenerError)}</p>}
        {listenerState !== 'closed' && <div className="grid gap-3 mt-4">
          <div><p className="ui-label mb-2">{t('Original Sermon')}</p><p className="text-sm whitespace-pre-wrap">{sourceText || t('Waiting for the pastor to begin speaking...')}</p></div>
          <div><p className="ui-label mb-2">{t('Translated Sermon')}</p><p className="text-sm whitespace-pre-wrap">{translationText || t('Waiting for translation...')}</p></div>
        </div>}
        {result?.canManage && <div className="grid gap-2 mt-4">
          {source.hasSession ? <button type="button" disabled={busy} onClick={() => void update('stop')} className="btn-secondary w-full disabled:opacity-40"><Square size={14} />{t('Stop connection for church')}</button>
            : source.canTranslate && <button type="button" disabled={busy} onClick={() => void update('start')} className="btn-primary w-full disabled:opacity-40"><Radio size={16} />{busy ? t('Connecting...') : t('Check translation connection')}</button>}
          {!source.hasSession && <button type="button" disabled={busy} onClick={() => void update('remove')} className="btn-ghost text-clay-300"><Trash2 size={14} />{t('Remove stream link')}</button>}
        </div>}
      </div> : <p className="text-ivory-400 text-sm mb-4">{t('No stream link has been saved for this church.')}</p>}
      {result?.canManage && <div className="grid gap-3">
        <label className="text-xs text-ivory-400">{t('Stream name')}<input className="input-field w-full mt-1" maxLength={80} value={label} disabled={busy || source?.hasSession} onChange={e => setLabel(e.target.value)} /></label>
        <label className="text-xs text-ivory-400">{t('Stream URL')}<input type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" className="input-field w-full mt-1 text-xs" maxLength={4096} value={url} disabled={busy || source?.hasSession} placeholder="https://..." onChange={e => setUrl(e.target.value)} /></label>
        <label className="text-xs text-ivory-400">{t('Link type')}<select className="input-field w-full mt-1" value={hint} disabled={busy || source?.hasSession} onChange={e => setHint(e.target.value as StreamHint)}><option value="auto">{t('Detect automatically')}</option><option value="direct">{t('Direct audio or video URL')}</option></select></label>
        <p className="text-[11px] text-ivory-500">{t('Direct sources include HLS (.m3u8), MP3, M4A, MP4, WebM and OGG. Password-protected or restricted sources may not connect.')}</p>
        <label className="text-xs text-ivory-400">{t('Translation Direction')}<select className="input-field w-full mt-1" value={language} disabled={busy || source?.hasSession} onChange={e => setLanguage(e.target.value as 'en' | 'es')}><option value="en">{t('English')} → {t('Spanish')}</option><option value="es">{t('Spanish')} → {t('English')}</option></select></label>
        <p className="text-[11px] text-ivory-500">{t('Viewing links are shared with church members. Saving a link does not confirm that translation audio is available.')}</p>
        <button type="button" disabled={busy || !url.trim() || source?.hasSession} className="btn-primary w-full disabled:opacity-40" onClick={() => void update('save')}>{busy ? t('Saving...') : t('Save stream link')}</button>
      </div>}
    </>}
    {error && <div className="flex gap-2 mt-4 text-clay-300" role="alert"><AlertCircle size={16} className="shrink-0" /><p className="text-xs">{t(churchStreamMessage(error))}</p></div>}
    <button type="button" className="btn-ghost text-xs mt-4" disabled={busy} onClick={() => void refresh()}><RefreshCw size={14} />{t('Refresh feed status')}</button>
  </div>;
}
