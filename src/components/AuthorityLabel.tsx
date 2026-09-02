import type { SourceType } from '@/lib/types';

export type AuthorityLevel =
  | 'scripture'
  | 'confession'
  | 'historic_theology'
  | 'teacher'
  | 'explanation'
  | 'application';

interface AuthorityLabelProps {
  level: AuthorityLevel;
  size?: 'sm' | 'md';
}

const config: Record<
  AuthorityLevel,
  { label: string; bg: string; border: string; text: string; weight: string }
> = {
  scripture: {
    label: 'SCRIPTURE',
    bg: 'bg-gold-500/15',
    border: 'border-gold-500/40',
    text: 'text-gold-100',
    weight: 'font-semibold tracking-[0.15em]',
  },
  confession: {
    label: 'CONFESSION',
    bg: 'bg-sage-500/10',
    border: 'border-sage-500/30',
    text: 'text-sage-400',
    weight: 'font-medium tracking-[0.12em]',
  },
  historic_theology: {
    label: 'HISTORIC THEOLOGY',
    bg: 'bg-ink-700/50',
    border: 'border-ink-600/50',
    text: 'text-ivory-300',
    weight: 'font-medium tracking-[0.1em]',
  },
  teacher: {
    label: 'TEACHER',
    bg: 'bg-ink-700/40',
    border: 'border-ink-600/40',
    text: 'text-ivory-400',
    weight: 'font-medium tracking-[0.1em]',
  },
  explanation: {
    label: 'SOLAPATH EXPLANATION',
    bg: 'bg-ink-800/50',
    border: 'border-ink-700/40',
    text: 'text-ivory-500',
    weight: 'font-medium tracking-[0.08em]',
  },
  application: {
    label: 'APPLICATION',
    bg: 'bg-clay-500/10',
    border: 'border-clay-500/30',
    text: 'text-clay-400',
    weight: 'font-medium tracking-[0.12em]',
  },
};

export default function AuthorityLabel({ level, size = 'sm' }: AuthorityLabelProps) {
  const c = config[level];
  const sizeClass = size === 'sm' ? 'text-[10px] px-2.5 py-1' : 'text-xs px-3 py-1.5';
  return (
    <span
      className={`inline-flex items-center rounded-full border ${c.bg} ${c.border} ${c.text} ${c.weight} ${sizeClass} uppercase`}
    >
      {c.label}
    </span>
  );
}

export function sourceTypeToAuthority(sourceType: SourceType): AuthorityLevel {
  switch (sourceType) {
    case 'scripture':
      return 'scripture';
    case 'creed':
    case 'confession':
    case 'catechism':
      return 'confession';
    case 'historic_theologian':
      return 'historic_theology';
    case 'modern_teacher':
      return 'teacher';
    case 'editorial':
      return 'explanation';
    case 'ai_application':
      return 'application';
    default:
      return 'explanation';
  }
}
