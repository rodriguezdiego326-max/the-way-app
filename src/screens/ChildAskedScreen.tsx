import { useState } from 'react';
import { X, Send, MessageCircle, Sparkles } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import type { FamilyMember, AgeRange } from '@/lib/familyTypes';
import type { ChildAskedHandoff } from '@/lib/askHandoff';

interface ChildAskedScreenProps {
  members: FamilyMember[];
  onBack: () => void;
  onHelpMeAnswer: (handoff: ChildAskedHandoff) => void;
}

const ageLabels: { id: AgeRange; label: string }[] = [
  { id: '3-5', label: '3–5' },
  { id: '6-8', label: '6–8' },
  { id: '9-12', label: '9–12' },
  { id: '13-15', label: '13–15' },
  { id: '16-17', label: '16–17' },
  { id: '18+', label: 'Adult' },
];

export default function ChildAskedScreen({ members, onBack, onHelpMeAnswer }: ChildAskedScreenProps) {
  const [question, setQuestion] = useState('');
  const [selectedAge, setSelectedAge] = useState<AgeRange>(members[0]?.age_range || '6-8');

  function handleHelp() {
    const trimmed = question.trim();
    if (!trimmed) return;
    vibrate(10);
    const ageLabel = ageLabels.find((a) => a.id === selectedAge)?.label ?? '6–8';
    onHelpMeAnswer({ source: 'family_child_asked', question: trimmed, ageLabel });
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost" aria-label="Back to Family">
          <X size={20} />
        </button>
        <p className="ui-label">My Child Asked...</p>
        <span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <MessageCircle size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">My Child Asked...</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">
                Ask opens with your question and age range, so you can work through the answer as the parent.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 mb-4 px-3 py-2 rounded-xl bg-ink-800/40 border border-ink-700/30">
            <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-500 text-xs leading-relaxed">
              Only your question and the age range are shared. Names and Family history stay in Family.
            </p>
          </div>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="My 7-year-old asked why Jesus had to die."
            className="input-field min-h-[80px] resize-none text-sm mb-3"
          />

          <p className="text-ivory-400 text-xs mb-2">Explain for:</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {ageLabels.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  vibrate(6);
                  setSelectedAge(opt.id);
                }}
                className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all no-tap-highlight ${
                  selectedAge === opt.id
                    ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                    : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleHelp}
            disabled={!question.trim()}
            className="btn-primary w-full disabled:opacity-40 mb-4"
          >
            <Send size={16} />
            Help Me Answer
          </button>
        </div>
      </div>
    </div>
  );
}
