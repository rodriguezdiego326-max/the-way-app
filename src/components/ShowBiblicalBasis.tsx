import { BookOpen, ChevronRight, Info } from 'lucide-react';

export interface BiblicalBasisPassage {
  reference: string;
  relevance: string;
  immediate_context: string;
  broader_context?: string;
  doctrine_connections?: string[];
}

interface ShowBiblicalBasisProps {
  passages: BiblicalBasisPassage[];
}

export default function ShowBiblicalBasis({ passages }: ShowBiblicalBasisProps) {
  if (passages.length === 0) {
    return (
      <div className="premium-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={15} className="text-gold-300" />
          <p className="text-sm text-ivory-100 font-medium">Biblical Basis</p>
        </div>
        <p className="text-ivory-600 text-xs italic">No biblical basis passages available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {passages.map((p, i) => (
        <div key={i} className="premium-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={15} className="text-gold-300" />
            <p className="font-serif text-lg text-ivory-50">{p.reference}</p>
          </div>

          <div className="space-y-2">
            <div>
              <p className="ui-label mb-1">Why this passage matters</p>
              <p className="text-ivory-300 text-sm leading-relaxed">{p.relevance}</p>
            </div>

            <div>
              <p className="ui-label mb-1">Read in context</p>
              <p className="text-ivory-400 text-xs">{p.immediate_context}</p>
              {p.broader_context && (
                <p className="text-ivory-600 text-xs mt-0.5">Broader context: {p.broader_context}</p>
              )}
            </div>

            {p.doctrine_connections && p.doctrine_connections.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {p.doctrine_connections.map((d, j) => (
                  <span key={j} className="px-2 py-0.5 rounded-full bg-ink-700/50 border border-ink-600/40 text-ivory-400 text-[10px] font-medium">
                    {d}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button className="btn-secondary w-full mt-3 text-xs">
            <BookOpen size={12} />
            Open Your Bible
            <ChevronRight size={12} />
          </button>
        </div>
      ))}

      <div className="flex items-start gap-2 px-1 pt-1">
        <Info size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
        <p className="text-ivory-600 text-xs leading-relaxed">
          Do not replace actual Bible reading with summaries. Open your Bible and read the passage for yourself.
        </p>
      </div>
    </div>
  );
}
