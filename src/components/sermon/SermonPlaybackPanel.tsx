import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, AlertCircle } from 'lucide-react';
import { vibrate, formatDuration } from '@/lib/utils';
import { sermonRecorderNative, type SermonPlaybackSnapshot } from '@/lib/sermonRecorderNative';
import type { SermonRecordingMeta } from '@/lib/sermonRecordingStore';

const PLAYBACK_ERROR = 'This recording could not be played. Please try again.';
const POLL_MS = 250;

interface Props {
  meta: SermonRecordingMeta;
  legacyBlob: Blob | null;
}

export default function SermonPlaybackPanel({ meta, legacyBlob }: Props) {
  if (meta.fileName) return <NativePlayback fileName={meta.fileName} durationMs={meta.durationMs} />;
  if (legacyBlob) return <LegacyPlayback blob={legacyBlob} durationMs={meta.durationMs} />;
  return <PlaybackFrame error="This recording's audio is missing from this device." />;
}

interface NativeProps {
  fileName: string;
  durationMs: number;
}

function NativePlayback({ fileName, durationMs }: NativeProps) {
  const [snapshot, setSnapshot] = useState<SermonPlaybackSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playing = snapshot?.playing ?? false;

  useEffect(() => () => {
    void sermonRecorderNative.stopPlayback();
  }, []);

  useEffect(() => {
    if (!playing) return;
    const intervalId = window.setInterval(() => {
      sermonRecorderNative.playbackStatus()
        .then(setSnapshot)
        .catch(() => setError(PLAYBACK_ERROR));
    }, POLL_MS);
    return () => window.clearInterval(intervalId);
  }, [playing]);

  async function run(action: () => Promise<SermonPlaybackSnapshot>) {
    setBusy(true);
    setError(null);
    try {
      setSnapshot(await action());
    } catch {
      setError(PLAYBACK_ERROR);
    } finally {
      setBusy(false);
    }
  }

  function handleToggle() {
    vibrate(8);
    void run(() => (snapshot?.loaded
      ? sermonRecorderNative.togglePlayback()
      : sermonRecorderNative.playRecording({ fileName })));
  }

  function handleRestart() {
    vibrate(8);
    void run(async () => {
      let next = snapshot?.loaded
        ? await sermonRecorderNative.seekPlayback({ positionMs: 0 })
        : await sermonRecorderNative.playRecording({ fileName });
      if (!next.playing) next = await sermonRecorderNative.togglePlayback();
      return next;
    });
  }

  return (
    <PlaybackFrame
      playing={playing}
      positionMs={snapshot?.positionMs ?? 0}
      durationMs={snapshot?.loaded ? snapshot.durationMs : durationMs}
      busy={busy}
      error={error}
      onToggle={handleToggle}
      onRestart={handleRestart}
    />
  );
}

interface LegacyProps {
  blob: Blob;
  durationMs: number;
}

function LegacyPlayback({ blob, durationMs }: LegacyProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  function handleToggle() {
    const audio = audioRef.current;
    if (!audio) return;
    vibrate(8);
    setError(null);
    if (audio.paused) {
      audio.play().catch(() => setError(PLAYBACK_ERROR));
    } else {
      audio.pause();
    }
  }

  function handleRestart() {
    const audio = audioRef.current;
    if (!audio) return;
    vibrate(8);
    setError(null);
    audio.currentTime = 0;
    audio.play().catch(() => setError(PLAYBACK_ERROR));
  }

  return (
    <>
      {url && (
        <audio
          ref={audioRef}
          src={url}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setPositionMs(e.currentTarget.currentTime * 1000)}
          onError={() => setError(PLAYBACK_ERROR)}
          className="hidden"
        />
      )}
      <PlaybackFrame
        playing={playing}
        positionMs={positionMs}
        durationMs={durationMs}
        busy={false}
        error={error}
        onToggle={handleToggle}
        onRestart={handleRestart}
      />
    </>
  );
}

interface FrameProps {
  playing?: boolean;
  positionMs?: number;
  durationMs?: number;
  busy?: boolean;
  error?: string | null;
  onToggle?: () => void;
  onRestart?: () => void;
}

function PlaybackFrame({
  playing = false,
  positionMs = 0,
  durationMs = 0,
  busy = false,
  error = null,
  onToggle,
  onRestart,
}: FrameProps) {
  const isEmpty = !onToggle;
  return (
    <div className="premium-card p-5 mb-4">
      <p className="ui-label mb-3">Playback</p>
      {isEmpty ? (
        <div className="flex items-start gap-2 px-1">
          <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
          <p className="text-ivory-300 text-xs leading-relaxed">{error}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <button
              onClick={onToggle}
              disabled={busy}
              className="w-12 h-12 rounded-full bg-gold-500 flex items-center justify-center hover:bg-gold-400 transition-colors disabled:opacity-40"
              aria-label={playing ? 'Pause playback' : 'Play recording'}
            >
              {playing ? <Pause size={18} className="text-ink-950" /> : <Play size={18} className="text-ink-950 ml-0.5" />}
            </button>
            <button
              onClick={onRestart}
              disabled={busy}
              className="w-10 h-10 rounded-full border border-ivory-100/15 flex items-center justify-center hover:bg-ivory-100/5 transition-colors disabled:opacity-40"
              aria-label="Play from beginning"
            >
              <RotateCcw size={16} className="text-ivory-300" />
            </button>
            <p className="font-mono text-sm text-ivory-300 tabular-nums">
              {formatDuration(positionMs)} / {formatDuration(durationMs)}
            </p>
          </div>
          {error && (
            <div className="flex items-start gap-2 mt-4 px-1">
              <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
              <p className="text-ivory-300 text-xs leading-relaxed">{error}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
