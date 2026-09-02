import { useState } from 'react';
import {
  X, Shield, ChevronRight, ChevronDown, MessageCircle, Send, Check,
  Info, Sparkles, BookOpen, Heart, AlertCircle,
} from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { apologeticsCategories, practiceScenarios, type PracticeScenario } from '@/lib/reachEngine';
import type { PracticeCoaching } from '@/lib/reachTypes';

interface Props { onBack: () => void; }

type View = 'main' | 'category' | 'practice_list' | 'practice_active' | 'practice_coaching';

export default function ApologeticsCoachScreen({ onBack }: Props) {
  const [view, setView] = useState<View>('main');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<PracticeScenario | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [coaching, setCoaching] = useState<PracticeCoaching | null>(null);

  function startPractice(scenario: PracticeScenario) {
    vibrate(10);
    setSelectedScenario(scenario);
    setUserResponse('');
    setCoaching(null);
    setView('practice_active');
  }

  function finishPractice() {
    if (!selectedScenario) return;
    vibrate(12);
    setCoaching(selectedScenario.coaching);
    setView('practice_coaching');
  }

  // Practice active view
  if (view === 'practice_active' && selectedScenario) {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setView('practice_list')} className="btn-ghost"><X size={20} /></button>
          <p className="ui-label">Conversation Practice</p><span className="w-10" />
        </header>
        <div className="flex-1 overflow-y-auto px-6 mt-4">
          <div className="animate-fade-in-up">
            <div className="flex items-start gap-2 mb-4 px-3 py-2 rounded-xl bg-ink-800/40 border border-ink-700/30">
              <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
              <p className="text-ivory-500 text-xs leading-relaxed">This is a respectful simulated conversation. The skeptical position is presented intelligently and fairly. The goal is preparation, not winning imaginary arguments.</p>
            </div>

            <div className="premium-card p-4 mb-4 border-clay-500/20">
              <p className="text-xs uppercase tracking-wider text-clay-400/60 font-medium mb-2">{selectedScenario.label}</p>
              <p className="text-ivory-200 text-sm leading-relaxed italic">"{selectedScenario.objection}"</p>
            </div>

            <p className="text-sm text-ivory-400 mb-2">Your response:</p>
            <textarea value={userResponse} onChange={(e) => setUserResponse(e.target.value)}
              placeholder="Type how you would naturally respond..." className="input-field min-h-[120px] resize-none text-sm mb-4" />

            <button onClick={finishPractice} disabled={!userResponse.trim()} className="btn-primary w-full disabled:opacity-40">
              <Check size={16} /> Finish & Get Coaching
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Practice coaching view
  if (view === 'practice_coaching' && coaching) {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setView('practice_list')} className="btn-ghost"><X size={20} /></button>
          <p className="ui-label">Coaching</p><span className="w-10" />
        </header>
        <div className="flex-1 overflow-y-auto px-6 mt-4">
          <div className="animate-fade-in-up space-y-2">
            <div className="flex items-start gap-2 mb-3 px-3 py-2 rounded-xl bg-ink-800/40 border border-ink-700/30">
              <Info size={13} className="text-ivory-500 shrink-0 mt-0.5" />
              <p className="text-ivory-500 text-xs leading-relaxed">SOLAPATH does not grade you spiritually. There are no competitive scores. This is for growth, not performance.</p>
            </div>

            <Section icon={Check} title="What You Addressed Well" content={coaching.what_you_addressed_well} />
            <Section icon={AlertCircle} title="What You May Have Missed" content={coaching.what_you_may_have_missed} />
            <Section icon={Heart} title="Listening" content={coaching.listening} />
            <Section icon={Sparkles} title="Gospel Connection" content={coaching.gospel_connection} />
            <Section icon={BookOpen} title="Scripture to Study" content={coaching.scripture_to_study} />
            <Section icon={Info} title="Apologetics Resources" content={coaching.apologetics_resources} />

            <button onClick={() => setView('main')} className="btn-primary w-full mt-4">
              <ChevronRight size={16} /> Back to Apologetics
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Practice list view
  if (view === 'practice_list') {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28">
        <header className="flex items-center justify-between px-6 pt-14 safe-top">
          <button onClick={() => setView('main')} className="btn-ghost"><X size={20} /></button>
          <p className="ui-label">Conversation Practice</p><span className="w-10" />
        </header>
        <div className="px-6 mt-4">
          <p className="text-ivory-400 text-sm mb-4">Choose a scenario to practice. The AI will present a realistic objection. You respond naturally, then receive coaching.</p>
          <div className="space-y-2">
            {practiceScenarios.map((s) => (
              <button key={s.id} onClick={() => startPractice(s)}
                className="premium-card p-4 w-full text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group">
                <p className="text-ivory-100 font-medium text-sm">{s.label}</p>
                <p className="text-ivory-500 text-xs mt-0.5">{s.description}</p>
                <p className="text-ivory-600 text-xs mt-2 italic line-clamp-2">"{s.objection}"</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Main view
  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28">
      <header className="flex items-center justify-between px-6 pt-14 safe-top">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Apologetics Coach</p><span className="w-10" />
      </header>
      <div className="px-6 mt-4">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
            <Shield size={18} className="text-gold-300" />
          </div>
          <div>
            <h2 className="font-serif text-2xl text-ivory-50">Apologetics Coach</h2>
            <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Practice thoughtful, respectful Gospel conversations.</p>
          </div>
        </div>

        {/* Conversation practice button */}
        <button onClick={() => { vibrate(8); setView('practice_list'); }}
          className="premium-card p-4 w-full text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <MessageCircle size={17} className="text-gold-300" />
            </div>
            <div className="flex-1">
              <p className="text-ivory-100 font-medium text-sm">Conversation Practice</p>
              <p className="text-ivory-600 text-xs">Practice with AI · Get coaching</p>
            </div>
            <ChevronRight size={16} className="text-ivory-600 group-hover:text-gold-300 transition-colors shrink-0" />
          </div>
        </button>

        {/* Categories */}
        <p className="ui-label mb-3">Training Categories</p>
        <div className="space-y-2">
          {apologeticsCategories.map((cat) => {
            const isExpanded = expandedCategory === cat.id;
            return (
              <div key={cat.id} className="premium-card overflow-hidden">
                <button onClick={() => { vibrate(6); setExpandedCategory(isExpanded ? null : cat.id); }}
                  className="flex items-center justify-between w-full p-4 text-left no-tap-highlight">
                  <div className="flex-1">
                    <p className="text-ivory-100 font-medium text-sm">{cat.label}</p>
                    <p className="text-ivory-500 text-xs mt-0.5">{cat.description}</p>
                  </div>
                  <ChevronDown size={16} className={`text-ivory-500 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 animate-fade-in">
                    <div className="gold-divider mb-3" />
                    <p className="ui-label mb-2">Common Objections</p>
                    <div className="space-y-1.5">
                      {cat.common_objections.map((o, i) => (
                        <div key={i} className="flex items-start gap-2"><span className="text-ivory-600 text-xs mt-0.5">·</span><p className="text-ivory-400 text-sm leading-relaxed italic">"{o}"</p></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-start gap-2 mt-5 px-1">
          <Info size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
          <p className="text-ivory-600 text-xs leading-relaxed">SOLAPATH does not make mock versions of opposing viewpoints. Objections are represented fairly and intelligently. The goal is preparation, not winning imaginary arguments.</p>
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
