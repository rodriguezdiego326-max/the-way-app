import { useState, useEffect, useCallback } from 'react';
import { X, BarChart3, DollarSign, Zap, AlertCircle, Clock, Cpu } from 'lucide-react';
import { vibrate, formatDate } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import { getAiUsageStats } from '@/lib/productionEngine';

interface Props {
  onBack: () => void;
}

export default function AIUsageDashboardScreen({ onBack }: Props) {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getAiUsageStats>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await getAiUsageStats();
      setStats(s);
    } catch {
      setError('Could not load AI usage data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">AI Usage</p><span className="w-10" />
      </header>
      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <BarChart3 size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">AI USAGE</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Request volume, cost, and reliability.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading usage data..." />}
          {error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && stats && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={Zap} label="Total Requests" value={String(stats.totalRequests)} />
                <StatCard icon={DollarSign} label="Est. Cost" value={`$${stats.totalCost.toFixed(4)}`} />
                <StatCard icon={AlertCircle} label="Failure Rate" value={`${(stats.failureRate * 100).toFixed(1)}%`} alert={stats.failureRate > 0.1} />
                <StatCard icon={Clock} label="Avg Latency" value={`${stats.avgLatency.toFixed(0)}ms`} />
                <StatCard icon={Cpu} label="Input Tokens" value={stats.totalInputTokens.toLocaleString()} />
                <StatCard icon={Cpu} label="Output Tokens" value={stats.totalOutputTokens.toLocaleString()} />
              </div>

              {stats.byModel.length > 0 && (
                <div className="premium-card p-4">
                  <p className="ui-label mb-3">By Model</p>
                  <div className="space-y-2">
                    {stats.byModel.map(m => (
                      <div key={m.model} className="flex items-center justify-between text-xs">
                        <span className="text-ivory-300 font-mono">{m.model}</span>
                        <div className="flex gap-3">
                          <span className="text-ivory-500">{m.count} req</span>
                          <span className="text-ivory-400">${m.cost.toFixed(4)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.recent.length > 0 && (
                <div className="premium-card p-4">
                  <p className="ui-label mb-3">Recent Requests</p>
                  <div className="space-y-1">
                    {stats.recent.slice(0, 10).map(r => (
                      <div key={r.id} className="flex items-center justify-between text-xs py-1">
                        <span className="text-ivory-400">{r.feature || r.model || 'request'}</span>
                        <div className="flex gap-3">
                          <span className={r.success ? 'text-sage-400' : 'text-error'}>{r.success ? 'OK' : 'FAIL'}</span>
                          <span className="text-ivory-600">{formatDate(r.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-ivory-600 text-xs leading-relaxed px-1">Private prompt content is never logged. Only metadata: model, tokens, cost, latency, and success/failure.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, alert }: { icon: typeof Zap; label: string; value: string; alert?: boolean }) {
  return (
    <div className={`premium-card p-3 ${alert ? 'border-error/20' : ''}`}>
      <Icon size={14} className={alert ? 'text-error' : 'text-ivory-400'} />
      <p className={`text-lg font-serif mt-2 ${alert ? 'text-error' : 'text-ivory-100'}`}>{value}</p>
      <p className="text-ivory-600 text-xs">{label}</p>
    </div>
  );
}
