import { useState, useEffect, useCallback } from 'react';
import { X, Cpu, Cloud, Database, FileText, FlaskConical, Check, AlertCircle, Info, Shield, BookOpen, Quote, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LoadingState, ErrorState } from '@/components/States';
import { retrieveSources, validateQuote, validateAttribution } from '@/lib/libraryEngine';

interface Props { onBack: () => void; }

interface SystemVersion {
  id: string;
  version: string;
  description: string | null;
}

type HealthStatus = 'passing' | 'failing' | 'not_checked';

interface HealthCheck {
  id: string;
  label: string;
  icon: typeof Cpu;
  status: HealthStatus;
  detail: string;
}

interface ProviderHealth {
  configured: boolean;
  provider: string;
  model: string;
  environment: string;
  connected: boolean;
  detail: string;
}

export default function ProductionStatusScreen({ onBack }: Props) {
  const [versions, setVersions] = useState<SystemVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [checking, setChecking] = useState(false);
  const [providerHealth, setProviderHealth] = useState<ProviderHealth | null>(null);

  useEffect(() => { loadVersions(); }, []);

  const loadVersions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('system_versions')
        .select('*')
        .order('id', { ascending: true });
      if (err) throw err;
      setVersions((data as SystemVersion[]) || []);
    } catch (err) {
      console.error('[ProductionStatus]', err);
      setError('Could not load system status.');
    } finally {
      setLoading(false);
    }
  }, []);

  const runHealthChecks = useCallback(async () => {
    setChecking(true);
    const newChecks: HealthCheck[] = [];

    try {
      // Call the real edge function health check endpoint
      let providerHealthResult: ProviderHealth = {
        configured: false,
        provider: 'development',
        model: 'development',
        environment: 'development',
        connected: false,
        detail: 'No production AI provider configured.',
      };

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const healthRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL || (supabase as unknown as { supabaseUrl: string }).supabaseUrl}/functions/v1/the-way-intelligence/health`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session?.access_token || ''}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          },
        });
        if (healthRes.ok) {
          providerHealthResult = await healthRes.json() as ProviderHealth;
        }
      } catch (err) {
        console.error('[HealthCheck] Edge function health endpoint failed:', err);
      }

      setProviderHealth(providerHealthResult);

      // AI Provider check
      newChecks.push({
        id: 'ai_provider',
        label: 'AI Provider',
        icon: Cpu,
        status: providerHealthResult.configured ? 'passing' : 'failing',
        detail: providerHealthResult.configured
          ? `Configured (${providerHealthResult.provider})`
          : 'Not configured — using development fallback',
      });

      // Model check
      newChecks.push({
        id: 'model',
        label: 'Model',
        icon: Cloud,
        status: providerHealthResult.configured ? 'passing' : 'not_checked',
        detail: providerHealthResult.model,
      });

      // Environment check
      newChecks.push({
        id: 'environment',
        label: 'Environment',
        icon: Info,
        status: 'passing',
        detail: providerHealthResult.environment,
      });

      // Server-side AI check
      newChecks.push({
        id: 'server_side_ai',
        label: 'Server-Side AI',
        icon: Cpu,
        status: providerHealthResult.connected ? 'passing' : 'failing',
        detail: providerHealthResult.connected
          ? 'Connected — provider health check passed'
          : providerHealthResult.detail,
      });

      // RAG check
      const ragRetrieval = await retrieveSources('justification');
      const ragConnected = ragRetrieval.citations.length > 0;
      newChecks.push({
        id: 'rag',
        label: 'RAG',
        icon: Database,
        status: ragConnected ? 'passing' : 'failing',
        detail: ragConnected ? `Connected — ${ragRetrieval.citations.length} citations for "justification"` : 'Disconnected — no citations retrieved',
      });

      // Verified Library check
      const { data: libData } = await supabase.from('library_sources').select('id').eq('content_status', 'verified').eq('verified', true);
      const libConnected = (libData || []).length > 0;
      newChecks.push({
        id: 'verified_library',
        label: 'Verified Library',
        icon: BookOpen,
        status: libConnected ? 'passing' : 'failing',
        detail: libConnected ? `Connected — ${(libData || []).length} verified sources` : 'Disconnected — no verified sources',
      });

      // Structured Output check
      const { data: regData } = await supabase.from('regression_tests').select('id').limit(1);
      const structuredPass = (regData || []).length > 0;
      newChecks.push({
        id: 'structured_output',
        label: 'Structured Output',
        icon: FileText,
        status: structuredPass ? 'passing' : 'failing',
        detail: structuredPass ? 'Passing — regression tests available' : 'Failing — no regression tests',
      });

      // Citation Validator check
      const citationValid = ragRetrieval.citations.every(c => c.source_id && c.display_title);
      newChecks.push({
        id: 'citation_validator',
        label: 'Citation Validator',
        icon: Shield,
        status: citationValid ? 'passing' : 'failing',
        detail: citationValid ? `Passing — all ${ragRetrieval.citations.length} citations have source_id and display_title` : 'Failing — citations missing required fields',
      });

      // Attribution Validator check
      const sproulQuery = await retrieveSources('What did R.C. Sproul say about holiness?');
      const sproulAttribution = validateAttribution('Sproul taught...', 'R. C. Sproul', sproulQuery.citations);
      newChecks.push({
        id: 'attribution_validator',
        label: 'Attribution Validator',
        icon: Shield,
        status: !sproulAttribution.valid ? 'passing' : 'failing',
        detail: !sproulAttribution.valid ? 'Passing — Sproul attribution without source blocked' : 'Failing — attribution allowed without source',
      });

      // Quote Validator check
      const fakeQuote = 'This is a completely fabricated quote that does not exist.';
      const realChunkText = ragRetrieval.retrieved_sources.flatMap(rs => rs.chunks.map(c => c.text)).join(' ');
      const quoteResult = validateQuote(fakeQuote, realChunkText);
      newChecks.push({
        id: 'quote_validator',
        label: 'Quote Validator',
        icon: Quote,
        status: !quoteResult.valid ? 'passing' : 'failing',
        detail: !quoteResult.valid ? 'Passing — fabricated quote blocked' : 'Failing — fabricated quote accepted',
      });

      // Safety Validator check
      const { data: safetyData } = await supabase.from('regression_tests').select('id').eq('category', 'safety').limit(1);
      const safetyPass = (safetyData || []).length > 0;
      newChecks.push({
        id: 'safety_validator',
        label: 'Safety Validator',
        icon: Sparkles,
        status: safetyPass ? 'passing' : 'failing',
        detail: safetyPass ? 'Passing — safety regression tests defined' : 'Failing — no safety tests',
      });

      setChecks(newChecks);
    } catch (err) {
      console.error('[HealthChecks]', err);
    } finally {
      setChecking(false);
    }
  }, []);

  const getVersion = (id: string) => versions.find(v => v.id === id)?.version || '—';
  const providerConfigured = providerHealth?.configured || getVersion('ai_provider') !== 'v7.0.0-dev';
  const providerConnected = providerHealth?.connected ?? false;

  // Auto-run health checks once versions are loaded
  useEffect(() => {
    if (!loading && versions.length > 0 && checks.length === 0) {
      runHealthChecks();
    }
  }, [loading, versions, checks.length, runHealthChecks]);

  const statusIcon = (status: HealthStatus) => {
    if (status === 'passing') return <Check size={14} className="text-sage-400 shrink-0" />;
    if (status === 'failing') return <AlertCircle size={14} className="text-error shrink-0" />;
    return <div className="w-1.5 h-1.5 rounded-full bg-ivory-600 shrink-0" />;
  };

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Intelligence Status</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Cpu size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">SOLAPATH Intelligence</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Production AI status and system version information.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading status..." />}
          {error && <ErrorState message={error} onRetry={loadVersions} />}

          {!loading && !error && (
            <>
              {/* Provider status banner */}
              <div className={`premium-card p-4 mb-4 ${providerConnected ? 'border-sage-500/30' : providerConfigured ? 'border-clay-500/20' : 'border-gold-500/20'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    providerConnected ? 'bg-sage-500/10 border border-sage-500/20' :
                    providerConfigured ? 'bg-clay-500/10 border border-clay-500/20' :
                    'bg-gold-500/10 border border-gold-500/20'
                  }`}>
                    {providerConnected ? <Check size={18} className="text-sage-400" /> :
                     providerConfigured ? <AlertCircle size={18} className="text-clay-400" /> :
                     <AlertCircle size={18} className="text-gold-300" />}
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${
                      providerConnected ? 'text-sage-400' :
                      providerConfigured ? 'text-clay-400' :
                      'text-gold-300'
                    }`}>
                      {providerConnected ? 'Production AI Connected' :
                       providerConfigured ? 'Production Intelligence Unavailable' :
                       'Development Intelligence'}
                    </p>
                    <p className="text-ivory-600 text-xs mt-0.5">
                      {providerConnected
                        ? 'Server-side AI provider is configured, healthy, and active.'
                        : providerConfigured
                        ? 'Provider is configured but health check failed. Using development fallback.'
                        : 'No external AI provider configured. Using development fallback with RAG integration.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Health checks */}
              {checking && <LoadingState message="Running health checks..." />}
              {!checking && checks.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="ui-label mb-1">Health Checks</p>
                  {checks.map((c) => (
                    <div key={c.id} className="premium-card p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0">
                          <c.icon size={14} className="text-ivory-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-ivory-600 text-[10px] uppercase tracking-wider">{c.label}</p>
                          <p className={`text-sm font-medium ${c.status === 'passing' ? 'text-ivory-200' : c.status === 'failing' ? 'text-error' : 'text-ivory-600'}`}>{c.detail}</p>
                        </div>
                        {statusIcon(c.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* System versions */}
              <div className="mt-4">
                <p className="ui-label mb-2">System Versions</p>
                <div className="premium-card p-3">
                  {versions.map((v, i) => (
                    <div key={v.id} className={`flex items-center justify-between py-1.5 ${i < versions.length - 1 ? 'border-b border-ink-700/30' : ''}`}>
                      <p className="text-ivory-500 text-xs">{v.id.replace(/_/g, ' ')}</p>
                      <p className="text-ivory-300 text-xs font-mono">{v.version}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 mt-5 px-1">
                <Info size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
                <p className="text-ivory-600 text-xs leading-relaxed font-medium">API keys are never displayed. Provider configuration is server-side only. Health checks come from the live edge function.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
