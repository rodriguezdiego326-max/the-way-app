import { useState } from 'react';
import { X, FileText, Shield, BookOpen, Users, AlertCircle, ChevronRight } from 'lucide-react';
import { vibrate } from '@/lib/utils';

interface Props {
  onBack: () => void;
}

type DocType = 'privacy_policy' | 'terms' | 'ai_disclosure' | 'community_guidelines' | 'child_privacy';

const DOCS: Array<{ id: DocType; title: string; icon: typeof FileText; placeholder: string }> = [
  {
    id: 'privacy_policy', title: 'Privacy Policy', icon: Shield,
    placeholder: 'This Privacy Policy describes how SOLAPATH collects, uses, and protects your personal and spiritual data.\n\nSOLAPATH stores: account information, prayers, reflections, AI conversations, memories, Family records, REACH records, Circle shared records, Church records, and Legacy records.\n\nAll data is private by default. SOLAPATH does not sell user data. SOLAPATH does not use user prayers or spiritual content for advertising.\n\nThis document requires legal review before publication.',
  },
  {
    id: 'terms', title: 'Terms of Use', icon: FileText,
    placeholder: 'Terms of Use for SOLAPATH application.\n\nSOLAPATH is a discipleship tool. It is not a replacement for Scripture, pastoral counsel, professional therapy, medical advice, or emergency services.\n\nAI-generated content is not divine revelation. Scripture is the authority.\n\nThis document requires legal review before publication.',
  },
  {
    id: 'ai_disclosure', title: 'AI Disclosure', icon: BookOpen,
    placeholder: 'SOLAPATH uses artificial intelligence to assist with:\n\n• Personalization\n• Explanations\n• Study support\n• Organization\n• Reflection prompts\n\nAI is not:\n• Scripture\n• Divine revelation\n• A pastor\n• A therapist\n• A doctor\n• A lawyer\n• An emergency service\n\nAI is the servant. Scripture is the authority.',
  },
  {
    id: 'community_guidelines', title: 'Community Guidelines', icon: Users,
    placeholder: 'Together (Circles) Community Guidelines:\n\n• Respect all members\n• Protect privacy — do not share others\' content outside the Circle\n• No harassment, impersonation, or abuse\n• No exploitation or public shaming\n• No doxxing or spam\n• Christian disagreement should remain charitable\n\nViolations may result in removal from Circles.',
  },
  {
    id: 'child_privacy', title: 'Child / Family Privacy', icon: AlertCircle,
    placeholder: 'Family Privacy Notice:\n\nSOLAPATH does not require legal names, birth dates, school names, or precise locations for children.\n\nFamily records use age ranges and optional nicknames.\n\nChild-related Legacy records have heightened privacy. No Circle, Church, or third-party access.\n\nParent controls all inclusion of family data.\n\nThis document requires legal review before publication.',
  },
];

export default function LegalPlaceholdersScreen({ onBack }: Props) {
  const [selected, setSelected] = useState<DocType | null>(null);

  if (selected) {
    const doc = DOCS.find(d => d.id === selected)!;
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setSelected(null)} className="btn-ghost"><X size={20} /></button>
          <p className="ui-label">{doc.title}</p><span className="w-10" />
        </header>
        <div className="flex-1 overflow-y-auto px-6 mt-4">
          <div className="animate-fade-in-up">
            <div className="premium-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <doc.icon size={18} className="text-gold-300" />
                <h2 className="font-serif text-xl text-ivory-50">{doc.title}</h2>
              </div>
              <p className="text-ivory-400 text-xs leading-relaxed whitespace-pre-wrap">{doc.placeholder}</p>
              <div className="mt-4 pt-4 border-t border-ink-700/40">
                <div className="flex items-center gap-2">
                  <AlertCircle size={13} className="text-clay-400" />
                  <p className="text-clay-400 text-xs font-medium">DRAFT — Requires legal review before publication.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Legal & Disclosure</p><span className="w-10" />
      </header>
      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <FileText size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">LEGAL & DISCLOSURE</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Draft documents pending legal review.</p>
            </div>
          </div>
          <div className="space-y-2">
            {DOCS.map(doc => (
              <button
                key={doc.id}
                onClick={() => { vibrate(8); setSelected(doc.id); }}
                className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group w-full"
              >
                <div className="w-10 h-10 rounded-xl bg-ink-700/50 flex items-center justify-center shrink-0">
                  <doc.icon size={17} className="text-ivory-400 group-hover:text-gold-300 transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="text-ivory-100 font-medium text-sm">{doc.title}</p>
                  <p className="text-clay-400 text-xs">Draft — needs legal review</p>
                </div>
                <ChevronRight size={16} className="text-ivory-600 shrink-0" />
              </button>
            ))}
          </div>

          <div className="mt-6 premium-card p-4">
            <h3 className="text-ivory-100 font-medium text-sm mb-2">Sources & Attribution</h3>
            <div className="space-y-3">
              <div>
                <p className="text-ivory-400 text-xs leading-relaxed">
                  Cross-reference relationship data derived from OpenBible.info, licensed under Creative Commons Attribution. The dataset derives primarily from public-domain Treasury of Scripture Knowledge material. SOLAPATH uses only the reference relationship data; all Scripture text comes from the locally bundled World English Bible (public domain).
                </p>
              </div>
              <div>
                <p className="text-ivory-400 text-xs leading-relaxed">
                  World English Bible — public domain modern English translation. No copyright restrictions.
                </p>
              </div>
              <div>
                <p className="text-ivory-400 text-xs leading-relaxed">
                  Reina-Valera 1909 — public domain Spanish translation. Source: eBible.org (spaRV1909). Not affiliated with later Reina-Valera editions (RVR1960, RVR1995, RVR2020) which are rights-managed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
