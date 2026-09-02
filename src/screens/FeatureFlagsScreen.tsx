import { useState, useEffect, useCallback } from 'react';
import { X, ToggleLeft, ToggleRight, AlertTriangle, Shield, Power } from 'lucide-react';
import { vibrate, formatDate } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import { getFeatureFlags, setFeatureFlag } from '@/lib/productionEngine';
import type { FeatureFlag } from '@/lib/productionTypes';

interface Props {
  onBack: () => void;
}

export default function FeatureFlagsScreen({ onBack }: Props) {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFeatureFlags();
      setFlags(data);
    } catch {
      setError('Could not load feature flags.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (flag: FeatureFlag) => {
    vibrate(10);
    const newEnabled = !flag.is_enabled;
    await setFeatureFlag(flag.flag_key, newEnabled);
    setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, is_enabled: newEnabled, updated_at: new Date().toISOString() } : f));
  };

  const regularFlags = flags.filter(f => !f.is_kill_switch);
  const killSwitches = flags.filter(f => f.is_kill_switch);

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Feature Flags</p><span className="w-10" />
      </header>
      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <ToggleLeft size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">FEATURE FLAGS</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Toggle features without redeploy.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading flags..." />}
          {error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && (
            <div className="space-y-4">
              <div>
                <p className="ui-label mb-2">Features</p>
                <div className="space-y-2">
                  {regularFlags.map(flag => (
                    <FlagRow key={flag.id} flag={flag} onToggle={() => handleToggle(flag)} />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Power size={14} className="text-error" />
                  <p className="ui-label">Kill Switches</p>
                </div>
                <p className="text-ivory-600 text-xs leading-relaxed mb-2">Emergency disable without deleting user data.</p>
                <div className="space-y-2">
                  {killSwitches.map(flag => (
                    <FlagRow key={flag.id} flag={flag} onToggle={() => handleToggle(flag)} isKillSwitch />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FlagRow({ flag, onToggle, isKillSwitch }: { flag: FeatureFlag; onToggle: () => void; isKillSwitch?: boolean }) {
  return (
    <div className={`premium-card p-4 flex items-center gap-3 ${!flag.is_enabled && isKillSwitch ? 'border-error/30' : ''}`}>
      <div className="flex-1">
        <p className="text-ivory-100 font-medium text-sm">{flag.flag_key.replace(/_/g, ' ')}</p>
        {flag.description && <p className="text-ivory-600 text-xs mt-0.5">{flag.description}</p>}
        <p className="text-ivory-600 text-[10px] mt-0.5">Updated {formatDate(flag.updated_at)}</p>
      </div>
      <button onClick={onToggle} className="shrink-0">
        {flag.is_enabled ? (
          <ToggleRight size={32} className="text-sage-400" />
        ) : (
          <ToggleLeft size={32} className={isKillSwitch ? 'text-error' : 'text-ivory-600'} />
        )}
      </button>
    </div>
  );
}
