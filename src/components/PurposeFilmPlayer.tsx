import { ChevronLeft, Film } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { vibrate } from '@/lib/utils';

interface Props {
  src: string;
  title: string;
  onBack: () => void;
}

export default function PurposeFilmPlayer({ src, title, onBack }: Props) {
  const { language } = useLanguage();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 px-5 py-3">
        <button
          type="button"
          onClick={() => { vibrate(8); onBack(); }}
          className="btn-ghost"
          aria-label={language === 'es' ? 'Volver a videos' : 'Back to videos'}
        >
          <ChevronLeft size={18} />
        </button>
        <p className="flex-1 truncate text-center text-sm font-medium text-ivory-200">{title}</p>
        <span className="w-10" aria-hidden="true" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <div className="overflow-hidden rounded-3xl border border-ink-700 bg-black shadow-2xl">
          <video
            key={src}
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
