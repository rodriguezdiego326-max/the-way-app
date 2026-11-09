import { Check, Users } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import type { Circle } from '@/lib/togetherTypes';

interface Props {
  circles: Circle[];
  selectedId: string | null;
  onSelect: (circle: Circle) => void;
  onContinue: () => void;
}

export default function CircleChoiceStep({ circles, selectedId, onSelect, onContinue }: Props) {
  if (circles.length === 0) {
    return (
      <div className="premium-card p-5 animate-fade-in-up">
        <p className="font-serif text-lg text-ivory-50 mb-2">You don&apos;t have a Circle to share with yet.</p>
        <p className="text-ivory-400 text-sm leading-relaxed">Join or create a Circle in Together, then come back here to share a discussion.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <p className="text-ivory-400 text-sm leading-relaxed mb-5">Choose the Circle that should see this discussion. Nothing is shared until you confirm on the last step.</p>
      <div role="radiogroup" aria-label="Circles" className="flex flex-col gap-2 mb-6">
        {circles.map((circle) => {
          const selected = circle.id === selectedId;
          return (
            <button
              key={circle.id}
              role="radio"
              aria-checked={selected}
              onClick={() => { vibrate(8); onSelect(circle); }}
              className={`premium-card p-4 flex items-center gap-3 text-left transition-all duration-300 ${selected ? 'border-gold-500/50' : 'hover:border-gold-500/30'}`}
            >
              <div className="w-9 h-9 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0">
                <Users size={16} className={selected ? 'text-gold-300' : 'text-ivory-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-ivory-100 font-medium text-sm truncate">{circle.name}</p>
                <p className="text-ivory-600 text-xs capitalize">{circle.circle_type.toLowerCase().replace(/_/g, ' ')}</p>
              </div>
              {selected && <Check size={16} className="text-gold-300 shrink-0" />}
            </button>
          );
        })}
      </div>
      <button onClick={onContinue} disabled={!selectedId} className="btn-primary w-full disabled:opacity-40">Continue</button>
    </div>
  );
}
