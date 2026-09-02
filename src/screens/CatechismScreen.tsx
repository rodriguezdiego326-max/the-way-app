import { useEffect, useState } from 'react';
import {
  X, Scroll, ChevronRight, ChevronDown, BookOpen, Heart,
  Check, ShieldCheck, Info,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate } from '@/lib/utils';
import {
  westminsterShorterCatechism,
  heidelbergCatechism,
  type CatechismQuestion,
} from '@/lib/familyEngine';
import type { FamilyProfile, CatechismProgress, CatechismType } from '@/lib/familyTypes';

interface CatechismScreenProps {
  familyProfile: FamilyProfile | null;
  onBack: () => void;
}

export default function CatechismScreen({ familyProfile, onBack }: CatechismScreenProps) {
  const [selectedType, setSelectedType] = useState<CatechismType>('westminster_shorter');
  const [progress, setProgress] = useState<CatechismProgress[]>([]);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  const catechism = selectedType === 'westminster_shorter' ? westminsterShorterCatechism : heidelbergCatechism;

  useEffect(() => {
    if (familyProfile) loadProgress();
  }, [familyProfile, selectedType]);

  async function loadProgress() {
    if (!familyProfile) return;
    const { data } = await supabase
      .from('catechism_progress')
      .select('*')
      .eq('family_profile_id', familyProfile.id)
      .eq('catechism_type', selectedType)
      .order('question_number', { ascending: true });
    setProgress((data as CatechismProgress[]) || []);
  }

  function isCompleted(qNum: number): boolean {
    return progress.some((p) => p.question_number === qNum && p.completed);
  }

  async function toggleComplete(q: CatechismQuestion) {
    if (!familyProfile) return;
    vibrate(10);

    const existing = progress.find((p) => p.question_number === q.number);
    if (existing) {
      const newCompleted = !existing.completed;
      await supabase.from('catechism_progress').update({
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      }).eq('id', existing.id);
    } else {
      await supabase.from('catechism_progress').insert({
        family_profile_id: familyProfile.id,
        catechism_type: selectedType,
        question_number: q.number,
        question: q.question,
        answer: q.answer,
        scripture_basis: q.scripture_basis,
        explanation: q.explanation,
        discussion_question: q.discussion_question,
        family_application: q.family_application,
        prayer: q.prayer,
        completed: true,
        completed_at: new Date().toISOString(),
      });
    }

    loadProgress();
  }

  const completedCount = progress.filter((p) => p.completed).length;

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost">
          <X size={20} />
        </button>
        <p className="ui-label">Catechism</p>
        <span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Scroll size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Catechism</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">
                Learn the faith together through historic questions and answers.
              </p>
            </div>
          </div>

          {/* Catechism selector */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => {
                vibrate(6);
                setSelectedType('westminster_shorter');
              }}
              className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all no-tap-highlight ${
                selectedType === 'westminster_shorter'
                  ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                  : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
              }`}
            >
              Westminster Shorter
            </button>
            <button
              onClick={() => {
                vibrate(6);
                setSelectedType('heidelberg');
              }}
              className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all no-tap-highlight ${
                selectedType === 'heidelberg'
                  ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                  : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
              }`}
            >
              Heidelberg
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-1.5 rounded-full bg-ink-700/40 overflow-hidden">
              <div
                className="h-full bg-gold-500/40 rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / catechism.length) * 100}%` }}
              />
            </div>
            <p className="text-ivory-500 text-xs">{completedCount}/{catechism.length}</p>
          </div>

          <p className="text-ivory-600 text-xs mb-4 italic">
            Progress sequentially, at your family's pace. This is not a competition.
          </p>

          {/* Questions */}
          <div className="space-y-2">
            {catechism.map((q) => {
              const completed = isCompleted(q.number);
              const isExpanded = expandedQ === q.number;
              return (
                <div key={q.number} className={`premium-card overflow-hidden ${completed ? 'border-sage-500/20' : ''}`}>
                  <button
                    onClick={() => {
                      vibrate(6);
                      setExpandedQ(isExpanded ? null : q.number);
                    }}
                    className="flex items-start justify-between w-full p-4 text-left no-tap-highlight"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        completed ? 'bg-sage-500/10 border border-sage-500/20' : 'bg-ink-700/50'
                      }`}>
                        {completed ? (
                          <Check size={14} className="text-sage-400" />
                        ) : (
                          <span className="text-ivory-500 text-xs font-medium">Q{q.number}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-ivory-100 text-sm font-medium leading-relaxed">{q.question}</p>
                        <p className="text-ivory-400 text-xs mt-1 leading-relaxed italic">{q.answer}</p>
                      </div>
                    </div>
                    <ChevronDown size={16} className={`text-ivory-500 transition-transform shrink-0 mt-1 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 animate-fade-in">
                      <div className="gold-divider mb-3" />

                      {/* Scripture basis */}
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen size={13} className="text-gold-400/60" />
                        <p className="text-ivory-400 text-xs">{q.scripture_basis}</p>
                      </div>

                      {/* Explanation */}
                      <div className="mb-3">
                        <p className="ui-label mb-1">Explain to My Child</p>
                        <p className="text-ivory-300 text-sm leading-relaxed">{q.explanation}</p>
                      </div>

                      {/* Discussion */}
                      <div className="mb-3">
                        <p className="ui-label mb-1">Discuss Together</p>
                        <p className="text-ivory-300 text-sm leading-relaxed">{q.discussion_question}</p>
                      </div>

                      {/* Family application */}
                      <div className="mb-3">
                        <p className="ui-label mb-1">Family Application</p>
                        <p className="text-ivory-300 text-sm leading-relaxed">{q.family_application}</p>
                      </div>

                      {/* Prayer */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Heart size={13} className="text-gold-400/60" />
                          <p className="ui-label">Pray</p>
                        </div>
                        <p className="text-ivory-400 text-xs leading-relaxed italic">{q.prayer}</p>
                      </div>

                      <button
                        onClick={() => toggleComplete(q)}
                        className={`w-full py-2.5 rounded-xl border text-sm font-medium transition-all no-tap-highlight ${
                          completed
                            ? 'bg-sage-500/10 border-sage-500/30 text-sage-400'
                            : 'bg-gold-500/10 border-gold-500/30 text-gold-200'
                        }`}
                      >
                        {completed ? (
                          <>
                            <Check size={14} className="inline mr-1" />
                            Completed
                          </>
                        ) : (
                          'Mark as Completed'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-start gap-2 mt-5 px-1">
            <Info size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed">
              Public-domain catechisms only. No copyrighted modern catechisms are ingested without rights. Verified source text will be added through legal channels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
