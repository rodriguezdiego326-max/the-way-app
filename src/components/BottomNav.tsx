import { useState } from 'react';
import { Home, BookOpen, MessageSquare, Heart, Compass, HelpCircle } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import HelpCenter, { type GuideId } from '@/components/HelpCenter';

export type Tab = 'today' | 'bible' | 'ask' | 'prayer' | 'explore';

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  badges?: Partial<Record<Tab, number>>;
  helpGuideId?: GuideId;
}

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'today', label: 'Today', icon: Home },
  { id: 'bible', label: 'Bible', icon: BookOpen },
  { id: 'ask', label: 'Ask', icon: MessageSquare },
  { id: 'prayer', label: 'Prayer', icon: Heart },
  { id: 'explore', label: 'Explore', icon: Compass },
];

export default function BottomNav({ active, onChange, badges, helpGuideId }: BottomNavProps) {
  const { t, language } = useLanguage();
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => { vibrate(8); setHelpOpen(true); }}
        aria-label={language === 'es' ? 'Abrir ayuda y videos' : 'Open help and videos'}
        className="fixed right-4 z-[55] flex h-11 w-11 items-center justify-center rounded-full border border-gold-500/30 bg-ink-850/95 text-gold-200 shadow-2xl backdrop-blur-xl no-tap-highlight"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 92px)' }}
      >
        <HelpCircle size={19} />
      </button>

      <HelpCenter
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        currentGuideId={helpGuideId ?? active}
      />

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 safe-bottom">
      <div className="mx-2 mb-2 rounded-3xl bg-ink-850/90 backdrop-blur-2xl border border-ink-700/50 shadow-2xl shadow-stone-900/15">
        <div className="flex items-stretch px-2 py-1.5">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            const badge = badges?.[id] ?? 0;
            return (
              <button
                key={id}
                onClick={() => {
                  vibrate(8);
                  onChange(id);
                }}
                className="nav-item no-tap-highlight group"
                aria-label={t(label)}
                aria-current={isActive ? 'page' : undefined}
              >
                <div
                  className={`relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gold-500/15 text-gold-300'
                      : 'text-ivory-500 group-hover:text-ivory-300'
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2 : 1.6}
                    className="transition-all duration-300"
                  />
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold-400 animate-fade-in" />
                  )}
                  {badge > 0 && (
                    <span
                      aria-label={`${badge} unread`}
                      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gold-400 text-ink-950 text-[10px] font-semibold leading-[18px] text-center animate-fade-in"
                    >
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium tracking-wide transition-all duration-300 ${
                    isActive ? 'text-gold-200' : 'text-ivory-600'
                  }`}
                >
                  {t(label)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      </nav>
    </>
  );
}
