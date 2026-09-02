import type { TheologicalConfidence } from '@/lib/intelligenceTypes';

interface TheologicalConfidenceLabelProps {
  confidence: TheologicalConfidence;
}

const config: Record<TheologicalConfidence, { label: string; color: string; bg: string; border: string }> = {
  CORE_CHRISTIAN_DOCTRINE: {
    label: 'Core Christian Doctrine',
    color: 'text-gold-200',
    bg: 'bg-gold-500/10',
    border: 'border-gold-500/30',
  },
  CONFESSIONAL_REFORMED_POSITION: {
    label: 'Confessional Reformed Position',
    color: 'text-sage-400',
    bg: 'bg-sage-500/10',
    border: 'border-sage-500/30',
  },
  REFORMED_DEBATE: {
    label: 'Reformed Debate',
    color: 'text-ivory-300',
    bg: 'bg-ink-700/40',
    border: 'border-ink-600/40',
  },
  BROADER_CHRISTIAN_DISAGREEMENT: {
    label: 'Broader Christian Disagreement',
    color: 'text-clay-400',
    bg: 'bg-clay-500/10',
    border: 'border-clay-500/30',
  },
  WISDOM_APPLICATION: {
    label: 'Wisdom / Application',
    color: 'text-ivory-400',
    bg: 'bg-ink-800/50',
    border: 'border-ink-700/40',
  },
  NOT_EXPLICITLY_ADDRESSED: {
    label: 'Not Explicitly Addressed by Scripture',
    color: 'text-ivory-500',
    bg: 'bg-ink-800/40',
    border: 'border-ink-700/30',
  },
};

export default function TheologicalConfidenceLabel({ confidence }: TheologicalConfidenceLabelProps) {
  const c = config[confidence];
  return (
    <span
      className={`inline-flex items-center rounded-full border ${c.bg} ${c.border} ${c.color} text-[10px] font-medium tracking-[0.08em] px-2.5 py-1 uppercase`}
    >
      {c.label}
    </span>
  );
}
