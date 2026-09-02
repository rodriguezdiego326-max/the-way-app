import { useState } from 'react';
import {
  X, Send, BookOpen, Lightbulb, MessageCircle, ChevronRight,
  Info, Sparkles, ShieldCheck, AlertCircle,
} from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { getChildAskedResponse } from '@/lib/familyEngine';
import type { FamilyProfile, FamilyMember, AgeRange, ChildAskedResponse } from '@/lib/familyTypes';

interface ChildAskedScreenProps {
  familyProfile: FamilyProfile | null;
  members: FamilyMember[];
  onBack: () => void;
}

const ageLabels: { id: AgeRange; label: string }[] = [
  { id: '3-5', label: '3–5' },
  { id: '6-8', label: '6–8' },
  { id: '9-12', label: '9–12' },
  { id: '13-15', label: '13–15' },
  { id: '16-17', label: '16–17' },
  { id: '18+', label: 'Adult' },
];

export default function ChildAskedScreen({ familyProfile, members, onBack }: ChildAskedScreenProps) {
  const [question, setQuestion] = useState('');
  const [selectedAge, setSelectedAge] = useState<AgeRange>(
    members[0]?.age_range || '6-8',
  );
  const [response, setResponse] = useState<ChildAskedResponse | null>(null);
  const [thinking, setThinking] = useState(false);

  // Use the age range from the first family member if available
  const defaultAge = members[0]?.age_range || '6-8';

  async function handleAsk() {
    if (!question.trim()) return;
    vibrate(10);
    setThinking(true);
    setResponse(null);

    // Simulate processing
    await new Promise((r) => setTimeout(r, 500));

    const result = await getChildAskedResponse(question.trim(), selectedAge);
    setResponse(result);
    setThinking(false);
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost">
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
                SOLAPATH responds to you, the parent — not directly to your child.
              </p>
            </div>
          </div>

          {/* Parent-first note */}
          <div className="flex items-start gap-2 mb-4 px-3 py-2 rounded-xl bg-ink-800/40 border border-ink-700/30">
            <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-500 text-xs leading-relaxed">
              Here's how you can explain this to your child. SOLAPATH equips you — it does not replace you.
            </p>
          </div>

          {/* Input */}
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="My 7-year-old asked why Jesus had to die."
            className="input-field min-h-[80px] resize-none text-sm mb-3"
          />

          {/* Age selector */}
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
            onClick={handleAsk}
            disabled={!question.trim() || thinking}
            className="btn-primary w-full disabled:opacity-40 mb-4"
          >
            <Send size={16} />
            {thinking ? 'Preparing guidance...' : 'Help Me Answer'}
          </button>

          {/* Thinking */}
          {thinking && (
            <div className="flex items-center gap-2 mb-4 animate-fade-in">
              <div className="w-2 h-2 rounded-full bg-gold-400/60 animate-breathe" />
              <p className="text-ivory-500 text-sm italic">SOLAPATH is preparing parent guidance...</p>
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="animate-fade-in-up space-y-2">
              {response.is_demo && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-ink-800/50 border border-ink-700/40">
                  <Info size={13} className="text-ivory-500 shrink-0" />
                  <p className="text-ivory-500 text-xs">Development Mode — Demo content</p>
                </div>
              )}

              {/* Understand it yourself */}
              <div className="premium-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={15} className="text-gold-300" />
                  <p className="text-sm text-ivory-100 font-medium">Understand It Yourself</p>
                </div>
                <p className="text-ivory-300 text-sm leading-relaxed">{response.understand_it_yourself}</p>
              </div>

              {/* Open the Bible together */}
              <div className="premium-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={15} className="text-gold-300" />
                  <p className="text-sm text-ivory-100 font-medium">Open the Bible Together</p>
                </div>
                <div className="space-y-2">
                  {response.open_the_bible_together.map((p, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <ChevronRight size={14} className="text-gold-400/60 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-ivory-200 text-sm font-medium">{p.reference}</p>
                        <p className="text-ivory-500 text-xs leading-relaxed">{p.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* How to explain it */}
              <div className="premium-card p-4 border-gold-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle size={15} className="text-gold-300" />
                  <p className="text-sm text-ivory-100 font-medium">
                    How to Explain It (Age {ageLabels.find((a) => a.id === selectedAge)?.label})
                  </p>
                </div>
                <p className="text-ivory-200 text-sm leading-relaxed">{response.how_to_explain_it}</p>
              </div>

              {/* Ask them */}
              <div className="premium-card p-4">
                <p className="text-sm text-ivory-100 font-medium mb-2">Ask Them</p>
                <div className="space-y-1.5">
                  {response.ask_them.map((q, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-gold-400/60 text-xs mt-0.5">·</span>
                      <p className="text-ivory-300 text-sm leading-relaxed">{q}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* They may ask next */}
              <div className="premium-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={14} className="text-ivory-500" />
                  <p className="text-sm text-ivory-100 font-medium">They May Ask Next</p>
                </div>
                <div className="space-y-1.5">
                  {response.they_may_ask_next.map((q, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-ivory-600 text-xs mt-0.5">·</span>
                      <p className="text-ivory-400 text-sm leading-relaxed">{q}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reformed foundation */}
              <div className="premium-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={15} className="text-sage-400" />
                  <p className="text-sm text-ivory-100 font-medium">Reformed Foundation</p>
                </div>
                <p className="text-ivory-300 text-sm leading-relaxed">{response.reformed_foundation}</p>
              </div>

              {/* Sources */}
              <div className="premium-card p-4">
                <p className="text-sm text-ivory-100 font-medium mb-2">Sources</p>
                {response.sources.length === 0 ? (
                  <p className="text-ivory-600 text-xs italic">
                    Verified sources are still being added to SOLAPATH's library. No fabricated quotations or attributions.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {response.sources.map((s, i) => (
                      <p key={i} className="text-ivory-400 text-xs">{s.display_title}{s.chapter_section ? ` — ${s.chapter_section}` : ''}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
