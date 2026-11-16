import { useEffect, useState, useCallback } from 'react';
import { X, Scroll, ChevronDown, BookOpen, Heart, Check, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate } from '@/lib/utils';
import {
  CATECHISM_AGE_BANDS,
  westminsterShorterCatechism,
  heidelbergCatechism,
  type CatechismQuestion,
} from '@/lib/catechismData';
import { catechismAgeWording } from '@/lib/catechismAgeWording';
import { westminsterShorterCatechismEs } from '@/lib/catechismWestminster.es';
import { heidelbergCatechismEs } from '@/lib/catechismHeidelberg.es';
import { getBookDisplayName } from '@/lib/bibleTypes';
import { useLanguage } from '@/lib/i18n';
import type { AgeRange, FamilyProfile, CatechismProgress, CatechismType } from '@/lib/familyTypes';

interface CatechismScreenProps {
  familyProfile: FamilyProfile | null;
  onBack: () => void;
}

const SOURCE_LABEL: Record<CatechismType, string> = {
  westminster_shorter: 'Westminster Shorter Catechism (1647)',
  heidelberg: 'Heidelberg Catechism (1563)',
};

export default function CatechismScreen({ familyProfile, onBack }: CatechismScreenProps) {
  const { language, t } = useLanguage();
  const [selectedType, setSelectedType] = useState<CatechismType>('westminster_shorter');
  const [ageRange, setAgeRange] = useState<AgeRange>('6-8');
  const [progress, setProgress] = useState<CatechismProgress[]>([]);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  const catechism = language === 'es'
    ? (selectedType === 'westminster_shorter' ? westminsterShorterCatechismEs : heidelbergCatechismEs)
    : (selectedType === 'westminster_shorter' ? westminsterShorterCatechism : heidelbergCatechism);

  const sourceLabel = language === 'es'
    ? (selectedType === 'westminster_shorter'
        ? 'Catecismo Menor de Westminster (1647) · traducción de SOLAPATH'
        : 'Catecismo de Heidelberg (1563) · traducción de SOLAPATH')
    : SOURCE_LABEL[selectedType];

  const loadProgress = useCallback(async () => {
    if (!familyProfile) return;
    const { data } = await supabase
      .from('catechism_progress')
      .select('*')
      .eq('family_profile_id', familyProfile.id)
      .eq('catechism_type', selectedType)
      .order('question_number', { ascending: true });
    setProgress((data as CatechismProgress[]) || []);
  }, [familyProfile, selectedType]);

  useEffect(() => {
    if (familyProfile) loadProgress();
  }, [loadProgress, familyProfile]);

  function isCompleted(qNum: number): boolean {
    return progress.some((p) => p.question_number === qNum && p.completed);
  }

  function ageWordingFor(q: CatechismQuestion) {
    // The age-wording file preserves the curated English teaching copy.
    // In Spanish, use the fully translated historic question plus the
    // translated age-appropriate explanation rather than leaking English.
    if (language === 'es' || ageRange === '18+') return null;
    const key = `${selectedType === 'westminster_shorter' ? 'westminster' : 'heidelberg'}-${q.number}`;
    return catechismAgeWording[key]?.[ageRange] ?? null;
  }

  function localizeScriptureBasis(value: string): string {
    if (language !== 'es') return value;
    return value
      .split(';')
      .map((part) => {
        const trimmed = part.trim();
        const match = trimmed.match(/^(.+?)\s+(\d.*)$/);
        if (!match) return trimmed;
        return `${getBookDisplayName(match[1], 'RV1909')} ${match[2]}`;
      })
      .join('; ');
  }

  async function toggleComplete(q: CatechismQuestion) {
    if (!familyProfile) return;
    vibrate(10);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    const existing = progress.find((p) => p.question_number === q.number);
    const newCompleted = existing ? !existing.completed : true;
    const { error } = await supabase.from('catechism_progress').upsert(
      {
        family_profile_id: familyProfile.id,
        user_id: userId,
        catechism_type: selectedType,
        question_number: q.number,
        question: q.question,
        answer: q.answer,
        scripture_basis: q.scripture_basis,
        explanation: q.explanations[ageRange],
        discussion_question: q.discussion_question,
        family_application: q.family_application,
        prayer: q.prayer,
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      },
      { onConflict: 'family_profile_id,catechism_type,question_number' },
    );
    if (error) console.error('[SOLAPATH] Catechism progress save failed:', error.message);

    loadProgress();
  }

  const completedCount = progress.filter((p) => p.completed).length;
  const storedAgeLabel = CATECHISM_AGE_BANDS.find((b) => b.value === ageRange)?.label ?? ageRange;
  const ageLabel = language === 'es' && storedAgeLabel === 'Adult' ? 'Adulto' : storedAgeLabel;

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost">
          <X size={20} />
        </button>
        <p className="ui-label">{language === 'es' ? 'Catecismo' : 'Catechism'}</p>
        <span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Scroll size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">{language === 'es' ? 'Catecismo' : 'Catechism'}</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">
                {language === 'es'
                  ? 'Aprendan juntos la fe por medio de preguntas y respuestas históricas.'
                  : 'Learn the faith together through historic questions and answers.'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mb-5">
            <button
              onClick={() => {
                vibrate(6);
                setSelectedType('westminster_shorter');
                setExpandedQ(null);
              }}
              className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all no-tap-highlight ${
                selectedType === 'westminster_shorter'
                  ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                  : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
              }`}
            >
              {language === 'es' ? 'Westminster' : 'Westminster Shorter'}
            </button>
            <button
              onClick={() => {
                vibrate(6);
                setSelectedType('heidelberg');
                setExpandedQ(null);
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

          <p className="ui-label mb-2">{language === 'es' ? 'Edad de tu hijo' : 'Age of your child'}</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {CATECHISM_AGE_BANDS.map((band) => (
              <button
                key={band.value}
                onClick={() => {
                  vibrate(6);
                  setAgeRange(band.value);
                }}
                aria-pressed={ageRange === band.value}
                className={`px-3.5 py-2 rounded-full border text-xs font-medium transition-all no-tap-highlight ${
                  ageRange === band.value
                    ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                    : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
                }`}
              >
                {language === 'es' && band.label === 'Adult' ? 'Adulto' : band.label}
              </button>
            ))}
          </div>

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
            {language === 'es'
              ? 'Avancen en orden y al ritmo de su familia. Esto no es una competencia.'
              : "Progress sequentially, at your family's pace. This is not a competition."}
          </p>

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
                          <span className="text-ivory-500 text-xs font-medium">{language === 'es' ? 'P' : 'Q'}{q.number}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-ivory-100 text-sm font-medium leading-relaxed">
                          {ageWordingFor(q)?.question ?? t(q.question)}
                        </p>
                      </div>
                    </div>
                    <ChevronDown size={16} className={`text-ivory-500 transition-transform shrink-0 mt-1 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 animate-fade-in">
                      <div className="gold-divider mb-3" />

                      <div className="mb-3 rounded-xl bg-ink-800/40 border border-ink-700/40 p-3">
                        <p className="ui-label mb-1">
                          {language === 'es' ? 'Traducción al español de SOLAPATH' : 'Original Catechism'}
                        </p>
                        <p className="text-ivory-100 text-sm font-medium mb-1">{t(q.question)}</p>
                        <p className="text-ivory-200 text-sm leading-relaxed italic">{t(q.answer)}</p>
                        <p className="text-ivory-600 text-xs mt-2">{sourceLabel}</p>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen size={13} className="text-gold-400/60" />
                        <p className="text-ivory-400 text-xs">{localizeScriptureBasis(q.scripture_basis)}</p>
                      </div>

                      {ageWordingFor(q) && (
                        <div className="mb-3">
                          <p className="ui-label mb-1">For Ages {ageLabel}</p>
                          <p className="text-ivory-100 text-sm font-medium mb-1">{ageWordingFor(q)?.question}</p>
                          <p className="text-ivory-300 text-sm leading-relaxed">{ageWordingFor(q)?.short_answer}</p>
                        </div>
                      )}

                      <div className="mb-3">
                        <p className="ui-label mb-1">
                          {language === 'es'
                            ? `Explicación de SOLAPATH apropiada para la edad (${ageLabel})`
                            : `SOLAPATH Age-Appropriate Explanation (${ageLabel})`}
                        </p>
                        <p className="text-ivory-300 text-sm leading-relaxed">{t(q.explanations[ageRange])}</p>
                      </div>

                      <div className="mb-3">
                        <p className="ui-label mb-1">Discuss Together</p>
                        <p className="text-ivory-300 text-sm leading-relaxed">{t(q.discussion_question)}</p>
                      </div>

                      <div className="mb-3">
                        <p className="ui-label mb-1">Family Application</p>
                        <p className="text-ivory-300 text-sm leading-relaxed">{t(q.family_application)}</p>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Heart size={13} className="text-gold-400/60" />
                          <p className="ui-label">Pray</p>
                        </div>
                        <p className="text-ivory-400 text-xs leading-relaxed italic">{t(q.prayer)}</p>
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
                            {language === 'es' ? 'Completado' : 'Completed'}
                          </>
                        ) : (
                          language === 'es' ? 'Marcar como completado' : 'Mark as Completed'
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
              {language === 'es'
                ? 'El texto histórico se muestra aquí en una traducción al español de SOLAPATH. Cambia a English para ver la redacción histórica original exactamente como está almacenada. Las explicaciones de SOLAPATH no forman parte del texto histórico.'
                : "The original catechism wording is shown exactly as published. SOLAPATH explanations are written to help you teach each question at your child's age and are not part of the historic text."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
