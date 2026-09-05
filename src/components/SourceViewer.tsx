import { X, ShieldCheck, ExternalLink, BookOpen, Landmark, Lightbulb } from 'lucide-react';
import type { SourceCitation } from '@/lib/intelligenceTypes';

interface SourceViewerProps {
  sources: SourceCitation[];
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: typeof BookOpen }> = {
  confession: { label: 'Confessional Documents', icon: BookOpen },
  catechism: { label: 'Confessional Documents', icon: BookOpen },
  historic_theologian: { label: 'Historical Theologians', icon: Landmark },
  modern_teacher: { label: 'Selected Teachers', icon: Lightbulb },
  scripture: { label: 'Scripture Sources', icon: BookOpen },
};

function dedupSources(sources: SourceCitation[]): SourceCitation[] {
  const seen = new Set<string>();
  const result: SourceCitation[] = [];
  for (const s of sources) {
    const key = `${s.source_id}-${s.section || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(s);
  }
  return result;
}

export default function SourceViewer({ sources, onClose }: SourceViewerProps) {
  const verifiedSources = sources.filter((s) => s.verified);
  // Unverified sources are never shown to users in Build 52+

  const grouped = verifiedSources.reduce<Record<string, SourceCitation[]>>((acc, s) => {
    const key = s.source_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const categoryOrder = ['confession', 'catechism', 'historic_theologian', 'modern_teacher', 'scripture'];
  const visibleCategories = categoryOrder.filter((cat) => grouped[cat]?.length > 0);

  return (
    <div className="fixed inset-0 z-[80] bg-ink-950/90 backdrop-blur-sm flex items-end justify-center">
      <div className="w-full max-w-md max-h-[80vh] overflow-y-auto bg-ink-900 border border-ink-700/50 rounded-t-3xl animate-slide-up">
        <div className="sticky top-0 bg-ink-900/95 backdrop-blur-md px-6 py-4 border-b border-ink-700/40 flex items-center justify-between">
          <h2 className="font-serif text-xl text-ivory-50">Sources</h2>
          <button onClick={onClose} className="btn-ghost">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          {sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-ink-800/50 border border-ink-700/40 flex items-center justify-center mb-5">
                <BookOpen size={22} className="text-ivory-600" />
              </div>
              <p className="text-ivory-400 text-sm font-medium mb-2">
                Verified sources are still being added to SOLAPATH's library.
              </p>
              <p className="text-ivory-600 text-xs leading-relaxed max-w-xs">
                SOLAPATH will never fabricate citations or quotations. When verified theological sources are connected, they will appear here with full attribution.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {visibleCategories.map((cat) => {
                const meta = CATEGORY_LABELS[cat] || { label: cat.replace(/_/g, ' '), icon: BookOpen };
                const Icon = meta.icon;
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-1.5 mb-3">
                      <Icon size={13} className="text-gold-400/70 shrink-0" />
                      <p className="ui-label">{meta.label}</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      {dedupSources(grouped[cat]).map((source, i) => (
                        <div key={`${source.source_id}-${source.section}-${i}`} className="premium-card p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-sage-500/10 border border-sage-500/20 flex items-center justify-center shrink-0">
                              <ShieldCheck size={15} className="text-sage-400" />
                            </div>
                            <div className="flex-1">
                              {source.author && (
                                <p className="text-ivory-100 text-sm font-medium">{source.author}</p>
                              )}
                              {source.work && (
                                <p className="text-ivory-300 text-xs mt-0.5 italic">{source.work}</p>
                              )}
                              {source.section && (
                                <p className="text-ivory-500 text-xs mt-1">{source.section}</p>
                              )}
                              {source.citation && (
                                <p className="text-ivory-600 text-xs mt-1 font-mono">{source.citation}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] uppercase tracking-wider text-sage-400 font-medium">
                                  {source.source_type.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[10px] text-sage-400 flex items-center gap-1">
                                  <ShieldCheck size={10} /> Verified
                                </span>
                              </div>
                              {source.url && (
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gold-300 text-xs mt-2 flex items-center gap-1 hover:text-gold-200 transition-colors"
                                >
                                  <ExternalLink size={11} />
                                  View reference
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Unverified sources are never displayed to users */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
