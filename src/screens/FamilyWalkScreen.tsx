import { useState } from 'react';
import {
  X, BookOpen, Eye, Lightbulb, MessageCircle, Heart,
  ChevronRight, ChevronDown, Check, Clock, Info, Users, Sparkles,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate } from '@/lib/utils';
import AuthorityLabel from '@/components/AuthorityLabel';
import type { FamilyProfile, AgeRange } from '@/lib/familyTypes';
import type { FamilyWalkRecommendation } from '@/lib/familyEngine';

interface FamilyWalkScreenProps {
  walk: FamilyWalkRecommendation;
  familyProfile: FamilyProfile | null;
  onBack: () => void;
}

type Phase = 'open' | 'observe' | 'understand' | 'ask' | 'apply' | 'pray' | 'complete';

const phases: { id: Phase; label: string; icon: typeof BookOpen }[] = [
  { id: 'open', label: 'Open', icon: BookOpen },
  { id: 'observe', label: 'Observe', icon: Eye },
  { id: 'understand', label: 'Understand', icon: Lightbulb },
  { id: 'ask', label: 'Ask', icon: MessageCircle },
  { id: 'apply', label: 'Apply', icon: Users },
  { id: 'pray', label: 'Pray', icon: Heart },
];

export default function FamilyWalkScreen({ walk, familyProfile, onBack }: FamilyWalkScreenProps) {
  const [phase, setPhase] = useState<Phase>('open');
  const [selectedAge, setSelectedAge] = useState<AgeRange>('6-8');
  const [showParentPrep, setShowParentPrep] = useState(false);
  const [walkStarted, setWalkStarted] = useState(false);

  const ageLabels: { id: AgeRange; label: string }[] = [
    { id: '3-5', label: '3–5' },
    { id: '6-8', label: '6–8' },
    { id: '9-12', label: '9–12' },
    { id: '13-15', label: '13–15' },
    { id: '16-17', label: '16–17' },
    { id: '18+', label: 'Adult' },
  ];

  async function startWalk() {
    if (!familyProfile || walkStarted) return;
    setWalkStarted(true);
    vibrate(15);
    await supabase.from('family_walks').insert({
      family_profile_id: familyProfile.id,
      topic: walk.topic,
      passage_reference: walk.passage_reference,
      reading_instruction: walk.reading_instruction,
      parent_prep: walk.parent_prep.main_truth,
      main_truth: walk.parent_prep.main_truth,
      biblical_context: walk.parent_prep.biblical_context,
      reformed_foundation: walk.parent_prep.reformed_foundation,
      words_children_may_ask_about: walk.parent_prep.words_children_may_ask_about,
      common_misunderstanding: walk.parent_prep.common_misunderstanding,
      one_thing_to_emphasize: walk.parent_prep.one_thing_to_emphasize,
      age_questions: walk.age_questions,
      application: walk.application,
      prayer_guide: walk.prayer_guide,
      estimated_minutes: walk.estimated_minutes,
      status: 'open',
      started_at: new Date().toISOString(),
    });
  }

  async function completeWalk() {
    vibrate(20);
    if (familyProfile) {
      await supabase.from('family_walks').update({
        status: 'complete',
        finished_at: new Date().toISOString(),
      }).eq('family_profile_id', familyProfile.id).order('created_at', { ascending: false }).limit(1);
    }
    setPhase('complete');
  }

  if (phase === 'complete') {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-sage-500/10 border border-sage-500/20 flex items-center justify-center mb-5 animate-fade-in">
          <Check size={28} className="text-sage-400" />
        </div>
        <h2 className="font-serif text-2xl text-ivory-50 mb-2 text-center">Family Walk Complete</h2>
        <p className="text-ivory-400 text-sm text-center mb-8 leading-relaxed">
          You read Scripture, discussed God's truth, and prayed together. May God bless your family's walk with Him.
        </p>
        <button onClick={onBack} className="btn-primary">
          <BookOpen size={18} />
          Back to Family
        </button>
      </div>
    );
  }

  const currentPhaseIndex = phases.findIndex((p) => p.id === phase);
  const ageQuestions = walk.age_questions?.[selectedAge] || [];

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost">
          <X size={20} />
        </button>
        <p className="ui-label">Family Walk</p>
        <span className="w-10" />
      </header>

      <div className="px-6 mt-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={14} className="text-gold-400" />
          <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80 font-medium">
            {walk.is_demo ? 'Demo Family Walk' : 'Family Walk'}
          </p>
        </div>
        <h1 className="font-serif text-3xl text-ivory-50 tracking-tight">{walk.topic}</h1>
        <div className="flex items-center gap-1.5 text-ivory-500 text-sm mt-1">
          <Clock size={13} />
          <span>{walk.estimated_minutes} minutes</span>
        </div>
      </div>

      {/* Phase progress */}
      <div className="px-6 mt-5">
        <div className="flex items-center justify-between gap-1">
          {phases.map((p, i) => {
            const isActive = p.id === phase;
            const isPast = i < currentPhaseIndex;
            return (
              <div key={p.id} className="flex items-center gap-1 flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-gold-500/15 border-gold-500/40 text-gold-300'
                      : isPast
                      ? 'bg-sage-500/10 border-sage-500/20 text-sage-400'
                      : 'bg-ink-800/40 border-ink-700/40 text-ivory-600'
                  }`}
                >
                  {isPast ? <Check size={14} /> : <p.icon size={14} />}
                </div>
                {i < phases.length - 1 && (
                  <div className={`flex-1 h-px ${isPast ? 'bg-sage-500/20' : 'bg-ink-700/40'}`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-2">
          {phases.map((p) => (
            <span
              key={p.id}
              className={`text-[10px] font-medium ${p.id === phase ? 'text-gold-300' : 'text-ivory-600'}`}
            >
              {p.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 mt-6">
        {/* OPEN */}
        {phase === 'open' && (
          <div className="animate-fade-in-up">
            <div className="premium-card p-6 border-gold-500/30">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={18} className="text-gold-300" />
                <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80 font-medium">
                  Open Your Bible
                </p>
              </div>
              <h2 className="font-serif text-3xl text-ivory-50 mb-3">{walk.passage_reference}</h2>
              <p className="text-ivory-300 text-sm leading-relaxed mb-4">
                {walk.reading_instruction}
              </p>
              <p className="text-ivory-500 text-xs leading-relaxed mb-5">
                Have someone in the family read the passage aloud. After reading, pause for a moment of silence before discussing.
              </p>
              <button onClick={startWalk} className="btn-primary w-full">
                <BookOpen size={18} />
                We're Opening Our Bible
              </button>
            </div>

            <p className="text-ivory-600 text-xs text-center mt-3 italic">
              Encourage everyone to put devices down.
            </p>

            {/* Parent Prep */}
            <div className="mt-5">
              <button
                onClick={() => {
                  vibrate(6);
                  setShowParentPrep(!showParentPrep);
                }}
                className="premium-card p-4 w-full text-left no-tap-highlight"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-ink-700/50 flex items-center justify-center">
                      <Lightbulb size={15} className="text-gold-300" />
                    </div>
                    <div>
                      <p className="text-ivory-100 font-medium text-sm">Parent Prep</p>
                      <p className="text-ivory-600 text-xs">2 minutes · Prepare before teaching</p>
                    </div>
                  </div>
                  <ChevronDown size={16} className={`text-ivory-500 transition-transform ${showParentPrep ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {showParentPrep && (
                <div className="mt-2 space-y-2 animate-fade-in">
                  <PrepCard label="Main Truth" content={walk.parent_prep.main_truth} />
                  <PrepCard label="Biblical Context" content={walk.parent_prep.biblical_context} />
                  <PrepCard label="Reformed Foundation" content={walk.parent_prep.reformed_foundation} authority="historic_theology" />
                  <PrepCard label="Words Children May Ask About" content={walk.parent_prep.words_children_may_ask_about} />
                  <PrepCard label="Common Misunderstanding" content={walk.parent_prep.common_misunderstanding} />
                  <PrepCard label="One Thing to Emphasize" content={walk.parent_prep.one_thing_to_emphasize} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* OBSERVE */}
        {phase === 'observe' && (
          <div className="animate-fade-in-up">
            <div className="premium-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Eye size={18} className="text-gold-300" />
                <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80 font-medium">
                  Observe
                </p>
              </div>
              <h3 className="font-serif text-xl text-ivory-50 mb-3">What does the passage actually say?</h3>
              <p className="text-ivory-300 text-sm leading-relaxed mb-4">
                Read {walk.passage_reference} again together. Ask: What do we see? What words or phrases stand out? What is happening in this passage?
              </p>
              <p className="text-ivory-500 text-xs leading-relaxed italic mb-4">
                Do not jump to interpretation yet. Let the text speak for itself first.
              </p>
              <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-ink-800/40 border border-ink-700/30">
                <Info size={12} className="text-gold-400/60 shrink-0 mt-0.5" />
                <p className="text-ivory-500 text-xs leading-relaxed">
                  Tip: Let each family member share one thing they noticed before moving on. Even young children can participate.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* UNDERSTAND */}
        {phase === 'understand' && (
          <div className="animate-fade-in-up">
            <div className="premium-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={18} className="text-gold-300" />
                <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80 font-medium">
                  Understand
                </p>
              </div>
              <h3 className="font-serif text-xl text-ivory-50 mb-3">Theological Guidance for Parents</h3>

              <div className="space-y-3">
                <div>
                  <p className="ui-label mb-1">Main Truth</p>
                  <p className="text-ivory-200 text-sm leading-relaxed">{walk.parent_prep.main_truth}</p>
                </div>
                <div>
                  <p className="ui-label mb-1">Biblical Context</p>
                  <p className="text-ivory-300 text-sm leading-relaxed">{walk.parent_prep.biblical_context}</p>
                </div>
                <div>
                  <p className="ui-label mb-1">Reformed Foundation</p>
                  <div className="flex items-start gap-2 mb-1">
                    <AuthorityLabel level="historic_theology" />
                  </div>
                  <p className="text-ivory-300 text-sm leading-relaxed">{walk.parent_prep.reformed_foundation}</p>
                </div>
                <div>
                  <p className="ui-label mb-1">Common Misunderstanding</p>
                  <p className="text-ivory-400 text-xs leading-relaxed italic">{walk.parent_prep.common_misunderstanding}</p>
                </div>
              </div>

              {walk.is_demo && (
                <p className="text-ivory-600 text-xs mt-4 italic">
                  Development content — verified theological sources connect here.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ASK */}
        {phase === 'ask' && (
          <div className="animate-fade-in-up">
            <div className="premium-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle size={18} className="text-gold-300" />
                <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80 font-medium">
                  Ask
                </p>
              </div>
              <h3 className="font-serif text-xl text-ivory-50 mb-2">Age-Appropriate Discussion Questions</h3>
              <p className="text-ivory-500 text-xs leading-relaxed mb-4">
                The theological truth stays the same. The vocabulary changes.
              </p>

              {/* Age selector */}
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

              {/* Questions for selected age */}
              <div className="space-y-2">
                {ageQuestions.map((q, i) => (
                  <div key={i} className="premium-card p-3 bg-ink-800/30">
                    <p className="text-ivory-200 text-sm leading-relaxed">{q}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 mt-4 px-1">
                <Info size={12} className="text-gold-400/60 shrink-0 mt-0.5" />
                <p className="text-ivory-600 text-xs leading-relaxed">
                  Here's how you can explain this to your child. SOLAPATH equips you to guide the conversation — it does not replace you.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* APPLY */}
        {phase === 'apply' && (
          <div className="animate-fade-in-up">
            <div className="premium-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users size={18} className="text-gold-300" />
                <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80 font-medium">
                  Apply
                </p>
              </div>
              <h3 className="font-serif text-xl text-ivory-50 mb-3">How should this shape our family?</h3>
              <p className="text-ivory-300 text-sm leading-relaxed">{walk.application}</p>
              <div className="mt-4 flex items-start gap-2 px-3 py-2 rounded-xl bg-ink-800/40 border border-ink-700/30">
                <AuthorityLabel level="application" />
              </div>
              <p className="text-ivory-500 text-xs leading-relaxed mt-3 italic">
                This is application, not biblical command. Distinguish what Scripture commands from what it commends as wisdom.
              </p>
            </div>
          </div>
        )}

        {/* PRAY */}
        {phase === 'pray' && (
          <div className="animate-fade-in-up">
            <div className="premium-card p-5 border-gold-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Heart size={18} className="text-gold-300" />
                <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80 font-medium">
                  Pray
                </p>
              </div>
              <h3 className="font-serif text-xl text-ivory-50 mb-3">Pray Together</h3>
              <p className="text-ivory-300 text-sm leading-relaxed italic mb-4">
                {walk.prayer_guide}
              </p>
              <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-ink-800/40 border border-ink-700/30">
                <Info size={12} className="text-gold-400/60 shrink-0 mt-0.5" />
                <p className="text-ivory-500 text-xs leading-relaxed">
                  SOLAPATH guides your family in prayer but does not claim that the AI itself is praying or hearing from God.
                </p>
              </div>
            </div>

            <button onClick={completeWalk} className="btn-primary w-full mt-4">
              <Check size={18} />
              Complete Family Walk
            </button>
          </div>
        )}
      </div>

      {/* Phase navigation */}
      {phase !== 'open' && (
        <div className="shrink-0 px-6 pb-24 safe-bottom flex gap-2">
          {currentPhaseIndex > 0 && (
            <button
              onClick={() => {
                vibrate(6);
                setPhase(phases[currentPhaseIndex - 1].id);
              }}
              className="btn-secondary flex-1 text-sm"
            >
              Back
            </button>
          )}
          {currentPhaseIndex < phases.length - 1 && (
            <button
              onClick={() => {
                vibrate(8);
                setPhase(phases[currentPhaseIndex + 1].id);
              }}
              className="btn-primary flex-1 text-sm"
            >
              {phases[currentPhaseIndex + 1].label}
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      )}

      {/* Open phase — just the next button */}
      {phase === 'open' && walkStarted && (
        <div className="shrink-0 px-6 pb-24 safe-bottom">
          <button
            onClick={() => {
              vibrate(8);
              setPhase('observe');
            }}
            className="btn-primary w-full text-sm"
          >
            We've Read the Passage
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function PrepCard({
  label,
  content,
  authority,
}: {
  label: string;
  content: string;
  authority?: 'scripture' | 'historic_theology' | 'explanation' | 'application';
}) {
  return (
    <div className="premium-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <p className="ui-label">{label}</p>
        {authority && <AuthorityLabel level={authority} />}
      </div>
      <p className="text-ivory-300 text-sm leading-relaxed">{content}</p>
    </div>
  );
}
