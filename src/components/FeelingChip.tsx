import { vibrate } from '@/lib/utils';

interface FeelingChipProps {
  emoji: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}

export default function FeelingChip({ emoji, label, selected, onSelect }: FeelingChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => { vibrate(8); onSelect(); }}
      className={`mood-chip no-tap-highlight ${selected ? 'bg-gold-500/10 border-gold-500/50 shadow-md shadow-gold-500/10' : ''}`}
    >
      <span aria-hidden="true" className={`flex h-12 w-12 items-center justify-center rounded-full border text-2xl leading-none transition-colors duration-300 ${selected ? 'border-gold-400/60 bg-ink-850' : 'border-ink-700/50 bg-ink-900/60'}`}>{emoji}</span>
      <span className={`text-[11px] font-medium text-center leading-tight ${selected ? 'text-ivory-50' : 'text-ivory-400'}`}>{label}</span>
    </button>
  );
}
