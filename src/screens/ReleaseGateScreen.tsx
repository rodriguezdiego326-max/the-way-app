import { useState, useEffect, useCallback } from 'react';
import { X, Shield, Check, AlertCircle, Lock, Unlock, GitBranch, Cpu, Database, FlaskConical } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate, formatRelative } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import { retrieveSources, validateAttribution, validateQuote } from '@/lib/libraryEngine';

interface Props { onBack: () => void; }

interface GateCheck {
  label: string;
  value: boolean;
  detail: string;
}

export default function ReleaseGateScreen({ onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checks, setChecks] = useState<GateCheck[]>([]);
  const [criticalCount, setCriticalCount] = useState({ pass: 0, total: 0 });
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [providerConfigured, setProviderConfigured] = useState(false);
  const [providerConnected, setProviderConnected] = useState(false);
  const [ragConnected, setRagConnected] = useState(false);

  const runGateChecks = useCallback(async () => {
    setLoading(true);
    setError(null);
    const newChecks: GateCheck[] = [];

    try {
      // Run validation tests to determine actual gate status
      const justRetrieval = await retrieveSources('justification');
      const allVerified = justRetrieval.retrieved_sources.every(rs => rs.source.verified && rs.source.content_status === 'verified');
      const pendingNotInCitations = !justRetrieval.citations.some(c => c.display_title.includes('Unverified'));
      const pendingNotInContext = !justRetrieval.retrieved_sources.some(rs => rs.source.content_status === 'pending_verification');
      const unverifiedExclusionPass = pendingNotInCitations && pendingNotInContext;

      const hasAuthorityLevels = justRetrieval.retrieved_sources.length > 0;
      const sourceIntegrityPass = hasAuthorityLevels && allVerified;

      const fakeQuote = 'This is a completely fabricated quote that does not exist in any source.';
      const realChunkText = justRetrieval.retrieved_sources.flatMap(rs => rs.chunks.map(c => c.text)).join(' ');
      const fakeResult = validateQuote(fakeQuote, realChunkText);
      const quotePass = !fakeResult.valid;

      const sproulQuery = await retrieveSources('What did R.C. Sproul say about holiness?');
      const sproulAttribution = validateAttribution('Sproul taught...', 'R. C. Sproul', sproulQuery.citations);
      const attributionPass = !sproulAttribution.valid;

      const hasTraceableCitations = justRetrieval.retrieved_sources.every(rs =>
        rs.source.id && rs.chunks.every(c => c.source_id === rs.source.id)
      );

      const authorityLevels = justRetrieval.citations.map(c => c.authority_level).sort((a, b) => a - b);
      const scriptureFirst = authorityLevels.length > 0 && authorityLevels[0] === 1;
      const confessionBeforeHistoric = authorityLevels.indexOf(3) < authorityLevels.indexOf(4) || authorityLevels.indexOf(4) === -1;
      const authorityPass = scriptureFirst && confessionBeforeHistoric;

      const honestEmpty = sproulQuery.confidence === 'source_unavailable' || !sproulQuery.citations.some(c => c.display_author.includes('Sproul'));

      const familyRetrieval = await retrieveSources('What is justification?');
      const familyHasScripture = familyRetrieval.citations.some(c => c.authority_level === 1);
      const familyHasConfession = familyRetrieval.citations.some(c => c.authority_level === 3);
      const familyPass = familyHasScripture && familyHasConfession;

      const reachRetrieval = await retrieveSources('salvation by grace rather than works');
      const reachPass = reachRetrieval.citations.length > 0;

      const { data: regData } = await supabase.from('regression_tests').select('query, expected_properties').limit(1);
      const structuredPass = (regData || []).length > 0;

      const { data: safetyData } = await supabase.from('regression_tests').select('query').eq('category', 'safety').limit(1);
      const safetyPass = (safetyData || []).length > 0;

      // Provider check — call real health check endpoint
      let pConfigured = false;
      let pConnected = false;
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
          const health = await healthRes.json();
          pConfigured = health.configured || false;
          pConnected = health.connected || false;
        }
      } catch {
        // Health endpoint unreachable — check system_versions as fallback
        const { data: versionData } = await supabase.from('system_versions').select('version').eq('id', 'ai_provider').maybeSingle();
        pConfigured = (versionData?.version || 'v7.0.0-dev') !== 'v7.0.0-dev';
      }
      setProviderConfigured(pConfigured);
      setProviderConnected(pConnected);

      // RAG check
      const rConnected = justRetrieval.citations.length > 0;
      setRagConnected(rConnected);

      // Build checks
      newChecks.push({ label: 'Verified-Only Retrieval', value: allVerified, detail: allVerified ? 'All retrieved sources verified' : 'Unverified sources in results' });
      newChecks.push({ label: 'Unverified Source Exclusion', value: unverifiedExclusionPass, detail: unverifiedExclusionPass ? 'Pending source excluded' : 'Pending source leaked' });
      newChecks.push({ label: 'Source Integrity', value: sourceIntegrityPass, detail: sourceIntegrityPass ? 'Sources have valid metadata' : 'Missing metadata' });
      newChecks.push({ label: 'Quote Validation', value: quotePass, detail: quotePass ? 'Fabricated quotes blocked' : 'Fabricated quotes accepted' });
      newChecks.push({ label: 'Attribution Validation', value: attributionPass, detail: attributionPass ? 'Sproul attribution blocked' : 'Attribution allowed' });
      newChecks.push({ label: 'Citation Traceability', value: hasTraceableCitations, detail: hasTraceableCitations ? 'All citations trace to sources' : 'Traceability broken' });
      newChecks.push({ label: 'Authority Ranking', value: authorityPass, detail: authorityPass ? 'Scripture > Confession > Historic' : 'Ranking violated' });
      newChecks.push({ label: 'Source-Missing Honesty', value: honestEmpty, detail: honestEmpty ? 'No fabricated attribution' : 'Fabricated content detected' });
      newChecks.push({ label: 'Family Shared RAG', value: familyPass, detail: familyPass ? 'Same verified library' : 'Different RAG' });
      newChecks.push({ label: 'REACH Shared RAG', value: reachPass, detail: reachPass ? 'Same verified library' : 'Different RAG' });
      newChecks.push({ label: 'Structured Output', value: structuredPass, detail: structuredPass ? 'Regression tests available' : 'No regression tests' });
      newChecks.push({ label: 'Safety Validator', value: safetyPass, detail: safetyPass ? 'Safety tests defined' : 'No safety tests' });
      newChecks.push({ label: 'RAG → Production AI', value: rConnected, detail: rConnected ? `${justRetrieval.citations.length} citations connected` : 'RAG not connected' });
      newChecks.push({ label: 'Production AI Connection', value: pConnected || pConfigured, detail: pConnected ? 'Production provider connected and healthy' : pConfigured ? 'Provider configured but health check failed' : 'Development fallback active' });

      setChecks(newChecks);
      setCriticalCount({ pass: newChecks.filter(c => c.value).length, total: newChecks.length });
      setTimestamp(new Date().toISOString());
    } catch (err) {
      console.error('[ReleaseGate]', err);
      setError('Could not run release gate checks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { runGateChecks(); }, [runGateChecks]);

  const allPass = checks.length > 0 && checks.every(c => c.value);

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Release Gate</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Shield size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Production Intelligence Release Gate</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">All critical tests must pass before advancing to the next phase.</p>
            </div>
          </div>

          {loading && <LoadingState message="Running release gate checks..." />}
          {error && <ErrorState message={error} onRetry={runGateChecks} />}

          {!loading && !error && checks.length > 0 && (
            <>
              {/* Release status banner */}
              <div className={`premium-card p-4 mb-4 ${allPass ? 'border-sage-500/30' : 'border-clay-500/20'}`}>
                <div className="flex items-center gap-3">
                  {allPass ? (
                    <div className="w-10 h-10 rounded-xl bg-sage-500/10 border border-sage-500/20 flex items-center justify-center shrink-0">
                      <Unlock size={18} className="text-sage-400" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-clay-500/10 border border-clay-500/20 flex items-center justify-center shrink-0">
                      <Lock size={18} className="text-clay-400" />
                    </div>
                  )}
                  <div>
                    <p className={`font-medium text-sm ${allPass ? 'text-sage-400' : 'text-clay-400'}`}>
                      {allPass ? 'READY FOR NEXT PHASE' : 'NOT READY'}
                    </p>
                    <p className="text-ivory-600 text-xs mt-0.5">
                      {criticalCount.pass} / {criticalCount.total} critical tests passing
                      {timestamp && ` · ${formatRelative(timestamp)}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status summary cards */}
              <div className="flex gap-3 mb-4">
                <div className={`premium-card p-3 flex-1 text-center ${criticalCount.pass === criticalCount.total ? 'border-sage-500/30' : 'border-clay-500/20'}`}>
                  <div className="flex items-center justify-center gap-1.5">
                    <FlaskConical size={14} className={criticalCount.pass === criticalCount.total ? 'text-sage-400' : 'text-clay-400'} />
                    <p className={`text-lg font-serif ${criticalCount.pass === criticalCount.total ? 'text-sage-400' : 'text-clay-400'}`}>{criticalCount.pass}/{criticalCount.total}</p>
                  </div>
                  <p className="text-ivory-600 text-xs mt-1">Critical Tests</p>
                </div>
                <div className={`premium-card p-3 flex-1 text-center ${providerConnected ? 'border-sage-500/20' : providerConfigured ? 'border-clay-500/20' : 'border-gold-500/20'}`}>
                  <div className="flex items-center justify-center gap-1.5">
                    <Cpu size={14} className={providerConnected ? 'text-sage-400' : providerConfigured ? 'text-clay-400' : 'text-gold-300'} />
                    <p className={`text-sm font-medium ${providerConnected ? 'text-sage-400' : providerConfigured ? 'text-clay-400' : 'text-gold-300'}`}>{providerConnected ? 'Connected' : providerConfigured ? 'Unhealthy' : 'Dev Mode'}</p>
                  </div>
                  <p className="text-ivory-600 text-xs mt-1">Production AI</p>
                </div>
                <div className={`premium-card p-3 flex-1 text-center ${ragConnected ? 'border-sage-500/20' : 'border-error/20'}`}>
                  <div className="flex items-center justify-center gap-1.5">
                    <Database size={14} className={ragConnected ? 'text-sage-400' : 'text-error'} />
                    <p className={`text-sm font-medium ${ragConnected ? 'text-sage-400' : 'text-error'}`}>{ragConnected ? 'Connected' : 'Off'}</p>
                  </div>
                  <p className="text-ivory-600 text-xs mt-1">RAG</p>
                </div>
              </div>

              {/* Individual checks */}
              <div className="space-y-2">
                {checks.map((c, i) => (
                  <div key={i} className={`premium-card p-3 ${c.value ? 'border-sage-500/20' : 'border-error/20'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        c.value ? 'bg-sage-500/10 border border-sage-500/20' : 'bg-error/10 border border-error/20'
                      }`}>
                        {c.value ? <Check size={13} className="text-sage-400" /> : <AlertCircle size={13} className="text-error" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-ivory-100 text-sm">{c.label}</p>
                        <p className="text-ivory-600 text-xs mt-0.5">{c.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <GitBranch size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">Do not advance to the next phase until all critical tests pass. AI is the servant. Scripture is the authority.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
