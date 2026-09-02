import { useState } from 'react';
import {
  X, Send, Heart, BookOpen, ChevronRight, Info, Sparkles, AlertCircle, ShieldAlert,
} from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { getGospelConversationPrep, boundaryGuidance, workplaceGuidance } from '@/lib/reachEngine';
import type { GospelConversationPrep } from '@/lib/reachTypes';

interface Props { onBack: () => void; }

export default function GospelConversationScreen({ onBack }: Props) {
  const [situation, setSituation] = useState('');
  const [prep, setPrep] = useState<GospelConversationPrep | null>(null);
  const [thinking, setThinking] = useState(false);

  async function handlePrepare() {
    if (!situation.trim()) return;
    vibrate(10);
    setThinking(true);
    setPrep(null);
    await new Promise((r) => setTimeout(r, 500));
    setPrep(getGospelConversationPrep(situation.trim()));
    setThinking(false);
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Gospel Conversation</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Heart size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Gospel Conversation</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Prepare for a real conversation with someone you love.</p>
            </div>
          </div>

          <div className="flex items-start gap-2 mb-4 px-3 py-2 rounded-xl bg-ink-800/40 border border-ink-700/30">
            <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-500 text-xs leading-relaxed">SOLAPATH prepares you — it does not give you a robotic script. Favor natural human conversation.</p>
          </div>

          <textarea value={situation} onChange={(e) => setSituation(e.target.value)}
            placeholder="My brother and I are having dinner tonight. He doesn't believe Christianity is true and thinks Christians are hypocrites."
            className="input-field min-h-[100px] resize-none text-sm mb-3" />

          <button onClick={handlePrepare} disabled={!situation.trim() || thinking} className="btn-primary w-full disabled:opacity-40 mb-4">
            <Send size={16} />{thinking ? 'Preparing...' : 'Prepare Me'}
          </button>

          {thinking && (
            <div className="flex items-center gap-2 mb-4 animate-fade-in">
              <div className="w-2 h-2 rounded-full bg-gold-400/60 animate-breathe" />
              <p className="text-ivory-500 text-sm italic">SOLAPATH is preparing guidance...</p>
            </div>
          )}

          {prep && (
            <div className="animate-fade-in-up space-y-2">
              {prep.is_demo && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-ink-800/50 border border-ink-700/40">
                  <Info size={13} className="text-ivory-500 shrink-0" />
                  <p className="text-ivory-500 text-xs">Development Mode — Demo content</p>
                </div>
              )}

              <Section icon={Heart} title="Pray First" content={prep.pray_first} />
              <Section icon={BookOpen} title="Listen" content={prep.listen} />

              <div className="premium-card p-4">
                <p className="text-sm text-ivory-100 font-medium mb-2">Questions Worth Asking</p>
                <div className="space-y-1.5">
                  {prep.questions_worth_asking.map((q, i) => (
                    <div key={i} className="flex items-start gap-2"><span className="text-gold-400/60 text-xs mt-0.5">·</span><p className="text-ivory-300 text-sm leading-relaxed">{q}</p></div>
                  ))}
                </div>
              </div>

              <Section icon={Sparkles} title="Gospel Connection" content={prep.gospel_connection} />

              <div className="premium-card p-4">
                <div className="flex items-center gap-2 mb-2"><BookOpen size={15} className="text-gold-300" /><p className="text-sm text-ivory-100 font-medium">Scripture to Know</p></div>
                <div className="space-y-2">
                  {prep.scripture_to_know.map((p, i) => (
                    <div key={i} className="flex items-start gap-2"><ChevronRight size={14} className="text-gold-400/60 shrink-0 mt-0.5" />
                      <div><p className="text-ivory-200 text-sm font-medium">{p.reference}</p><p className="text-ivory-500 text-xs">{p.reason}</p></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="premium-card p-4">
                <div className="flex items-center gap-2 mb-2"><ShieldAlert size={15} className="text-clay-400" /><p className="text-sm text-ivory-100 font-medium">Things Not to Force</p></div>
                <div className="space-y-1.5">
                  {prep.things_not_to_force.map((t, i) => (
                    <div key={i} className="flex items-start gap-2"><span className="text-clay-400/60 text-xs mt-0.5">·</span><p className="text-ivory-400 text-sm leading-relaxed">{t}</p></div>
                  ))}
                </div>
              </div>

              <Section icon={AlertCircle} title="Follow-Up" content={prep.follow_up} />
            </div>
          )}

          {/* Boundary guidance */}
          <div className="mt-5 premium-card p-4 border-clay-500/20">
            <div className="flex items-center gap-2 mb-2"><ShieldAlert size={15} className="text-clay-400" /><p className="text-sm text-ivory-100 font-medium">{boundaryGuidance.title}</p></div>
            <p className="text-ivory-400 text-xs leading-relaxed">{boundaryGuidance.content}</p>
            <p className="text-gold-300 text-xs mt-2 italic font-serif">{boundaryGuidance.scripture}</p>
          </div>

          {/* Workplace guidance */}
          <div className="mt-2 premium-card p-4 border-clay-500/20">
            <div className="flex items-center gap-2 mb-2"><ShieldAlert size={15} className="text-clay-400" /><p className="text-sm text-ivory-100 font-medium">{workplaceGuidance.title}</p></div>
            <p className="text-ivory-400 text-xs leading-relaxed">{workplaceGuidance.content}</p>
            <p className="text-gold-300 text-xs mt-2 italic font-serif">{workplaceGuidance.scripture}</p>
          </div>
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
