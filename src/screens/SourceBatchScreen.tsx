import { useState, useEffect } from 'react';
import { X, Package, Check, AlertCircle, Layers, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate, formatRelative } from '@/lib/utils';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import type { SourceBatch } from '@/lib/intelligenceTypes';

interface Props { onBack: () => void; }

export default function SourceBatchScreen({ onBack }: Props) {
  const [batches, setBatches] = useState<SourceBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadBatches(); }, []);

  async function loadBatches() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('source_batches')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setBatches((data as SourceBatch[]) || []);
    } catch (err) {
      console.error('[SourceBatch]', err);
      setError('Could not load source batches.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Source Batches</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Package size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Source Batch QA</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Ingestion batch tracking and release readiness.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading source batches..." />}
          {error && <ErrorState message={error} onRetry={loadBatches} />}

          {!loading && !error && batches.length === 0 && (
            <EmptyState message="No source batches recorded yet." />
          )}

          {!loading && !error && batches.length > 0 && (
            <div className="space-y-3">
              {batches.map((b) => (
                <div key={b.id} className={`premium-card p-4 ${b.release_ready ? 'border-sage-500/20' : ''}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-ivory-100 font-medium text-sm">{b.batch_label}</p>
                      <p className="text-ivory-600 text-xs mt-0.5">{b.batch_type} · {formatRelative(b.created_at)}</p>
                    </div>
                    {b.release_ready ? (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-sage-500/10 border border-sage-500/20 text-sage-400 text-[10px] font-medium">
                        <Check size={10} /> Release Ready
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-ink-800/40 border border-ink-700/40 text-ivory-600 text-[10px] font-medium">
                        Not Ready
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <Stat label="Sources Added" value={b.sources_added} />
                    <Stat label="Verified" value={b.sources_verified} color="sage" />
                    <Stat label="Rejected" value={b.sources_rejected} color="error" />
                    <Stat label="Chunks" value={b.chunks_created} />
                    <Stat label="Tests Run" value={b.tests_run} />
                    <Stat label="Retrieval Failures" value={b.retrieval_failures} color="error" />
                    <Stat label="Attribution Failures" value={b.attribution_failures} color="error" />
                    <Stat label="Doctrines" value={b.doctrines_covered?.length || 0} color="gold" />
                  </div>

                  {b.doctrines_covered && b.doctrines_covered.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {b.doctrines_covered.slice(0, 8).map((d, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-sage-500/10 border border-sage-500/20 text-sage-400 text-[9px]">{d}</span>
                      ))}
                      {b.doctrines_covered.length > 8 && (
                        <span className="px-1.5 py-0.5 rounded bg-ink-700/40 border border-ink-600/40 text-ivory-600 text-[9px]">+{b.doctrines_covered.length - 8} more</span>
                      )}
                    </div>
                  )}

                  {b.reviewer_notes && (
                    <p className="text-ivory-500 text-xs mt-2 leading-relaxed italic">{b.reviewer_notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <BookOpen size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">A smaller theological library SOLAPATH can trust is better than a massive library it cannot verify.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  const colorClass = color === 'sage' ? 'text-sage-400' : color === 'error' ? 'text-error' : color === 'gold' ? 'text-gold-300' : 'text-ivory-300';
  return (
    <div className="px-2 py-1.5 rounded-lg bg-ink-800/40 border border-ink-700/30">
      <p className={`text-sm font-medium ${colorClass}`}>{value}</p>
      <p className="text-ivory-600 text-[9px] mt-0.5">{label}</p>
    </div>
  );
}
