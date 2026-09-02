import { Home, BookOpen, MessageSquare, Heart, User } from 'lucide-react';
import { vibrate } from '@/lib/utils';

export type Tab = 'today' | 'bible' | 'ask' | 'prayer' | 'you';

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'today', label: 'Today', icon: Home },
  { id: 'bible', label: 'Bible', icon: BookOpen },
  { id: 'ask', label: 'Ask', icon: MessageSquare },
  { id: 'prayer', label: 'Prayer', icon: Heart },
  { id: 'you', label: 'You', icon: User },
];

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 safe-bottom">
      <div className="mx-2 mb-2 rounded-3xl bg-ink-850/90 backdrop-blur-2xl border border-ink-700/50 shadow-2xl shadow-black/50">
        <div className="flex items-stretch px-2 py-1.5">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => {
                  vibrate(8);
                  onChange(id);
                }}
                className="nav-item no-tap-highlight group"
                aria-label={label}
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
                </div>
                <span
                  className={`text-[10px] font-medium tracking-wide transition-all duration-300 ${
                    isActive ? 'text-gold-200' : 'text-ivory-600'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
