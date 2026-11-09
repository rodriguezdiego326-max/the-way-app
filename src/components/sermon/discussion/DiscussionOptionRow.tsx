import { Check } from 'lucide-react';

interface Props {
  kind: 'checkbox' | 'radio';
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
}

export default function DiscussionOptionRow({ kind, selected, disabled = false, onClick, label }: Props) {
  return (
    <button
      role={kind}
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={`premium-card p-4 flex items-start gap-3 text-left transition-all duration-300 disabled:opacity-40 ${selected ? 'border-gold-500/50' : 'hover:border-gold-500/30'}`}
    >
      <span className={`mt-0.5 w-4 h-4 shrink-0 flex items-center justify-center border ${kind === 'radio' ? 'rounded-full' : 'rounded-[4px]'} ${selected ? 'border-gold-400 bg-gold-400/20' : 'border-ivory-600'}`}>
        {selected && <Check size={11} className="text-gold-300" />}
      </span>
      <span className="text-ivory-100 text-sm leading-snug">{label}</span>
    </button>
  );
}
