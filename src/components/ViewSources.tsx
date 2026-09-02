import { BookOpen, Landmark, Scroll, Users, Sparkles, Check, AlertCircle } from 'lucide-react';
import type { Citation, SourceType } from '@/lib/libraryTypes';
import { authorityLevelLabels, sourceTypeLabels } from '@/lib/libraryEngine';

interface ViewSourcesProps {
  citations: Citation[];
  confidence?: 'verified' | 'partially_supported' | 'source_unavailable';
}

const groupOrder: { label: string; types: SourceType[]; icon: typeof BookOpen }[] = [
  { label: 'Scripture', types: ['scripture'], icon: BookOpen },
  { label: 'Creeds', types: ['creed'], icon: Scroll },
  { label: 'Confessions & Catechisms', types: ['confession', 'catechism'], icon: Landmark },
  { label: 'Historic Theology', types: ['historic_theologian'], icon: Scroll },
  { label: 'Modern Teaching', types: ['modern_teacher'], icon: Users },
  { label: 'SOLAPATH Editorial', types: ['editorial', 'family_discipleship', 'apologetics', 'church_history', 'biblical_theology'], icon: Sparkles },
];

export default function ViewSources({ citations, confidence }: ViewSourcesProps) {
  if (citations.length === 0) {
    return (
      <div className="premium-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle size={15} className="text-ivory-500" />
          <p className="text-sm text-ivory-100 font-medium">Sources</p>
        </div>
        <p className="text-ivory-600 text-xs italic">
          {confidence === 'source_unavailable'
            ? 'SOLAPATH does not currently have a verified source for this claim.'
            : 'No verified sources available for this topic yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Confidence badge */}
      {confidence && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
          confidence === 'verified'
            ? 'bg-sage-500/10 border-sage-500/20 text-sage-400'
            : confidence === 'partially_supported'
            ? 'bg-gold-500/10 border-gold-500/20 text-gold-300'
            : 'bg-ink-800/40 border-ink-700/40 text-ivory-500'
        }`}>
          {confidence === 'verified' ? <Check size={14} /> : <AlertCircle size={14} />}
          <p className="text-xs font-medium">
            {confidence === 'verified' && 'Verified — Source directly supports the claim.'}
            {confidence === 'partially_supported' && 'Partially Supported — Source is relevant but does not fully establish the claim.'}
            {confidence === 'source_unavailable' && 'Source Unavailable — SOLAPATH does not currently have a verified source.'}
          </p>
        </div>
      )}

      {/* Grouped citations */}
      {groupOrder.map((group) => {
        const groupCitations = citations.filter((c) => group.types.includes(c.source_type));
        if (groupCitations.length === 0) return null;

        return (
          <div key={group.label} className="animate-fade-in-up">
            <div className="flex items-center gap-2 mb-2">
              <group.icon size={14} className="text-gold-400" />
              <p className="ui-label">{group.label}</p>
            </div>
            <div className="space-y-2">
              {groupCitations.map((c, i) => (
                <div key={i} className="premium-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-ivory-100 text-sm font-medium">{c.display_title}</p>
                      {c.display_author && c.display_author !== sourceTypeLabels[c.source_type] && (
                        <p className="text-ivory-400 text-xs mt-0.5">{c.display_author}</p>
                      )}
                      {c.chapter_section && (
                        <p className="text-ivory-500 text-xs mt-0.5">{c.chapter_section}</p>
                      )}
                      {c.page && (
                        <p className="text-ivory-600 text-xs">p. {c.page}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {c.verified && (
                        <span className="flex items-center gap-1 text-sage-400 text-[10px] font-medium">
                          <Check size={10} /> Verified
                        </span>
                      )}
                      <span className={`text-[10px] font-medium ${c.authority_level <= 2 ? 'text-gold-400' : c.authority_level <= 4 ? 'text-sage-400' : 'text-ivory-500'}`}>
                        {authorityLevelLabels[c.authority_level]}
                      </span>
                    </div>
                  </div>
                  {c.source_link && (
                    <a href={c.source_link} target="_blank" rel="noopener noreferrer" className="text-gold-400 text-xs mt-1 hover:text-gold-300 transition-colors">
                      View source →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Principle */}
      <div className="flex items-start gap-2 px-1 pt-2">
        <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
        <p className="text-ivory-600 text-xs leading-relaxed">
          AI generated the explanation. Here are the verified sources. Examine them for yourself. AI is the servant. Scripture is the authority.
        </p>
      </div>
    </div>
  );
}
