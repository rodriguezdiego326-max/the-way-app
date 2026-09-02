import { useEffect, useState } from 'react';
import {
  X, Landmark, ChevronRight, Check, Lock, Info, BookOpen,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate } from '@/lib/utils';
import { journeyPathways } from '@/lib/familyEngine';
import type { FamilyProfile, FamilyJourneyProgress, JourneyPathway } from '@/lib/familyTypes';

interface FamilyJourneyScreenProps {
  familyProfile: FamilyProfile | null;
  onBack: () => void;
}

export default function FamilyJourneyScreen({ familyProfile, onBack }: FamilyJourneyScreenProps) {
  const [progress, setProgress] = useState<FamilyJourneyProgress[]>([]);
  const [selectedPathway, setSelectedPathway] = useState<string>('foundations');

  useEffect(() => {
    if (familyProfile) loadProgress();
  }, [familyProfile]);

  async function loadProgress() {
    if (!familyProfile) return;
    const { data } = await supabase
      .from('family_journey_progress')
      .select('*')
      .eq('family_profile_id', familyProfile.id)
      .order('lesson_number', { ascending: true });
    setProgress((data as FamilyJourneyProgress[]) || []);
  }

  function getLessonStatus(pathway: string, lessonNumber: number): string {
    const p = progress.find((p) => p.pathway === pathway && p.lesson_number === lessonNumber);
    return p?.status || 'not_started';
  }

  async function markLesson(pathway: string, lessonNumber: number, title: string, newStatus: string) {
    if (!familyProfile) return;
    vibrate(10);

    const existing = progress.find((p) => p.pathway === pathway && p.lesson_number === lessonNumber);
    if (existing) {
      await supabase.from('family_journey_progress').update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      }).eq('id', existing.id);
    } else {
      await supabase.from('family_journey_progress').insert({
        family_profile_id: familyProfile.id,
        pathway,
        lesson_number: lessonNumber,
        lesson_title: title,
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      });
    }

    loadProgress();
  }

  const currentPathway = journeyPathways.find((p) => p.id === selectedPathway);
  const completedCount = progress.filter((p) => p.pathway === selectedPathway && p.status === 'completed').length;

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost">
          <X size={20} />
        </button>
        <p className="ui-label">Family Journey</p>
        <span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Landmark size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Family Journey</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">
                Long-term curriculum for family discipleship. Build on each lesson rather than jumping around.
              </p>
            </div>
          </div>

          {/* Pathway selector */}
          <div className="flex flex-wrap gap-2 mb-5">
            {journeyPathways.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  if (!p.available) return;
                  vibrate(6);
                  setSelectedPathway(p.id);
                }}
                disabled={!p.available}
                className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all no-tap-highlight ${
                  selectedPathway === p.id
                    ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                    : p.available
                    ? 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
                    : 'bg-ink-800/20 border-ink-700/20 text-ivory-700 cursor-not-allowed'
                }`}
              >
                {p.available ? p.title : `${p.title}`}
              </button>
            ))}
          </div>

          {/* Current pathway */}
          {currentPathway && (
            <>
              <div className="premium-card p-4 mb-4">
                <h3 className="font-serif text-lg text-ivory-50 mb-1">{currentPathway.title}</h3>
                <p className="text-ivory-500 text-xs leading-relaxed">{currentPathway.description}</p>
                {currentPathway.available && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex-1 h-1.5 rounded-full bg-ink-700/40 overflow-hidden">
                      <div
                        className="h-full bg-gold-500/40 rounded-full transition-all duration-500"
                        style={{ width: `${(completedCount / currentPathway.lessons.length) * 100}%` }}
                      />
                    </div>
                    <p className="text-ivory-500 text-xs">{completedCount}/{currentPathway.lessons.length}</p>
                  </div>
                )}
              </div>

              {/* Lessons */}
              <div className="space-y-2">
                {currentPathway.lessons.map((lesson) => {
                  const status = getLessonStatus(currentPathway.id, lesson.number);
                  const isCompleted = status === 'completed';
                  const isInProgress = status === 'in_progress';
                  return (
                    <div key={lesson.number} className={`premium-card p-4 ${isCompleted ? 'border-sage-500/20' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isCompleted
                            ? 'bg-sage-500/10 border border-sage-500/20'
                            : isInProgress
                            ? 'bg-gold-500/10 border border-gold-500/20'
                            : 'bg-ink-700/50'
                        }`}>
                          {isCompleted ? (
                            <Check size={16} className="text-sage-400" />
                          ) : (
                            <span className="text-ivory-500 text-xs font-medium">{lesson.number}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-ivory-100 text-sm font-medium">{lesson.title}</p>
                          <p className="text-ivory-500 text-xs mt-0.5 leading-relaxed">{lesson.description}</p>

                          {currentPathway.available && (
                            <div className="flex gap-2 mt-3">
                              {!isCompleted && (
                                <button
                                  onClick={() => markLesson(currentPathway.id, lesson.number, lesson.title, 'completed')}
                                  className="btn-secondary text-xs px-3 py-1.5"
                                >
                                  <Check size={12} />
                                  Mark Complete
                                </button>
                              )}
                              {isCompleted && (
                                <button
                                  onClick={() => markLesson(currentPathway.id, lesson.number, lesson.title, 'not_started')}
                                  className="btn-ghost text-xs"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        {!currentPathway.available && (
                          <Lock size={14} className="text-ivory-700 shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!currentPathway.available && (
                <div className="flex items-start gap-2 mt-4 px-1">
                  <Info size={13} className="text-ivory-600 shrink-0 mt-0.5" />
                  <p className="text-ivory-600 text-xs leading-relaxed">
                    This pathway is coming soon. SOLAPATH is building reusable journey architecture for future pathways.
                  </p>
                </div>
              )}

              <div className="flex items-start gap-2 mt-5 px-1">
                <BookOpen size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
                <p className="text-ivory-600 text-xs leading-relaxed">
                  Family Walks build upon one another. This is discipleship, not content consumption.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
