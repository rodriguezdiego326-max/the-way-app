import { useState } from 'react';
import { HelpCircle, Home } from 'lucide-react';
import HelpCenter, { type GuideId } from '@/components/HelpCenter';
import { useLanguage } from '@/lib/i18n';
import { vibrate } from '@/lib/utils';

interface Props {
  onHome: () => void;
  helpGuideId?: GuideId;
}

export default function OverlayHomeButton({ onHome, helpGuideId }: Props) {
  const { language, t } = useLanguage();
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <div
        className="fixed right-4 z-[60] flex flex-col items-end gap-2"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
      >
        <button
          type="button"
          aria-label={language === 'es' ? 'Abrir ayuda y videos' : 'Open help and videos'}
          onClick={() => { vibrate(8); setHelpOpen(true); }}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-500/30 bg-ink-850/95 text-gold-200 shadow-2xl backdrop-blur-xl no-tap-highlight"
        >
          <HelpCircle size={17} />
        </button>

        <button
          type="button"
          aria-label={language === 'es' ? 'Ir a Hoy' : 'Go to Today home'}
          onClick={() => { vibrate(8); onHome(); }}
          className="flex items-center gap-2 rounded-full border border-gold-500/30 bg-ink-850/95 px-4 py-3 text-xs font-medium text-gold-200 shadow-2xl backdrop-blur-xl no-tap-highlight"
        >
          <Home size={16} />
          {t('Home')}
        </button>
      </div>

      <HelpCenter
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        currentGuideId={helpGuideId}
      />
    </>
  );
}
