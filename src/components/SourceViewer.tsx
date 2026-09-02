import { X, ShieldCheck, ShieldAlert, ExternalLink, BookOpen } from 'lucide-react';
import type { SourceCitation } from '@/lib/intelligenceTypes';

interface SourceViewerProps {
  sources: SourceCitation[];
  onClose: () => void;
}

export default function SourceViewer({ sources, onClose }: SourceViewerProps) {
  const verifiedSources = sources.filter((s) => s.verified);
  const unverifiedSources = sources.filter((s) => !s.verified);

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
            <div className="flex flex-col gap-3">
              {verifiedSources.length > 0 && (
                <>
                  <p className="ui-label mb-1">Verified Sources</p>
                  {verifiedSources.map((source, i) => (
                    <div key={i} className="premium-card p-4">
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
                </>
              )}

              {unverifiedSources.length > 0 && (
                <>
                  <p className="ui-label mt-4 mb-1">Pending Verification</p>
                  {unverifiedSources.map((source, i) => (
                    <div key={i} className="premium-card p-4 opacity-60">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-clay-500/10 border border-clay-500/20 flex items-center justify-center shrink-0">
                          <ShieldAlert size={15} className="text-clay-400" />
                        </div>
                        <div className="flex-1">
                          {source.author && (
                            <p className="text-ivory-200 text-sm">{source.author}</p>
                          )}
                          {source.work && (
                            <p className="text-ivory-400 text-xs mt-0.5 italic">{source.work}</p>
                          )}
                          <span className="text-[10px] uppercase tracking-wider text-clay-400 font-medium mt-1 block">
                            Pending verification
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
