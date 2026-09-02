import React from 'react';
import {
  Clock, MapPin, Flame, Crown, Heart, Eye, BookOpen,
  type LucideIcon,
} from 'lucide-react';
import { SYMBOL_OPTIONS, isIconSymbol, type SymbolOption } from '@/lib/bibleTypes';

const ICON_MAP: Record<string, LucideIcon> = {
  clock: Clock,
  'map-pin': MapPin,
  flame: Flame,
  crown: Crown,
  heart: Heart,
  eye: Eye,
  'book-open': BookOpen,
};

interface SymbolPickerProps {
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
}

const SymbolPicker: React.FC<SymbolPickerProps> = ({ selectedSymbol, onSelect }) => {
  const geometric = SYMBOL_OPTIONS.filter((s) =>
    ['✦', '★', '◆', '◇', '●', '○', '■', '□', '▲', '△'].includes(s.id)
  );
  const direction = SYMBOL_OPTIONS.filter((s) =>
    ['→', '↔'].includes(s.id)
  );
  const study = SYMBOL_OPTIONS.filter((s) =>
    ['+', '×', '!', '?', '⌂', '∞'].includes(s.id)
  );
  const icons = SYMBOL_OPTIONS.filter((s) => s.icon);

  function renderOption(opt: SymbolOption) {
    const isSelected = selectedSymbol === opt.id;
    const IconComp = opt.icon ? ICON_MAP[opt.icon] : null;
    return (
      <button
        key={opt.id}
        onClick={() => onSelect(opt.id)}
        className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg border transition-all no-tap-highlight ${isSelected ? 'bg-gold-500/20 border-gold-500/40 text-gold-200 scale-105' : 'bg-ink-700/40 border-ink-600/30 text-ivory-300 hover:border-gold-500/30'}`}
        aria-label={opt.label}
      >
        {IconComp ? (
          <IconComp size={18} strokeWidth={2} />
        ) : (
          <span className="text-lg">{opt.char}</span>
        )}
        <span className="text-[8px] text-ivory-600 mt-0.5">{opt.label}</span>
      </button>
    );
  }

  return (
    <div className="space-y-2.5">
      <div>
        <p className="text-ivory-600 text-[9px] uppercase tracking-wider mb-1">Geometric</p>
        <div className="flex flex-wrap gap-1.5">{geometric.map(renderOption)}</div>
      </div>
      <div>
        <p className="text-ivory-600 text-[9px] uppercase tracking-wider mb-1">Direction</p>
        <div className="flex flex-wrap gap-1.5">{direction.map(renderOption)}</div>
      </div>
      <div>
        <p className="text-ivory-600 text-[9px] uppercase tracking-wider mb-1">Study</p>
        <div className="flex flex-wrap gap-1.5">{study.map(renderOption)}</div>
      </div>
      <div>
        <p className="text-ivory-600 text-[9px] uppercase tracking-wider mb-1">Icons</p>
        <div className="flex flex-wrap gap-1.5">{icons.map(renderOption)}</div>
      </div>
    </div>
  );
};

export default React.memo(SymbolPicker);
export { isIconSymbol };
