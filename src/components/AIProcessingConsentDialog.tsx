import { useState } from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { openPrivacyPolicy } from '@/lib/privacyConfig';

interface Props {
  open: boolean;
  onAllow: () => Promise<void>;
  onNotNow: () => void;
}

export default function AIProcessingConsentDialog({ open, onAllow, onNotNow }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleAllow = async () => {
    setSaving(true);
    setError(null);
    try {
      await onAllow();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your permission. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleNotNow = () => {
    if (saving) return;
    setError(null);
    onNotNow();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center px-4 animate-fade-in" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="absolute inset-0 bg-ink-950/60" onClick={handleNotNow} />
      <div role="dialog" aria-modal="true" aria-labelledby="ai-consent-title" className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-ink-800/95 backdrop-blur-md border border-ivory-500/20 rounded-2xl p-5 shadow-xl shadow-ink-950/50 animate-fade-in-up mb-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={18} className="text-ivory-200" />
          <p id="ai-consent-title" className="text-ivory-50 text-base font-medium font-serif">AI Processing &amp; Privacy</p>
        </div>
        <div className="space-y-3 text-ivory-300 text-sm leading-relaxed mb-4">
          <p className="text-ivory-50 font-medium">SOLAPATH uses OpenAI to generate AI-assisted answers.</p>
          <p>When you use an AI feature, the question you submit is sent to OpenAI to generate a response.</p>
          <p>If Memory is enabled, SOLAPATH may also send only the relevant profile, memory, study, prayer, or recent conversation context needed for that response. SOLAPATH does not send your entire history.</p>
          <p>OpenAI is a third-party service provider.</p>
          <p>You can withdraw this permission at any time in <span className="text-ivory-50">You &rarr; Privacy &amp; Data</span>.</p>
          <p className="text-ivory-400 text-xs">Declining does not prevent you from using SOLAPATH&apos;s non-AI features.</p>
        </div>
        <button
          type="button"
          onClick={() => void openPrivacyPolicy()}
          className="inline-flex items-center gap-1.5 text-sm text-ivory-200 underline underline-offset-4 mb-4 hover:text-ivory-50"
        >
          View Privacy Policy <ExternalLink size={14} />
        </button>
        {error && <p role="alert" className="text-error text-xs mb-3">{error}</p>}
        <div className="flex flex-col gap-2">
          <button onClick={handleAllow} disabled={saving} className="btn-primary w-full disabled:opacity-40">
            {saving ? 'Saving...' : 'Allow AI Processing'}
          </button>
          <button onClick={handleNotNow} disabled={saving} className="btn-secondary w-full">
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
