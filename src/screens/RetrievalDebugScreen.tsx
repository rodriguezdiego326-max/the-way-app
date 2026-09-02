import { useEffect, useState } from 'react';
import { X, Shield, Search, ChevronRight, Check, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate, formatRelative } from '@/lib/utils';
import { authorityLevelLabels, sourceTypeLabels } from '@/lib/libraryEngine';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import type { RetrievalLogEntry } from '@/lib/libraryTypes';

interface Props { onBack: () => void; }

export default function RetrievalDebugScreen({ onBack }: Props) {
  const [logs, setLogs] = useState<RetrievalLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<RetrievalLogEntry | null>(null);

  useEffect(() => { loadLogs(); }, []);

  async function loadLogs() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('retrieval_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      if (err) throw err;
      setLogs((data as RetrievalLogEntry[]) || []);
    } catch (err) {
      console.error('[RetrievalDebug] load error:', err);
      setError('Could not load retrieval logs from the database.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={selectedLog ? () => setSelectedLog(null) : onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">{selectedLog ? 'Retrieval Detail' : 'Retrieval Debug'}</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          {!selectedLog ? (
            <>
              <div className="flex items-start gap-2 mb-4 px-3 py-2 rounded-xl bg-clay-500/10 border border-clay-500/20">
                <Shield size={13} className="text-clay-400 shrink-0 mt-0.5" />
                <p className="text-ivory-400 text-xs leading-relaxed">Admin-only debug view. Shows retrieval pipeline steps for theological QA. Does not expose private user memories.</p>
              </div>

              {loading && <LoadingState message="Loading retrieval logs..." />}
              {error && <ErrorState message={error} onRetry={loadLogs} />}

              {!loading && !error && logs.length === 0 && (
                <EmptyState message="No retrieval logs yet. Run a Library Search or RAG Test to generate logs." />
              )}

              {!loading && !error && logs.length > 0 && (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <button key={log.id} onClick={() => { vibrate(6); setSelectedLog(log); }}
                      className="premium-card p-4 w-full text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300">
                      <p className="text-ivory-100 text-sm font-medium">{log.query}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {log.detected_intent && <span className="text-ivory-500 text-xs">{log.detected_intent}</span>}
                        {log.detected_doctrine && log.detected_doctrine.length > 0 && (
                          <span className="text-ivory-600 text-xs">· {log.detected_doctrine.length} doctrines</span>
                        )}
                      </div>
                      <p className="text-ivory-600 text-xs mt-1">{formatRelative(log.created_at)}</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <DebugSection label="User Query" content={selectedLog.query} />
              <DebugSection label="Intent" content={selectedLog.detected_intent || '—'} />
              <DebugSection label="Doctrine" content={(selectedLog.detected_doctrine || []).join(', ') || '—'} />
              <DebugSection label="Retrieved Source IDs" content={(selectedLog.retrieved_source_ids || []).join(', ') || 'None'} />
              <DebugSection label="Rejected Source IDs" content={(selectedLog.rejected_source_ids || []).join(', ') || 'None'} />
              <DebugSection label="Final Context" content={selectedLog.final_context_summary || '—'} />
              <DebugSection label="Validation Result" content={selectedLog.theological_validation || '—'} />

              {selectedLog.citations_generated && (
                <div className="premium-card p-4">
                  <p className="ui-label mb-2">Citations Generated</p>
                  <pre className="text-ivory-500 text-[10px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.citations_generated, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DebugSection({ label, content }: { label: string; content: string }) {
  return (
    <div className="premium-card p-4">
      <p className="ui-label mb-1">{label}</p>
      <p className="text-ivory-300 text-sm leading-relaxed break-words">{content}</p>
    </div>
  );
}
