import { useState, useEffect, useCallback } from 'react';
import { X, BookOpen, Lightbulb, Scroll, Landmark, FileText, ChevronRight, Sparkles } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { LoadingState } from '@/components/States';
import { retrieveSources } from '@/lib/libraryEngine';
import type { Sermon } from '@/lib/togetherTypes';
import type { RAGCitation } from '@/lib/intelligenceTypes';

interface Props {
  sermon: Sermon;
  onBack: () => void;
}

export default function SermonCompanionScreen({ sermon, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [citations, setCitations] = useState<RAGCitation[]>([]);
  const [ran, setRan] = useState(false);

  const runRAG = useCallback(async () => {
    setLoading(true);
    try {
      const result = await retrieveSources(sermon.passage);
      setCitations(result.citations);
    } catch { /* ignore */ } finally {
      setLoading(false);
      setRan(true);
    }
  }, [sermon.passage]);

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Sermon Companion</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <BookOpen size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Sermon Companion</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Go deeper into {sermon.passage} with verified theological sources.</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-4">
            <CompanionAction icon={BookOpen} label="Review the Text" desc="Read the passage again carefully" />
            <CompanionAction icon={Lightbulb} label="Understand Context" desc="Historical and literary context" />
            <CompanionAction icon={Scroll} label="Identify Doctrines" desc="Key theological themes" />
            <CompanionAction icon={Landmark} label="Explore Confessional Connections" desc="How confessions address this passage" />
            <CompanionAction icon={FileText} label="Create Questions for Your Pastor" desc="Thoughtful follow-up questions" />
          </div>

          <button onClick={runRAG} disabled={loading} className="btn-primary w-full mb-4 disabled:opacity-40">
            <BookOpen size={16} /> {loading ? 'Searching verified sources...' : 'Explore Verified Sources'}
          </button>

          {loading && <LoadingState message="Searching verified theological library..." />}

          {ran && !loading && citations.length > 0 && (
            <>
              <p className="ui-label mb-3">Verified Sources for {sermon.passage}</p>
              <div className="flex flex-col gap-2 mb-4">
                {citations.map((c) => (
                  <div key={c.source_id} className="premium-card p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                        c.authority_level === 1 ? 'bg-gold-500/10 text-gold-300' :
                        c.authority_level === 3 ? 'bg-sage-500/10 text-sage-400' :
                        'bg-ink-700/40 text-ivory-400'
                      }`}>
                        {c.source_type}
                      </span>
                      {c.verified && <span className="text-[10px] text-sage-400">Verified</span>}
                    </div>
                    <p className="text-ivory-200 text-sm">{c.display_title}</p>
                    {c.display_author && <p className="text-ivory-600 text-xs">{c.display_author}</p>}
                  </div>
                ))}
              </div>
            </>
          )}

          {ran && !loading && citations.length === 0 && (
            <div className="premium-card p-4 text-center mb-4">
              <p className="text-ivory-500 text-xs">No verified sources found for this passage. SOLAPATH returns no source rather than a false source.</p>
            </div>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              SOLAPATH does not automatically label a sermon biblical or unbiblical based solely on incomplete notes. Sermon content remains labeled CHURCH CONTENT.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompanionAction({ icon: Icon, label, desc }: { icon: typeof BookOpen; label: string; desc: string }) {
  return (
    <div className="premium-card p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-ivory-400" />
      </div>
      <div className="flex-1">
        <p className="text-ivory-100 font-medium text-sm">{label}</p>
        <p className="text-ivory-600 text-xs">{desc}</p>
      </div>
      <ChevronRight size={16} className="text-ivory-600 shrink-0" />
    </div>
  );
}
