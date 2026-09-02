import { useState, useEffect } from 'react';
import { X, FlaskConical, Check, AlertCircle, BarChart3, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate, formatRelative } from '@/lib/utils';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import type { RegressionTest, RegressionTestSummary } from '@/lib/intelligenceTypes';

interface Props { onBack: () => void; }

export default function QADashboardScreen({ onBack }: Props) {
  const [tests, setTests] = useState<RegressionTest[]>([]);
  const [summary, setSummary] = useState<RegressionTestSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => { loadTests(); }, []);

  async function loadTests() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('regression_tests')
        .select('*')
        .order('category', { ascending: true });
      if (err) throw err;
      const allTests = (data as RegressionTest[]) || [];
      setTests(allTests);

      // Build summary
      const total = allTests.length;
      const passed = allTests.filter(t => t.last_status === 'pass').length;
      const failed = allTests.filter(t => t.last_status === 'fail').length;
      const pending = allTests.filter(t => t.last_status === 'pending').length;
      setSummary({
        total, passed, failed, pending,
        source_failures: 0, attribution_failures: 0,
        quote_failures: 0, scripture_context_failures: 0,
        safety_failures: 0, memory_failures: 0, schema_failures: 0,
      });
    } catch (err) {
      console.error('[QADashboard]', err);
      setError('Could not load regression tests.');
    } finally {
      setLoading(false);
    }
  }

  const categories = [...new Set(tests.map(t => t.category))];
  const filteredTests = selectedCategory ? tests.filter(t => t.category === selectedCategory) : tests;

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Theological QA</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <BarChart3 size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Theological QA Dashboard</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Regression test metrics and theological quality tracking.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading regression tests..." />}
          {error && <ErrorState message={error} onRetry={loadTests} />}

          {!loading && !error && summary && (
            <>
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <MetricCard label="Total Tests" value={summary.total} />
                <MetricCard label="Passed" value={summary.passed} color="sage" />
                <MetricCard label="Failed" value={summary.failed} color="error" />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <MetricCard label="Pending" value={summary.pending} color="ivory" />
                <MetricCard label="Pass Rate" value={summary.total > 0 ? `${Math.round((summary.passed / summary.total) * 100)}%` : '—'} color="gold" />
              </div>

              {/* Category filter */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                <button onClick={() => { vibrate(4); setSelectedCategory(null); }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all no-tap-highlight ${
                    !selectedCategory ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
                  }`}>All</button>
                {categories.map((cat) => (
                  <button key={cat} onClick={() => { vibrate(4); setSelectedCategory(cat); }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all no-tap-highlight ${
                      selectedCategory === cat ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
                    }`}>{cat}</button>
                ))}
              </div>

              {/* Tests */}
              {!loading && filteredTests.length === 0 && <EmptyState message="No regression tests found." />}

              <div className="space-y-2">
                {filteredTests.map((t) => (
                  <div key={t.test_id} className={`premium-card p-3 ${t.last_status === 'pass' ? 'border-sage-500/20' : t.last_status === 'fail' ? 'border-error/20' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        t.last_status === 'pass' ? 'bg-sage-500/10 border border-sage-500/20' :
                        t.last_status === 'fail' ? 'bg-error/10 border border-error/20' :
                        'bg-ink-700/40 border border-ink-600/40'
                      }`}>
                        {t.last_status === 'pass' && <Check size={11} className="text-sage-400" />}
                        {t.last_status === 'fail' && <AlertCircle size={11} className="text-error" />}
                        {t.last_status === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-ivory-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-ivory-100 text-xs font-medium truncate">{t.query}</p>
                        <p className="text-ivory-600 text-[10px] mt-0.5">{t.test_id} · {t.category}</p>
                        {t.last_detail && <p className="text-ivory-500 text-[10px] mt-1 leading-relaxed">{t.last_detail}</p>}
                        {t.last_run_at && <p className="text-ivory-700 text-[9px] mt-0.5">{formatRelative(t.last_run_at)}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  const colorClass = color === 'sage' ? 'text-sage-400' : color === 'error' ? 'text-error' : color === 'gold' ? 'text-gold-300' : 'text-ivory-400';
  return (
    <div className="premium-card p-3 text-center">
      <p className={`text-xl font-serif ${colorClass}`}>{value}</p>
      <p className="text-ivory-600 text-[10px] mt-1">{label}</p>
    </div>
  );
}
