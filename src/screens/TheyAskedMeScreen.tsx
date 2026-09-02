import { useState } from 'react';
import {
  X, Send, BookOpen, Lightbulb, MessageCircle, ChevronRight,
  Info, ShieldCheck, AlertCircle, Sparkles,
} from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { getTheyAskedMeResponse } from '@/lib/reachEngine';
import type { TheyAskedMeResponse } from '@/lib/reachTypes';

interface Props { onBack: () => void; }

export default function TheyAskedMeScreen({ onBack }: Props) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<TheyAskedMeResponse | null>(null);
  const [thinking, setThinking] = useState(false);

  async function handleAsk() {
    if (!question.trim()) return;
    vibrate(10);
    setThinking(true);
    setResponse(null);
    await new Promise((r) => setTimeout(r, 500));
    setResponse(await getTheyAskedMeResponse(question.trim()));
    setThinking(false);
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">They Asked Me...</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <MessageCircle size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">They Asked Me...</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">SOLAPATH equips you to respond faithfully.</p>
            </div>
          </div>

          <div className="flex items-start gap-2 mb-4 px-3 py-2 rounded-xl bg-ink-800/40 border border-ink-700/30">
            <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-500 text-xs leading-relaxed">Love before strategy. Listen before answering. Person before argument.</p>
          </div>

          <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
            placeholder="My coworker asked why a loving God would send anyone to hell."
            className="input-field min-h-[80px] resize-none text-sm mb-3" />

          <button onClick={handleAsk} disabled={!question.trim() || thinking} className="btn-primary w-full disabled:opacity-40 mb-4">
            <Send size={16} />{thinking ? 'Preparing...' : 'Help Me Respond'}
          </button>

          {thinking && (
            <div className="flex items-center gap-2 mb-4 animate-fade-in">
              <div className="w-2 h-2 rounded-full bg-gold-400/60 animate-breathe" />
              <p className="text-ivory-500 text-sm italic">SOLAPATH is preparing guidance...</p>
            </div>
          )}

          {response && (
            <div className="animate-fade-in-up space-y-2">
              {response.is_demo && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-ink-800/50 border border-ink-700/40">
                  <Info size={13} className="text-ivory-500 shrink-0" />
                  <p className="text-ivory-500 text-xs">Development Mode — Demo content</p>
                </div>
              )}

              <Section icon={Lightbulb} title="Understand the Question" content={response.understand_the_question} />
              <Section icon={BookOpen} title="Understand It Yourself" content={response.understand_it_yourself} />

              <div className="premium-card p-4">
                <div className="flex items-center gap-2 mb-2"><BookOpen size={15} className="text-gold-300" /><p className="text-sm text-ivory-100 font-medium">Open Your Bible</p></div>
                <div className="space-y-2">
                  {response.open_your_bible.map((p, i) => (
                    <div key={i} className="flex items-start gap-2"><ChevronRight size={14} className="text-gold-400/60 shrink-0 mt-0.5" />
                      <div><p className="text-ivory-200 text-sm font-medium">{p.reference}</p><p className="text-ivory-500 text-xs">{p.reason}</p></div>
                    </div>
                  ))}
                </div>
              </div>

              <Section icon={MessageCircle} title="How You Could Respond" content={response.how_you_could_respond} />

              <div className="premium-card p-4">
                <p className="text-sm text-ivory-100 font-medium mb-2">Questions to Ask Them</p>
                <div className="space-y-1.5">
                  {response.questions_to_ask_them.map((q, i) => (
                    <div key={i} className="flex items-start gap-2"><span className="text-gold-400/60 text-xs mt-0.5">·</span><p className="text-ivory-300 text-sm leading-relaxed">{q}</p></div>
                  ))}
                </div>
              </div>

              <div className="premium-card p-4">
                <div className="flex items-center gap-2 mb-2"><AlertCircle size={14} className="text-ivory-500" /><p className="text-sm text-ivory-100 font-medium">They May Ask Next</p></div>
                <div className="space-y-1.5">
                  {response.they_may_ask_next.map((q, i) => (
                    <div key={i} className="flex items-start gap-2"><span className="text-ivory-600 text-xs mt-0.5">·</span><p className="text-ivory-400 text-sm leading-relaxed">{q}</p></div>
                  ))}
                </div>
              </div>

              <Section icon={ShieldCheck} title="Reformed Foundation" content={response.reformed_foundation} />

              {response.other_christian_views && (
                <Section icon={Info} title="Other Christian Views" content={response.other_christian_views} />
              )}

              <div className="premium-card p-4">
                <p className="text-sm text-ivory-100 font-medium mb-2">Sources</p>
                {response.sources.length === 0 ? (
                  <p className="text-ivory-600 text-xs italic">Verified sources are still being added. No fabricated citations.</p>
                ) : (
                  <div className="space-y-1">{response.sources.map((s, i) => <p key={i} className="text-ivory-400 text-xs">{s.display_title}{s.chapter_section ? ` — ${s.chapter_section}` : ''}</p>)}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, content }: { icon: typeof BookOpen; title: string; content: string }) {
  return (
    <div className="premium-card p-4">
      <div className="flex items-center gap-2 mb-2"><Icon size={15} className="text-gold-300" /><p className="text-sm text-ivory-100 font-medium">{title}</p></div>
      <p className="text-ivory-300 text-sm leading-relaxed">{content}</p>
    </div>
  );
}
