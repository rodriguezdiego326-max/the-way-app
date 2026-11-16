import { Home } from 'lucide-react';
import { vibrate } from '@/lib/utils';

export default function OverlayHomeButton({ onHome }: { onHome: () => void }) {
  return (
    <button
      type="button"
      aria-label="Go to Today home"
      onClick={() => { vibrate(8); onHome(); }}
      className="fixed right-4 z-[60] flex items-center gap-2 rounded-full border border-gold-500/30 bg-ink-850/95 px-4 py-3 text-xs font-medium text-gold-200 shadow-2xl backdrop-blur-xl no-tap-highlight"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
    >
      <Home size={16} />
      Home
    </button>
  );
}
