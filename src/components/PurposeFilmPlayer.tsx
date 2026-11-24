import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Film } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { vibrate } from '@/lib/utils';

export const PURPOSE_FILM_SOURCES = {
  en: 'https://tmdozaxdvammarxsxjai.supabase.co/storage/v1/object/public/help-media/solapath-purpose-en-v165-sync.mp4',
  es: 'https://tmdozaxdvammarxsxjai.supabase.co/storage/v1/object/public/help-media/solapath-purpose-es-v165-sync.mp4',
};

// Timings follow the narration in the v165-sync films. Keep these tied to
// PURPOSE_FILM_SOURCES; replacing a film requires checking its cue timings.
const FEATURE_CAPTIONS: Record<'en' | 'es', ReadonlyArray<readonly [number, number, string]>> = {
  "en": [
    [
      24.94,
      26.84,
      "TODAY"
    ],
    [
      27.48,
      33.04,
      "BIBLE"
    ],
    [
      33.56,
      40.4,
      "ASK"
    ],
    [
      40.86,
      44.72,
      "PRAYER"
    ]
  ],
  "es": [
    [
      27.22,
      29.06,
      "HOY"
    ],
    [
      29.06,
      36.32,
      "BIBLIA"
    ],
    [
      36.68,
      44.68,
      "PREGUNTAR"
    ],
    [
      45.08,
      50.5,
      "ORACIÓN"
    ]
  ]
};

interface Props {
  src: string;
  title: string;
  onBack: () => void;
  autoPlay?: boolean;
  onEnded?: () => void;
  backLabel?: string;
}

export default function PurposeFilmPlayer({ src, title, onBack, autoPlay = false, onEnded, backLabel }: Props) {
  const { language } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [needsPlay, setNeedsPlay] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    let cancelled = false;
    setNeedsPlay(false);
    setFailed(false);
    if (autoPlay && video) {
      void video.play().catch(() => { if (!cancelled) setNeedsPlay(true); });
    }
    return () => {
      cancelled = true;
      video?.pause();
    };
  }, [src, autoPlay]);

  useEffect(() => {
    const video = videoRef.current;
    const filmLanguage = src === PURPOSE_FILM_SOURCES.en ? 'en'
      : src === PURPOSE_FILM_SOURCES.es ? 'es' : null;
    if (!video || !filmLanguage) return;

    // Native timed cues follow the media clock, including seeking, pausing and
    // full-screen playback. Reuse the track during React effect re-runs.
    const label = filmLanguage === 'es' ? 'Funciones de SOLAPATH' : 'SOLAPATH features';
    const track = Array.from(video.textTracks).find((item) => item.label === label)
      ?? video.addTextTrack('captions', label, filmLanguage);
    const cues = FEATURE_CAPTIONS[filmLanguage].map(([start, end, text]) => {
      const cue = new VTTCue(start, end, text);
      cue.snapToLines = false;
      cue.line = 80;
      cue.position = 50;
      cue.align = 'center';
      cue.size = 90;
      track.addCue(cue);
      return cue;
    });
    track.mode = 'showing';
    return () => {
      for (const cue of cues) track.removeCue(cue);
      track.mode = 'disabled';
    };
  }, [src]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 px-5 py-3">
        <button
          type="button"
          onClick={() => { vibrate(8); onBack(); }}
          className="btn-ghost"
          aria-label={backLabel ?? (language === 'es' ? 'Volver a videos' : 'Back to videos')}
        >
          {backLabel ?? <ChevronLeft size={18} />}
        </button>
        <p className="flex-1 truncate text-center text-sm font-medium text-ivory-200">{title}</p>
        <span className="w-10" aria-hidden="true" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <div className="overflow-hidden rounded-3xl border border-ink-700 bg-black shadow-2xl">
          <video
            ref={videoRef}
            key={src}
            autoPlay={autoPlay}
            onEnded={onEnded}
            onPlaying={() => setNeedsPlay(false)}
            onError={() => setFailed(true)}
            src={src}
            controls
            playsInline
            preload="metadata"
            className="aspect-[9/16] w-full bg-black object-contain"
          >
            {language === 'es'
              ? 'Tu dispositivo no puede reproducir este video.'
              : 'Your device cannot play this video.'}
          </video>
        </div>

        {needsPlay && !failed && (
          <button type="button" className="btn-primary mt-4 w-full" onClick={() => {
            void videoRef.current?.play().catch(() => setNeedsPlay(true));
          }}>
            {language === 'es' ? 'Reproducir video' : 'Play video'}
          </button>
        )}
        {failed && (
          <p role="status" className="mt-4 text-sm text-ivory-400">
            {language === 'es'
              ? 'No se pudo cargar el video. Puedes continuar y volver a verlo en Ayuda y videos.'
              : 'The video could not load. You can continue and watch it later in Help & Video Guides.'}
          </p>
        )}

        <div className="mt-5 rounded-2xl border border-gold-500/15 bg-gold-500/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold-500/20 bg-gold-500/10">
              <Film size={17} className="text-gold-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-ivory-100">
                {language === 'es' ? 'El propósito de SOLAPATH' : 'The purpose of SOLAPATH'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ivory-400">
                {language === 'es'
                  ? 'Una introducción cinematográfica sobre cómo la Escritura, la familia, la iglesia, la oración, la comunidad y el discipulado se conectan dentro de SOLAPATH.'
                  : 'A cinematic introduction to how Scripture, family, church, prayer, community, and discipleship connect inside SOLAPATH.'}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-ivory-600">
          {language === 'es'
            ? 'El video está incluido dentro de SOLAPATH y no abre un sitio externo.'
            : 'This film is included inside SOLAPATH and does not open an external website.'}
        </p>
      </div>
    </div>
  );
}
