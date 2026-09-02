import { X, Shield, Activity, BarChart3, MessageSquare, ToggleLeft, FileText, FlaskConical, ChevronRight, Lock, Smartphone, BookOpen } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import type { Profile } from '@/lib/types';

interface Props {
  profile: Profile;
  onBack: () => void;
  onOpenHealth: () => void;
  onOpenAiUsage: () => void;
  onOpenFeedback: () => void;
  onOpenFeatureFlags: () => void;
  onOpenLegal: () => void;
  onOpenPrivacy: () => void;
  onOpenPhase10Tests: () => void;
  onOpenPhase11Tests: () => void;
  onOpenMobileBuildGuide: () => void;
}

export default function ProductionReadinessScreen({
  profile, onBack, onOpenHealth, onOpenAiUsage, onOpenFeedback, onOpenFeatureFlags, onOpenLegal, onOpenPrivacy, onOpenPhase10Tests, onOpenPhase11Tests, onOpenMobileBuildGuide,
}: Props) {
  const sections = [
    { icon: Shield, label: 'Privacy Center', desc: 'What SOLAPATH stores, AI & my data, download/delete', onClick: onOpenPrivacy },
    { icon: Activity, label: 'System Health', desc: 'Database, AI, RAG, error rate, latency', onClick: onOpenHealth },
    { icon: BarChart3, label: 'AI Usage Dashboard', desc: 'Request volume, tokens, cost, failures', onClick: onOpenAiUsage },
    { icon: ToggleLeft, label: 'Feature Flags', desc: 'Toggle features and kill switches', onClick: onOpenFeatureFlags },
    { icon: MessageSquare, label: 'Beta Feedback', desc: 'Report bugs, request features, concerns', onClick: onOpenFeedback },
    { icon: FileText, label: 'Legal & Disclosure', desc: 'Privacy policy, terms, AI disclosure, guidelines', onClick: onOpenLegal },
    { icon: FlaskConical, label: 'Phase 10 Validation', desc: '20 production readiness tests', onClick: onOpenPhase10Tests },
    { icon: Smartphone, label: 'Phase 11 Mobile Packaging', desc: 'Native packaging validation — iOS & Android', onClick: onOpenPhase11Tests },
    { icon: BookOpen, label: 'Mobile Build Guide', desc: 'Commands, prerequisites, troubleshooting', onClick: onOpenMobileBuildGuide },
  ];

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Phase 10</p><span className="w-10" />
      </header>
      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Shield size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">PRODUCTION READINESS</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Security, privacy, reliability, and beta readiness.</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {sections.map(s => (
              <button
                key={s.label}
                onClick={() => { vibrate(8); s.onClick(); }}
                className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group w-full"
              >
                <div className="w-10 h-10 rounded-xl bg-ink-700/50 flex items-center justify-center shrink-0">
                  <s.icon size={17} className="text-ivory-400 group-hover:text-gold-300 transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="text-ivory-100 font-medium text-sm">{s.label}</p>
                  <p className="text-ivory-600 text-xs">{s.desc}</p>
                </div>
                <ChevronRight size={16} className="text-ivory-600 shrink-0" />
              </button>
            ))}
          </div>

          <div className="flex items-start gap-2 mt-5 px-1">
            <Lock size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              PRIVATE MEANS PRIVATE. THE USER OWNS THEIR STORY. AI IS THE SERVANT. SCRIPTURE IS THE AUTHORITY.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
