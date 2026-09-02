import { useState } from 'react';
import {
  X, BookOpen, ChevronRight, ChevronDown, Info, Landmark,
} from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { evangelismBibleTrails } from '@/lib/reachEngine';
import type { EvangelismBibleTrail } from '@/lib/reachTypes';

interface Props { onBack: () => void; }

export default function EvangelismBibleTrailsScreen({ onBack }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Evangelism Bible Trails</p><span className="w-10" />
      </header>
      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Landmark size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Evangelism Bible Trails</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Open Scripture. Let the text speak first.</p>
            </div>
          </div>

          <div className="flex items-start gap-2 mb-4 px-3 py-2 rounded-xl bg-ink-800/40 border border-ink-700/30">
            <Info size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-500 text-xs leading-relaxed">Each trail encourages you to physically open Scripture. Avoid isolated proof texts when context is needed.</p>
          </div>

          <div className="space-y-2">
            {evangelismBibleTrails.map((trail) => {
              const isExpanded = expanded === trail.id;
              return <TrailCard key={trail.id} trail={trail} isExpanded={isExpanded} onToggle={() => { vibrate(6); setExpanded(isExpanded ? null : trail.id); }} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrailCard({ trail, isExpanded, onToggle }: { trail: EvangelismBibleTrail; isExpanded: boolean; onToggle: () => void }) {
  return (
    <div className="premium-card overflow-hidden">
      <button onClick={onToggle} className="flex items-center justify-between w-full p-4 text-left no-tap-highlight">
        <div className="flex-1">
          <p className="text-ivory-100 font-medium text-sm">{trail.title}</p>
          <p className="text-ivory-500 text-xs mt-0.5">{trail.description}</p>
        </div>
        <ChevronDown size={16} className={`text-ivory-500 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="gold-divider mb-3" />
          <div className="space-y-2">
            {trail.passages.map((p, i) => (
              <div key={i} className="flex items-start gap-2">
                <ChevronRight size={14} className="text-gold-400/60 shrink-0 mt-0.5" />
                <div>
                  <p className="text-ivory-200 text-sm font-medium">{p.reference}</p>
                  <p className="text-ivory-500 text-xs leading-relaxed">{p.reading_objective}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-ink-800/40 border border-ink-700/30">
            <BookOpen size={13} className="text-gold-400/60 shrink-0" />
            <p className="text-ivory-500 text-xs">Open your Bible. Read each passage in its context before moving on.</p>
          </div>
        </div>
      )}
    </div>
  );
}
