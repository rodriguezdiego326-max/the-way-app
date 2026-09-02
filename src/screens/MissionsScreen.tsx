import {
  X, Compass, ChevronRight, Lock, Info, BookOpen,
} from 'lucide-react';
import { missionsSections } from '@/lib/reachEngine';

interface Props { onBack: () => void; }

export default function MissionsScreen({ onBack }: Props) {
  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Missions</p><span className="w-10" />
      </header>
      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Compass size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Missions</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">God's heart for the nations.</p>
            </div>
          </div>

          <div className="flex items-start gap-2 mb-4 px-3 py-2 rounded-xl bg-ink-800/40 border border-ink-700/30">
            <BookOpen size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-500 text-xs leading-relaxed">"Go therefore and make disciples of all nations." — Matthew 28:19</p>
          </div>

          <div className="space-y-2">
            {missionsSections.map((s) => (
              <div key={s.id} className={`premium-card p-4 ${!s.available ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0">
                    {s.available ? <Compass size={16} className="text-ivory-400" /> : <Lock size={14} className="text-ivory-700" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-ivory-100 font-medium text-sm">{s.title}</p>
                    <p className="text-ivory-500 text-xs mt-0.5 leading-relaxed">{s.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 mt-5 px-1">
            <Info size={13} className="text-ivory-600 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed">
              Missions is foundational in this phase. No live missionary databases or geopolitical data yet. David Platt and other approved teachers may eventually contribute through verified sources.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
