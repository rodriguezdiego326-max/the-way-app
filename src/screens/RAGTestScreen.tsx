import { useState } from 'react';
import {
  X, FlaskConical, Check, AlertCircle, Info, Sparkles, BookOpen, ChevronRight, Search,
} from 'lucide-react';
import { vibrate } from '@/lib/utils';
import ViewSources from '@/components/ViewSources';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import { ragTestQueries, retrieveSources, generateRAGAnswer, emptyStateMessages } from '@/lib/libraryEngine';
import type { RAGAnswer, RetrievalResult } from '@/lib/libraryTypes';

interface Props { onBack: () => void; }

interface TestResult {
  answer: RAGAnswer;
  retrieval: RetrievalResult;
}

export default function RAGTestScreen({ onBack }: Props) {
  const [results, setResults] = useState<Record<string, TestResult | null>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function runTest(testId: string, query: string) {
    vibrate(10);
    setRunning(testId);
    setErrors((prev) => ({ ...prev, [testId]: '' }));

    try {
      const retrieval = await retrieveSources(query);
      const answer = await generateRAGAnswer(query);
      setResults((prev) => ({ ...prev, [testId]: { answer, retrieval } }));
    } catch (err) {
      console.error('[RAGTest]', testId, err);
      setErrors((prev) => ({ ...prev, [testId]: 'Test failed. Could not complete retrieval.' }));
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">RAG Test Suite</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <FlaskConical size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">RAG Test Queries</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Internal tests for retrieval-augmented generation behavior.</p>
            </div>
          </div>

          <div className="flex items-start gap-2 mb-4 px-3 py-2 rounded-xl bg-ink-800/40 border border-ink-700/30">
            <Info size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-500 text-xs leading-relaxed">Library Development Mode — tests show actual retrieval behavior. No fabricated sources. Honest empty states preferred over invented content.</p>
          </div>

          <div className="space-y-3">
            {ragTestQueries.map((test) => {
              const result = results[test.id];
              const isRunning = running === test.id;
              const testError = errors[test.id];
              return (
                <div key={test.id} className="premium-card p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <p className="text-ivory-100 font-medium text-sm">{test.query}</p>
                      <p className="text-ivory-500 text-xs mt-0.5">{test.description}</p>
                    </div>
                    <button onClick={() => runTest(test.id, test.query)} disabled={isRunning}
                      className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40 shrink-0">
                      {isRunning ? 'Running...' : 'Run'}
                    </button>
                  </div>

                  <div className="mt-2 px-3 py-2 rounded-xl bg-ink-800/40 border border-ink-700/30">
                    <p className="text-ivory-600 text-xs leading-relaxed"><span className="text-ivory-500 font-medium">Expected:</span> {test.expected_behavior}</p>
                  </div>

                  {isRunning && <LoadingState message="Running retrieval..." />}

                  {testError && <ErrorState message={testError} />}

                  {result && !isRunning && !testError && (
                    <div className="mt-3 animate-fade-in space-y-2">
                      {/* Full debug pipeline */}
                      <div className="premium-card p-3 bg-ink-800/30">
                        <p className="ui-label mb-1">Pipeline</p>
                        <div className="space-y-1">
                          <PipelineRow label="Intent" value={result.retrieval.detected_intent} />
                          <PipelineRow label="Doctrine" value={result.retrieval.detected_doctrine.join(', ') || 'none detected'} />
                          <PipelineRow label="Retrieved" value={`${result.retrieval.retrieved_sources.length} source(s)`} />
                          <PipelineRow label="Rejected" value={`${result.retrieval.rejected_sources.length} source(s)`} />
                          <PipelineRow label="Context" value={result.retrieval.context_summary} />
                          <PipelineRow label="Validation" value={result.answer.confidence} />
                        </div>
                      </div>

                      {/* Rejected sources */}
                      {result.retrieval.rejected_sources.length > 0 && (
                        <div className="premium-card p-3 border-clay-500/20">
                          <p className="ui-label mb-1 text-clay-400">Rejected / Unverified</p>
                          {result.retrieval.rejected_sources.map((r, i) => (
                            <p key={i} className="text-ivory-600 text-xs leading-relaxed">{r.reason}</p>
                          ))}
                        </div>
                      )}

                      {/* Answer sections */}
                      {result.answer.confidence === 'source_unavailable' ? (
                        <EmptyState message={result.answer.short_answer || emptyStateMessages.source_unavailable} />
                      ) : (
                        <>
                          {result.answer.scripture_first && (
                            <div className="premium-card p-3">
                              <div className="flex items-center gap-2 mb-1"><BookOpen size={13} className="text-gold-300" /><p className="text-xs text-ivory-100 font-medium">Scripture</p></div>
                              <p className="text-ivory-300 text-xs leading-relaxed">{result.answer.scripture_first}</p>
                            </div>
                          )}
                          {result.answer.confessional_witness && (
                            <div className="premium-card p-3">
                              <div className="flex items-center gap-2 mb-1"><BookOpen size={13} className="text-sage-400" /><p className="text-xs text-ivory-100 font-medium">Confessional Witness</p></div>
                              <p className="text-ivory-300 text-xs leading-relaxed">{result.answer.confessional_witness}</p>
                            </div>
                          )}
                          {result.answer.historic_voices && (
                            <div className="premium-card p-3">
                              <div className="flex items-center gap-2 mb-1"><BookOpen size={13} className="text-sage-400" /><p className="text-xs text-ivory-100 font-medium">Historic Theology</p></div>
                              <p className="text-ivory-300 text-xs leading-relaxed">{result.answer.historic_voices}</p>
                            </div>
                          )}
                        </>
                      )}

                      {/* Citations */}
                      {result.answer.citations.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2"><Sparkles size={13} className="text-gold-400" /><p className="ui-label">Citations</p></div>
                          <ViewSources citations={result.answer.citations} confidence={result.answer.confidence} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-start gap-2 mt-5 px-1">
            <BookOpen size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">AI is the servant. Scripture is the authority.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-ivory-600 text-[10px] font-medium uppercase tracking-wider shrink-0 w-20">{label}</span>
      <span className="text-ivory-400 text-[10px] leading-relaxed">{value}</span>
    </div>
  );
}
