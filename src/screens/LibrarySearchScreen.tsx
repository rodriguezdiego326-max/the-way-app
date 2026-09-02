import { useState } from 'react';
import {
  X, Search, BookOpen, Landmark, Scroll, Users, Sparkles, Info, Filter, ChevronDown,
} from 'lucide-react';
import { vibrate } from '@/lib/utils';
import ViewSources from '@/components/ViewSources';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import { generateRAGAnswer, retrieveSources, emptyStateMessages, sourceTypeLabels } from '@/lib/libraryEngine';
import type { RAGAnswer, RetrievalResult, SourceType } from '@/lib/libraryTypes';

interface Props { onBack: () => void; }

const filterOptions: Array<{ value: SourceType | 'all'; label: string }> = [
  { value: 'all', label: 'All Sources' },
  { value: 'scripture', label: 'Scripture' },
  { value: 'confession', label: 'Confession' },
  { value: 'catechism', label: 'Catechism' },
  { value: 'historic_theologian', label: 'Historic Theology' },
  { value: 'modern_teacher', label: 'Modern Teaching' },
];

export default function LibrarySearchScreen({ onBack }: Props) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<RAGAnswer | null>(null);
  const [retrieval, setRetrieval] = useState<RetrievalResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState<SourceType | 'all'>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(true);

  async function handleSearch() {
    if (!query.trim()) return;
    vibrate(10);
    setSearching(true);
    setError(null);
    setResult(null);
    setRetrieval(null);

    try {
      const retrievalResult = await retrieveSources(query.trim());
      setRetrieval(retrievalResult);

      let filtered = retrievalResult;
      if (filter !== 'all') {
        filtered = {
          ...filtered,
          citations: filtered.citations.filter(c => c.source_type === filter),
          retrieved_sources: filtered.retrieved_sources.filter(rs => rs.source.source_type === filter),
        };
      }

      const answer = await generateRAGAnswer(query.trim());

      // Apply filter to answer citations too
      if (filter !== 'all') {
        answer.citations = answer.citations.filter(c => c.source_type === filter);
      }

      setResult(answer);
    } catch (err) {
      console.error('[LibrarySearch]', err);
      setError('We could not complete the search. Please try again.');
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Library Search</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Search size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Library Search</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Search SOLAPATH's verified theological library.</p>
            </div>
          </div>

          <div className="flex items-start gap-2 mb-4 px-3 py-2 rounded-xl bg-ink-800/40 border border-ink-700/30">
            <Info size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-500 text-xs leading-relaxed">Library Development Mode — showing actual metadata structure and retrieval behavior. No fabricated theological content.</p>
          </div>

          <div className="flex gap-2 mb-3">
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search: justification, providence, covenant..." className="input-field flex-1 text-sm" />
            <button onClick={() => { vibrate(5); setShowFilters(!showFilters); }} className="btn-secondary px-3">
              <Filter size={16} />
            </button>
            <button onClick={handleSearch} disabled={!query.trim() || searching} className="btn-primary px-4 disabled:opacity-40">
              <Search size={16} />
            </button>
          </div>

          {showFilters && (
            <div className="premium-card p-3 mb-4 animate-fade-in">
              <p className="ui-label mb-2">Filter by Source Type</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {filterOptions.map((f) => (
                  <button key={f.value} onClick={() => { vibrate(4); setFilter(f.value); }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all no-tap-highlight ${
                      filter === f.value ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
                    }`}>
                      {f.label}
                    </button>
                ))}
              </div>
              <button onClick={() => { vibrate(4); setVerifiedOnly(!verifiedOnly); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all no-tap-highlight ${
                  verifiedOnly ? 'bg-sage-500/10 border-sage-500/30 text-sage-400' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
                }`}>
                <div className={`w-3 h-3 rounded border-2 ${verifiedOnly ? 'bg-sage-400 border-sage-400' : 'border-ink-600'}`} />
                Verified sources only
              </button>
            </div>
          )}

          {searching && <LoadingState message="Searching verified library..." />}
          {error && <ErrorState message={error} onRetry={handleSearch} />}

          {result && !searching && !error && (
            <div className="animate-fade-in-up space-y-3">
              {result.is_development_mode && result.confidence === 'source_unavailable' && (
                <EmptyState message={result.short_answer || emptyStateMessages.no_sources} />
              )}

              {result.scripture_first && (
                <div className="premium-card p-4">
                  <div className="flex items-center gap-2 mb-2"><BookOpen size={15} className="text-gold-300" /><p className="text-sm text-ivory-100 font-medium">Scripture First</p></div>
                  <p className="text-ivory-300 text-sm leading-relaxed">{result.scripture_first}</p>
                </div>
              )}

              {result.confessional_witness && (
                <div className="premium-card p-4">
                  <div className="flex items-center gap-2 mb-2"><Scroll size={15} className="text-sage-400" /><p className="text-sm text-ivory-100 font-medium">Confessional Witness</p></div>
                  <p className="text-ivory-300 text-sm leading-relaxed">{result.confessional_witness}</p>
                </div>
              )}

              {result.historic_voices && (
                <div className="premium-card p-4">
                  <div className="flex items-center gap-2 mb-2"><Landmark size={15} className="text-sage-400" /><p className="text-sm text-ivory-100 font-medium">Historic Voices</p></div>
                  <p className="text-ivory-300 text-sm leading-relaxed">{result.historic_voices}</p>
                </div>
              )}

              {result.modern_teaching && (
                <div className="premium-card p-4">
                  <div className="flex items-center gap-2 mb-2"><Users size={15} className="text-ivory-400" /><p className="text-sm text-ivory-100 font-medium">Modern Teaching</p></div>
                  <p className="text-ivory-300 text-sm leading-relaxed">{result.modern_teaching}</p>
                </div>
              )}

              {/* Rejected sources (for transparency) */}
              {retrieval && retrieval.rejected_sources.length > 0 && (
                <div className="premium-card p-3 border-clay-500/20">
                  <p className="ui-label mb-1 text-clay-400">Rejected / Unverified Sources</p>
                  {retrieval.rejected_sources.map((r, i) => (
                    <p key={i} className="text-ivory-600 text-xs leading-relaxed">{r.reason}</p>
                  ))}
                </div>
              )}

              {/* Sources */}
              {result.citations.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2"><Sparkles size={14} className="text-gold-400" /><p className="ui-label">Sources</p></div>
                  <ViewSources citations={result.citations} confidence={result.confidence} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
