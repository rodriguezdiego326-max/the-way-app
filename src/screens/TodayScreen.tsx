import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Sparkles, BookOpen, Clock, ChevronRight, Info, Lock, Loader2, ArrowRight, RotateCw, Quote, Pencil, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { recommendWalk, walkToInsert } from '@/lib/walkEngine';
import { fetchVerses, fetchChapter } from '@/lib/bibleEngine';
import type { Walk, Profile, DailyCheckin, WalkReflection } from '@/lib/types';
import { vibrate } from '@/lib/utils';
import { getBookDisplayName } from '@/lib/bibleTypes';
import type { BibleTranslation } from '@/lib/bibleTypes';
import { Capacitor } from '@capacitor/core';
import {
  isSubstantiveReflection,
  reflectionContainsQuestion,
  generateReflectionResponse,
  saveReflectionAndResponse,
  saveUserReflection,
  updateUserReflectionById,
  loadWalkReflection,
  isWalkPassageLocked,
  type ReflectionContext,
} from '@/lib/reflectionEngine';
import type { StructuredTheologicalResponse } from '@/lib/intelligenceTypes';
import type { AskHandoffContext } from '@/lib/askHandoff';
import { getTodayCopy } from '@/lib/todayCopy';

interface TodayScreenProps {
  profile: Profile | null;
  onStartWalk: (walk: Walk) => void;
  onReadInApp: (walk: Walk) => void;
  onContinueInAsk?: (handoff: AskHandoffContext) => void;
}

const moods = [
  { id: 'joyful', icon: '☀' },
  { id: 'steady', icon: '◐' },
  { id: 'anxious', icon: '◈' },
  { id: 'weary', icon: '◌' },
  { id: 'heavy', icon: '●' },
  { id: 'grieving', icon: '✕' },
  { id: 'angry', icon: '▲' },
  { id: 'unsure', icon: '?' },
];

export default function TodayScreen({ profile, onStartWalk, onReadInApp, onContinueInAsk }: TodayScreenProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [todayWalk, setTodayWalk] = useState<Walk | null>(null);
  const [loading, setLoading] = useState(true);
  const [walkReason, setWalkReason] = useState<string | null>(null);
  const [scriptureText, setScriptureText] = useState<string | null>(null);
  const [scriptureLoading, setScriptureLoading] = useState(false);
  const [heroVerses, setHeroVerses] = useState<string[] | null>(null);
  const [heroShowsTwo, setHeroShowsTwo] = useState(true);
  const [heroLoading, setHeroLoading] = useState(false);
  const heroScriptureRef = useRef<HTMLDivElement>(null);
  const [contextText, setContextText] = useState('');
  const [rememberContext, setRememberContext] = useState(false);
  const [contextSaved, setContextSaved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [walkError, setWalkError] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Reflection Intelligence state (Build 78)
  const [savedReflection, setSavedReflection] = useState<WalkReflection | null>(null);
  const [reflecting, setReflecting] = useState(false);
  const [reflectionResponse, setReflectionResponse] = useState<StructuredTheologicalResponse | null>(null);
  const [reflectionError, setReflectionError] = useState<string | null>(null);
  const [reflectionPromptUsed, setReflectionPromptUsed] = useState<string | null>(null);
  // Edit mode (Build 80) — lets the user replace their saved reflection body.
  const [editingReflection, setEditingReflection] = useState(false);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const contextTextareaRef = useRef<HTMLTextAreaElement>(null);
  const contextInteractionRef = useRef<HTMLDivElement>(null);
  const contextFocusedRef = useRef(false);
  const reflectionSectionRef = useRef<HTMLDivElement>(null);
  // Stale-load guard: when an edit (or AI generation) just persisted a row,
  // a later async loadExistingReflection for a *different* walk_id must not
  // clobber the freshly saved savedReflection. We record the walk id of the
  // most recent successful persistence and skip stale fetches that don't match.
  const savedReflectionWalkIdRef = useRef<string | null>(null);

  const activeTranslation: BibleTranslation = typeof localStorage !== 'undefined' && localStorage.getItem('solapath_translation') === 'RV1909' ? 'RV1909' : 'WEB';

function localizeReference(ref: string, translation: string): string {
  const verseParts = ref.match(/^(.+?)\s+(\d+):(\d+)(?:[\u2013-](\d+))?/);
  if (verseParts) {
    const book = verseParts[1];
    const chapter = verseParts[2];
    const verseStart = verseParts[3];
    const verseEnd = verseParts[4];
    const displayBook = getBookDisplayName(book, translation);
    if (verseEnd) {
      return `${displayBook} ${chapter}:${verseStart}\u2013${verseEnd}`;
    }
    return `${displayBook} ${chapter}:${verseStart}`;
  }
  const chapterParts = ref.match(/^(.+?)\s+(\d+)$/);
  if (chapterParts) {
    const book = chapterParts[1];
    const chapter = chapterParts[2];
    const displayBook = getBookDisplayName(book, translation);
    return `${displayBook} ${chapter}`;
  }
  return ref;
}

  useEffect(() => {
    loadOrCreateTodayWalk();
  }, [profile?.id]);

  async function loadScriptureText(ref: string) {
    setScriptureLoading(true);
    setScriptureText(null);
    try {
      const verseParts = ref.match(/^(.+?)\s+(\d+):(\d+)(?:[–-](\d+))?/);
      if (verseParts) {
        const book = verseParts[1];
        const chapter = parseInt(verseParts[2]);
        const verseStart = parseInt(verseParts[3]);
        const verseEnd = verseParts[4] ? parseInt(verseParts[4]) : verseStart;
        const result = await fetchVerses(book, chapter, verseStart, verseEnd, activeTranslation);
        setScriptureText(result.verses.map((v) => v.text).join(' '));
      } else {
        const chapterParts = ref.match(/^(.+?)\s+(\d+)$/);
        if (chapterParts) {
          const book = chapterParts[1];
          const chapter = parseInt(chapterParts[2]);
          const chap = await fetchChapter(book, chapter, activeTranslation);
          setScriptureText(chap.verses.map((v) => v.text).join(' '));
        }
      }
    } catch { /* non-critical */ }
    setScriptureLoading(false);
  }

  useEffect(() => {
    if (todayWalk?.passage_reference) {
      loadScriptureText(todayWalk.passage_reference);
      // Reset the stale-load guard when we switch to a walk that isn't the one
      // we just persisted, so normal hydration is allowed again.
      if (savedReflectionWalkIdRef.current && savedReflectionWalkIdRef.current !== todayWalk.id) {
        savedReflectionWalkIdRef.current = null;
      }
      loadExistingReflection(todayWalk.id);
    } else {
      savedReflectionWalkIdRef.current = null;
      setSavedReflection(null);
      setReflectionResponse(null);
      setReflectionError(null);
      setReflectionPromptUsed(null);
    }
  }, [todayWalk?.id, todayWalk?.passage_reference, activeTranslation]);

  async function loadExistingReflection(walkId: string) {
    // Skip stale fetches that would overwrite a row we just persisted for a
    // different (e.g. duplicate same-day) walk. The guard is cleared once the
    // fetch matches the most recent persisted walk id.
    if (savedReflectionWalkIdRef.current && savedReflectionWalkIdRef.current !== walkId) {
      return;
    }
    try {
      const existing = await loadWalkReflection(walkId);
      // A same-load concurrent fetch may still have started before the guard
      // was set; re-check after the await to avoid clobbering a fresh save.
      if (savedReflectionWalkIdRef.current && savedReflectionWalkIdRef.current !== walkId) {
        return;
      }
      // Consistency check: if the persisted AI response was generated for a
      // different passage than the walk's current passage, it is stale.
      // Clear it from the database and don't render it.
      if (existing?.ai_response && todayWalk) {
        const storedPassage = existing.ai_response.passage_reference;
        if (storedPassage && storedPassage !== todayWalk.passage_reference) {
          try {
            await supabase
              .from('walk_reflections')
              .update({ ai_response: null })
              .eq('id', existing.id);
          } catch { /* non-critical */ }
          setSavedReflection({ ...existing, ai_response: null });
          setReflectionResponse(null);
          setReflectionPromptUsed(null);
          return;
        }
      }
      setSavedReflection(existing);
      if (existing?.ai_response) {
        const structured = existing.ai_response.structured as StructuredTheologicalResponse | null;
        if (structured) {
          setReflectionResponse(structured);
          setReflectionPromptUsed(existing.ai_response.reflection_prompt || null);
        }
      }
    } catch { /* non-critical */ }
  }

  useLayoutEffect(() => {
    const el = heroScriptureRef.current;
    if (!el || !heroVerses || heroVerses.length < 2 || !heroShowsTwo) return;
    if (el.scrollHeight - el.clientHeight > 1) setHeroShowsTwo(false);
  }, [heroVerses, heroShowsTwo]);

  useEffect(() => {
    if (!todayWalk?.passage_reference) return;
    setHeroLoading(true);
    setHeroVerses(null);
    setHeroShowsTwo(true);
    const ref = todayWalk.passage_reference;
    const verseParts = ref.match(/^(.+?)\s+(\d+):(\d+)(?:[\u2013-](\d+))?/);
    if (verseParts) {
      const book = verseParts[1];
      const chapter = parseInt(verseParts[2]);
      const verseStart = parseInt(verseParts[3]);
      const verseEnd = verseParts[4] ? parseInt(verseParts[4]) : verseStart;
      const heroEnd = Math.min(verseStart + 1, verseEnd);
      fetchVerses(book, chapter, verseStart, heroEnd, activeTranslation)
        .then(({ verses }) => {
          const texts = verses.slice(0, 2).map((v) => v.text).filter(Boolean);
          setHeroVerses(texts.length ? texts : null);
        })
        .catch(() => setHeroVerses(null))
        .finally(() => setHeroLoading(false));
    } else {
      const chapterParts = ref.match(/^(.+?)\s+(\d+)$/);
      if (chapterParts) {
        const book = chapterParts[1];
        const chapter = parseInt(chapterParts[2]);
        fetchChapter(book, chapter, activeTranslation)
          .then((chap) => {
            const texts = chap.verses.slice(0, 2).map((v) => v.text).filter(Boolean);
            setHeroVerses(texts.length ? texts : null);
          })
          .catch(() => setHeroVerses(null))
          .finally(() => setHeroLoading(false));
      } else {
        setHeroLoading(false);
      }
    }
  }, [todayWalk?.passage_reference, activeTranslation]);

  function localDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  async function loadOrCreateTodayWalk() {
    setLoading(true);
    setWalkError(null);
    const walkDate = localDateKey(new Date());

    // Query by canonical walk_date — not created_at DESC.
    const { data: existing, error: existingErr } = await supabase
      .from('walks')
      .select('*')
      .eq('walk_date', walkDate)
      .maybeSingle();

    if (existingErr) {
      setWalkError('Something went wrong loading your walk. Please try again.');
      setLoading(false);
      return;
    }

    if (existing) {
      setTodayWalk(existing as Walk);
      setLoading(false);
      return;
    }

    const { data: recentWalks } = await supabase
      .from('walks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    const rec = await recommendWalk(profile, (recentWalks as Walk[]) || [], new Date(), contextText || null, selectedMood);
    setWalkReason(rec.reason);

    // Atomic insert: if a concurrent call already inserted for this day,
    // the unique constraint fires and we re-read the canonical row.
    const { data: created, error: createErr } = await supabase
      .from('walks')
      .insert(walkToInsert(rec, walkDate))
      .select('*')
      .maybeSingle();

    if (createErr) {
 // Unique violation — a concurrent call won the race. Re-read.
      if (createErr.code === '23505') {
 const { data: retry, error: retryErr } = await supabase
   .from('walks')
   .select('*')
   .eq('walk_date', walkDate)
   .maybeSingle();
 if (retryErr || !retry) {
   setWalkError('Something went wrong loading your walk. Please try again.');
   setLoading(false);
   return;
 }
 setTodayWalk(retry as Walk);
 setLoading(false);
 return;
      }
      setWalkError('We couldn\'t create your walk for today. Please try again.');
      setLoading(false);
      return;
    }

    if (created) {
      setTodayWalk(created as Walk);
    }
    setLoading(false);
  }

  async function updateWalkRecommendation(mood: string, context: string) {
    setRegenerating(true);

    // Passage lock: once the user has a substantive reflection or AI response
    // on this walk, the passage is immutable. Mood/check-in/translation changes
    // must NOT replace the passage beneath existing user content.
    if (todayWalk) {
      const locked = await isWalkPassageLocked(todayWalk.id);
      if (locked) {
        // Still update the recommendation reason for UI feedback, but do NOT
        // overwrite passage_reference, reading_objective, observation_prompt,
        // or estimated_minutes on the locked walk.
        const { data: recentWalks } = await supabase
          .from('walks')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        const rec = await recommendWalk(profile, (recentWalks as Walk[]) || [], new Date(), context || null, mood);
        setWalkReason(rec.reason);
        setRegenerating(false);
        return;
      }
    }

    const { data: recentWalks } = await supabase
      .from('walks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    const rec = await recommendWalk(profile, (recentWalks as Walk[]) || [], new Date(), context || null, mood);
    setWalkReason(rec.reason);

    if (todayWalk) {
      const { data: updated, error: updateErr } = await supabase
        .from('walks')
        .update({
          passage_reference: rec.passage_reference,
          reading_objective: rec.reading_objective,
          observation_prompt: rec.observation_prompt,
          estimated_minutes: rec.estimated_minutes,
        })
        .eq('id', todayWalk.id)
        .select('*')
        .single();

      if (updateErr) {
        setWalkError('We couldn\'t update your walk. Please try again.');
        setRegenerating(false);
        return;
      }

      if (updated) {
        setTodayWalk(updated as Walk);
      }
    } else {
      const walkDate = localDateKey(new Date());
      const { data: existing } = await supabase
        .from('walks')
        .select('*')
        .eq('walk_date', walkDate)
        .maybeSingle();
      if (existing) {
        setTodayWalk(existing as Walk);
      } else {
        const { data: created } = await supabase
          .from('walks')
          .insert(walkToInsert(rec, walkDate))
          .select('*')
          .maybeSingle();
        if (created) setTodayWalk(created as Walk);
      }
    }
    setRegenerating(false);
  }

  async function saveCheckin() {
    if (!selectedMood) return;
    vibrate(10);

    const checkin: Omit<DailyCheckin, 'id' | 'created_at'> = {
      mood: selectedMood,
      context_text: contextText.trim() || null,
      remember_context: rememberContext,
    };

    await supabase.from('daily_checkins').insert(checkin);

    if (rememberContext && contextText.trim() && profile?.memory_enabled) {
      await supabase.from('memories').insert({
        category: 'life',
        content: contextText.trim(),
        source: 'checkin',
        active: true,
        user_confirmed: true,
        sensitivity: 'medium',
      });
    }

    // Persist the user's reflection separately on walk_reflections (no AI response yet).
    if (todayWalk && isSubstantiveReflection(contextText)) {
      try {
        const saved = await saveUserReflection(todayWalk.id, contextText.trim());
        if (saved) setSavedReflection(saved);
      } catch { /* non-critical — reflection still saved in daily_checkins */ }
    }

    setContextSaved(true);
    setTimeout(() => setContextSaved(false), 1500);

    await updateWalkRecommendation(selectedMood, contextText.trim());
  }

  // ============================================================
  // Reflection Intelligence (Build 78)
  // AI is the servant. Scripture is the authority.
  // ============================================================
  async function handleReflectWithSolapath() {
    if (!todayWalk || !hasSavedReflection) return;
    vibrate(12);
    setReflecting(true);
    setReflectionError(null);
    setReflectionResponse(null);

    // Pre-generation consistency check: verify the saved reflection belongs
    // to THIS walk and that any persisted AI response matches the current
    // passage. If the AI response was generated for a different passage
    // (e.g. due to a prior passage mutation), invalidate it.
    if (savedReflection?.walk_id && savedReflection.walk_id !== todayWalk.id) {
      setReflectionError(
        reflLang === 'es'
          ? 'La reflexión guardada no coincide con el walk de hoy. Recarga e inténtalo de nuevo.'
          : 'The saved reflection does not match today\'s walk. Please reload and try again.',
      );
      setReflecting(false);
      return;
    }

    if (savedReflection?.ai_response) {
      const storedPassage = savedReflection.ai_response.passage_reference;
      if (storedPassage && storedPassage !== todayWalk.passage_reference) {
        // Stale AI response from a different passage — clear it.
        try {
          await supabase
            .from('walk_reflections')
            .update({ ai_response: null })
            .eq('id', savedReflection.id);
        } catch { /* non-critical — we just won't use the stale response */ }
        setSavedReflection({ ...savedReflection, ai_response: null });
        setReflectionResponse(null);
        setReflectionPromptUsed(null);
      }
    }

    const ctx: ReflectionContext = {
      passageReference: todayWalk.passage_reference,
      passageText: scriptureText,
      readingObjective: todayWalk.reading_objective,
      observationPrompt: todayWalk.observation_prompt,
      reflectionQuestion: null,
    };

    try {
      const result = await generateReflectionResponse({
        reflection: savedReflectionBody,
        context: ctx,
        profile,
        theologicalDepth: profile?.theological_depth || 'simple',
        translation: activeTranslation,
      });

      const persisted = await saveReflectionAndResponse(
        todayWalk.id,
        savedReflectionBody,
        result,
        ctx,
        activeTranslation,
      );

      setReflectionResponse(result.response);
      setReflectionPromptUsed(result.reflectionPrompt);
      if (persisted) {
        savedReflectionWalkIdRef.current = persisted.walk_id;
        setSavedReflection(persisted);
      }

      // Scroll the response into view after render
      requestAnimationFrame(() => {
        reflectionSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch (err) {
      // User's saved reflection must remain safe — never erased on failure.
      setReflectionError(err instanceof Error ? err.message : 'Could not generate a reflection. Please try again.');
    } finally {
      setReflecting(false);
    }
  }

  function handleRetryReflection() {
    setReflectionError(null);
    handleReflectWithSolapath();
  }

  function handleContinueInAsk() {
    if (!todayWalk || !reflectionResponse || !onContinueInAsk) return;
    vibrate(10);
    const handoff: AskHandoffContext = {
      passageReference: todayWalk.passage_reference,
      userReflection: savedReflectionBody,
      priorResponseSummary: reflectionResponse.answer_summary,
      language: activeTranslation === 'RV1909' ? 'es' : 'en',
    };
    onContinueInAsk(handoff);
  }

  function handleStartEditReflection() {
    if (!hasSavedReflection) return;
    vibrate(8);
    setEditText(savedReflectionBody);
    setEditingReflection(true);
  }

  function handleCancelEdit() {
    vibrate(6);
    setEditingReflection(false);
    setEditText('');
  }

  async function handleSaveEditedReflection() {
    if (!todayWalk || !isSubstantiveReflection(editText)) return;
    const reflectionId = savedReflection?.id;
    if (!reflectionId) {
      setReflectionError(
        reflLang === 'es'
          ? 'No se encontró la reflexión guardada. Recarga e inténtalo de nuevo.'
          : 'Could not find the saved reflection. Please reload and try again.',
      );
      return;
    }
    vibrate(10);
    setSavingEdit(true);
    setReflectionError(null);
    try {
      const verified = await updateUserReflectionById(reflectionId, editText);
      // Only update UI state after read-back verification succeeds.
      savedReflectionWalkIdRef.current = verified.walk_id;
      setSavedReflection(verified);
      if (!verified.ai_response) {
        setReflectionResponse(null);
        setReflectionPromptUsed(null);
      }
      setEditingReflection(false);
      setEditText('');
      requestAnimationFrame(() => {
        reflectionSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch (err) {
      // Fail-closed: keep edit mode open, preserve editText and old AI state.
      setReflectionError(
        err instanceof Error
          ? err.message
          : (reflLang === 'es'
              ? 'No se pudo guardar la reflexión. Inténtalo de nuevo.'
              : 'Could not save the reflection. Please try again.'),
      );
    } finally {
      setSavingEdit(false);
    }
  }

  function handleStartWalk() {
    if (!todayWalk) return;
    vibrate(15);
    onStartWalk(todayWalk);
  }

  function handleReadInApp() {
    if (!todayWalk) return;
    vibrate(10);
    onReadInApp(todayWalk);
  }

  function handleDiveDeeper() {
    if (!todayWalk) return;
    vibrate(10);
    onReadInApp(todayWalk);
  }

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let handles: Array<() => void> = [];
    (async () => {
      try {
        const { Keyboard } = await import('@capacitor/keyboard');
        const willShow = await Keyboard.addListener('keyboardWillShow', (info: { keyboardHeight: number }) => {
          setKeyboardHeight(info.keyboardHeight);
          if (contextFocusedRef.current) {
            requestAnimationFrame(() => {
              const el = contextInteractionRef.current;
              if (!el) return;
              const vv = window.visualViewport;
              const viewportHeight = vv ? vv.height : window.innerHeight;
              const keyboardTop = viewportHeight - info.keyboardHeight;
              const rect = el.getBoundingClientRect();
              const wrapperBottom = rect.bottom;
              const safeMargin = 20;
              if (wrapperBottom > keyboardTop - safeMargin) {
                const scrollDelta = wrapperBottom - (keyboardTop - safeMargin);
                window.scrollBy({ top: scrollDelta, behavior: 'smooth' });
              }
            });
          }
        });
        const didShow = await Keyboard.addListener('keyboardDidShow', (info: { keyboardHeight: number }) => {
          if (contextFocusedRef.current) {
            requestAnimationFrame(() => {
              const el = contextInteractionRef.current;
              if (!el) return;
              const vv = window.visualViewport;
              const viewportHeight = vv ? vv.height : window.innerHeight;
              const keyboardTop = viewportHeight - info.keyboardHeight;
              const rect = el.getBoundingClientRect();
              const wrapperBottom = rect.bottom;
              const safeMargin = 20;
              if (wrapperBottom > keyboardTop - safeMargin) {
                const scrollDelta = wrapperBottom - (keyboardTop - safeMargin);
                window.scrollBy({ top: scrollDelta, behavior: 'smooth' });
              }
            });
          }
        });
        const willHide = await Keyboard.addListener('keyboardWillHide', () => {
          setKeyboardHeight(0);
        });
        handles.push(() => willShow.remove());
        handles.push(() => didShow.remove());
        handles.push(() => willHide.remove());
      } catch { /* non-critical */ }
    })();
    return () => { handles.forEach((h) => h()); };
  }, []);

  function handleContextFocus() {
    contextFocusedRef.current = true;
  }

  function handleContextBlur() {
    contextFocusedRef.current = false;
  }

  const name = profile?.display_name;
  const availableTime = profile?.available_time_minutes ?? 7;

  // Reflection Intelligence display strings (follow active translation language)
  const reflLang = activeTranslation === 'RV1909' ? 'es' : 'en';
  const reflStrings = {
    reflectAction: reflLang === 'es' ? 'Reflexionar con SOLAPATH' : 'Reflect with SOLAPATH',
    continueInAsk: reflLang === 'es' ? 'Continuar en Preguntar' : 'Continue in Ask',
    thinking: reflLang === 'es' ? 'Reflexionando…' : 'Reflecting…',
    errorRetry: reflLang === 'es' ? 'Reintentar' : 'Retry',
    yourReflection: reflLang === 'es' ? 'Tu reflexión' : 'Your reflection',
    solapathReflection: reflLang === 'es' ? 'Reflexión de SOLAPATH' : 'SOLAPATH reflection',
    passageAnchor: reflLang === 'es' ? 'Pasaje de hoy' : 'Today\'s passage',
    editReflection: reflLang === 'es' ? 'Editar reflexión' : 'Edit reflection',
    cancel: reflLang === 'es' ? 'Cancelar' : 'Cancel',
    save: reflLang === 'es' ? 'Guardar' : 'Save',
    editPlaceholder: reflLang === 'es' ? 'Reescribe tu reflexión...' : 'Rewrite your reflection...',
  };
  const copy = getTodayCopy(reflLang);
  const greeting = copy.greeting(new Date().getHours());

  // Canonical visibility derives from the persisted reflection row, not the
  // transient textarea. This keeps the Reflect action and saved reflection
  // visible after Save, across rerenders, and after force-close/reopen.
  const savedReflectionBody = savedReflection?.body ?? '';
  const hasSavedReflection = isSubstantiveReflection(savedReflectionBody);
  const hasQuestion = hasSavedReflection && reflectionContainsQuestion(savedReflectionBody);

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen nav-safe-padding">
      <header className="relative z-10 flex items-start justify-between px-6 pt-10 safe-top">
        <div>
          <p className="font-serif text-xl italic text-ivory-200 animate-fade-in-down">{greeting}{name ? `, ${name}` : ''}</p>
          <h1 className="mt-2 max-w-[260px] font-serif text-5xl font-medium leading-[0.92] tracking-tight text-ivory-50 animate-fade-in-up">
            {copy.titleLines[0]}<br />{copy.titleLines[1]}
          </h1>
        </div>
        <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-full border-2 border-gold-200 bg-gold-100 text-lg font-serif text-ink-50 shadow-sm" aria-label={name ? `${name}'s profile` : 'Your profile'}>
          {(name || 'S').charAt(0).toUpperCase()}
        </div>
      </header>

      <section className="relative -mt-20 h-[440px] overflow-hidden animate-fade-in-up">
        <img
          src="/assets/solapath-scenic-hero.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/30 via-ink-950/15 to-ink-950/40" />
        <div className="absolute inset-x-0 bottom-0 h-[260px] bg-gradient-to-t from-ink-950/95 via-ink-950/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col px-6 pb-6">
          <div ref={heroScriptureRef} className="max-h-[200px] overflow-hidden">
            {heroLoading || !heroVerses ? (
              <p className="max-w-[300px] font-serif text-lg leading-[1.45] text-ivory-300 italic">
                {copy.loadingScripture}
              </p>
            ) : (
              <blockquote className="font-serif text-[1.15rem] leading-[1.45] text-ivory-50 font-medium italic drop-shadow-[0_1px_3px_rgba(31,27,22,0.5)]">
                “{(heroShowsTwo ? heroVerses : heroVerses.slice(0, 1)).join(' ')}”
              </blockquote>
            )}
          </div>
          {todayWalk?.passage_reference && (
            <p className="mt-3 font-serif text-[0.95rem] not-italic text-gold-300 tracking-wide font-medium drop-shadow-[0_1px_2px_rgba(31,27,22,0.4)]">
              {localizeReference(todayWalk.passage_reference, activeTranslation)}
            </p>
          )}
        </div>
      </section>

      <section className="relative z-20 mt-8 px-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center gap-2 mb-3 px-1">
          <BookOpen size={15} className="text-gold-500" />
          <p className="text-xs uppercase tracking-[0.18em] text-ivory-400 font-medium">{copy.readingLabel}</p>
        </div>

        {loading || regenerating ? (
          <div className="premium-card p-6 flex items-center gap-3">
            <Loader2 size={20} className="text-gold-400 animate-spin" />
            <p className="text-ivory-500 text-sm italic">
              {regenerating ? copy.findingScripture : copy.loadingWalk}
            </p>
          </div>
        ) : todayWalk ? (
          <div className="premium-card bg-ink-900 p-5 overflow-hidden relative border border-ink-700/60 shadow-lg shadow-ink-950/20">
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gold-500/5 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={16} className="text-gold-400" />
                <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80 font-medium">
                  {copy.openBible}
                </p>
              </div>

              <h3 className="font-serif text-3xl text-ivory-50 mt-3 mb-1 tracking-tight">
                {localizeReference(todayWalk.passage_reference, activeTranslation)}
              </h3>

              <div className="flex items-center gap-1.5 text-ivory-500 text-sm mb-4">
                <Clock size={13} />
                <span>{copy.minutes(todayWalk.estimated_minutes)}</span>
                {todayWalk.estimated_minutes !== availableTime && (
                  <span className="text-ivory-600 ml-1">{copy.adaptedToTime}</span>
                )}
              </div>

              <p className="text-ivory-300 text-sm leading-relaxed mb-4">
                {todayWalk.reading_objective}
              </p>

              {scriptureLoading ? (
                <div className="flex items-center gap-2 mb-4 px-3 py-3 rounded-xl bg-ink-850/60 border border-ink-700/40">
                  <Loader2 size={14} className="text-gold-400/60 animate-spin" />
                  <p className="text-ivory-400 text-xs italic">{copy.loadingScripture}</p>
                </div>
              ) : scriptureText ? (
                <div className="mb-4 px-3 py-3 rounded-xl bg-ink-850/60 border border-gold-500/20">
                  <p className="font-serif text-[15px] leading-[1.7] text-ivory-100 italic">
                    {scriptureText}
                  </p>
                  <p className="text-gold-400/70 text-[10px] uppercase tracking-wider mt-2">{activeTranslation}</p>
                </div>
              ) : null}

              {walkReason && (
                <div className="flex items-start gap-2 mb-4 px-3 py-2 rounded-xl bg-ink-800/40 border border-ink-700/30">
                  <Info size={12} className="text-gold-400/60 shrink-0 mt-0.5" />
                  <p className="text-ivory-500 text-xs leading-relaxed">{walkReason}</p>
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                <button onClick={handleStartWalk} className="btn-primary w-full">
                  <BookOpen size={18} />
                  {copy.openingBible}
                </button>
                <button onClick={handleDiveDeeper} className="btn-secondary w-full">
                  {copy.diveDeeper}
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : walkError ? (
          <div className="premium-card p-6 text-center">
            <p className="text-ivory-400 text-sm">{walkError}</p>
            <button onClick={() => loadOrCreateTodayWalk()} className="btn-secondary mt-3 text-sm">
              {copy.tryAgain}
            </button>
          </div>
        ) : (
          <div className="premium-card p-6 text-center">
            <p className="text-ivory-400 text-sm">{copy.noWalk}</p>
          </div>
        )}
      </section>

      <section className="px-6 mt-10 animate-fade-in-up" style={{ animationDelay: '0.4s', paddingBottom: keyboardHeight > 0 ? `calc(${keyboardHeight}px + env(safe-area-inset-bottom, 0px) + 20px)` : undefined, transition: 'padding-bottom 0.25s ease-out' }}>
        <h2 className="font-serif text-3xl text-ivory-50 leading-tight mb-5">
          {copy.arriving}
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {moods.map((mood) => (
            <button key={mood.id} onClick={() => { vibrate(8); setSelectedMood(mood.id); setContextText(''); setContextSaved(false); setRememberContext(false); }} className={`mood-chip no-tap-highlight ${selectedMood === mood.id ? 'bg-gold-500/10 border-gold-500/40' : ''}`}>
              <span className={`text-lg ${selectedMood === mood.id ? 'text-gold-300' : 'text-ivory-500'}`}>{mood.icon}</span>
              <span className={`text-[11px] font-medium ${selectedMood === mood.id ? 'text-ivory-50' : 'text-ivory-400'}`}>{copy.moods[mood.id]}</span>
            </button>
          ))}
        </div>
        {selectedMood && !contextSaved && (
          <div ref={contextInteractionRef} className="mt-4 animate-fade-in-up">
            <textarea ref={contextTextareaRef} autoFocus value={contextText} onChange={(e) => setContextText(e.target.value)} onFocus={handleContextFocus} onBlur={handleContextBlur} placeholder={copy.contextPlaceholder} className="input-field min-h-[80px] resize-none text-sm" />
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-2"><Lock size={12} className="text-ivory-600" /><button onClick={() => { vibrate(6); setRememberContext(!rememberContext); }} className={`relative w-11 h-6 rounded-full transition-all duration-300 shrink-0 ${rememberContext ? 'bg-gold-500/40' : 'bg-ink-700'}`}><span className={`absolute top-0.5 w-5 h-5 rounded-full bg-ivory-100 transition-all duration-300 ${rememberContext ? 'left-[22px]' : 'left-0.5'}`} /></button></div>
              <p className="text-ivory-600 text-xs">{rememberContext ? copy.rememberOn : copy.rememberOff}</p>
              <div className="flex-1" /><button onClick={saveCheckin} disabled={regenerating} className="btn-secondary px-4 py-2.5 text-sm disabled:opacity-40">{regenerating ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />{copy.findingScriptureInline}</span> : contextSaved ? copy.saved : copy.save}</button>
            </div>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* Reflection Intelligence (Build 78)                           */}
      {/* AI is the servant. Scripture is the authority.              */}
      {/* Visibility keys off the persisted savedReflection row, not  */}
      {/* the transient textarea, so it survives Save/rerender/reload.*/}
      {/* ============================================================ */}
      {hasSavedReflection && (
        <section ref={reflectionSectionRef} className="px-6 mt-8 animate-fade-in-up">
          {/* Edit mode — rewrite or replace the saved reflection */}
          {editingReflection && (
            <div className="premium-card p-5 mb-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-ivory-600 font-medium mb-3">
                {reflStrings.editReflection}
              </p>
              <textarea
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder={reflStrings.editPlaceholder}
                className="input-field min-h-[100px] resize-none text-sm"
              />
              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={savingEdit}
                  className="btn-secondary px-4 py-2.5 text-sm disabled:opacity-40"
                >
                  <X size={14} />
                  {reflStrings.cancel}
                </button>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={handleSaveEditedReflection}
                  disabled={savingEdit || !isSubstantiveReflection(editText)}
                  className="btn-primary px-4 py-2.5 text-sm disabled:opacity-40"
                >
                  {savingEdit ? (
                    <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />{reflStrings.save}</span>
                  ) : reflStrings.save}
                </button>
              </div>
            </div>
          )}

          {/* Reflect with SOLAPATH — subtle, intentional activation */}
          {!editingReflection && !reflectionResponse && !reflecting && (
            <button
              onClick={handleReflectWithSolapath}
              className="w-full premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/40 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
                <Sparkles size={17} className="text-gold-300" />
              </div>
              <div className="flex-1">
                <p className="text-ivory-100 font-medium text-sm">{reflStrings.reflectAction}</p>
                <p className="text-ivory-600 text-xs mt-0.5">
                  {hasQuestion
                    ? (reflLang === 'es' ? 'SOLAPATH puede ayudarte con esta pregunta.' : 'SOLAPATH can help with your question.')
                    : (reflLang === 'es' ? 'Una reflexión anclada en el pasaje de hoy.' : 'A reflection anchored in today\'s passage.')}
                </p>
              </div>
              <ChevronRight size={16} className="text-ivory-600 group-hover:text-gold-300 transition-colors shrink-0" />
            </button>
          )}

          {/* Edit reflection — available whenever a saved reflection is shown
              and no SOLAPATH response is on screen, so the user can revise
              before reflecting. Also reachable from the user-reflection card
              when a response is present. */}
          {!editingReflection && !reflectionResponse && !reflecting && (
            <button
              onClick={handleStartEditReflection}
              className="mt-2 w-full flex items-center justify-center gap-1.5 text-ivory-500 hover:text-gold-300 transition-colors no-tap-highlight text-xs"
            >
              <Pencil size={12} />
              {reflStrings.editReflection}
            </button>
          )}

          {/* Loading — quiet SOLAPATH treatment, no provider/model names */}
          {!editingReflection && reflecting && (
            <div className="premium-card p-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
                <Loader2 size={16} className="text-gold-300 animate-spin" />
              </div>
              <p className="text-ivory-400 text-sm italic">{reflStrings.thinking}</p>
            </div>
          )}

          {/* Failure — user's saved reflection stays safe, retry available */}
          {!editingReflection && reflectionError && !reflecting && (
            <div className="premium-card p-5">
              <p className="text-ivory-400 text-sm leading-relaxed mb-3">{reflectionError}</p>
              <button onClick={handleRetryReflection} className="btn-secondary text-sm">
                <RotateCw size={14} />
                {reflStrings.errorRetry}
              </button>
            </div>
          )}

          {/* Response — user reflection + SOLAPATH reflection, visually distinguished */}
          {!editingReflection && reflectionResponse && !reflecting && (
            <div className="flex flex-col gap-4">
              {/* User reflection */}
              <div className="premium-card p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-ivory-600 font-medium">
                    {reflStrings.yourReflection}
                  </p>
                  <button
                    onClick={handleStartEditReflection}
                    className="flex items-center gap-1 text-[11px] text-ivory-500 hover:text-gold-300 transition-colors no-tap-highlight"
                  >
                    <Pencil size={11} />
                    {reflStrings.editReflection}
                  </button>
                </div>
                <p className="text-ivory-200 text-sm leading-relaxed font-serif italic">
                  “{savedReflectionBody}”
                </p>
              </div>

              {/* SOLAPATH reflection */}
              <div className="premium-card p-5 border-gold-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
                    <Sparkles size={13} className="text-gold-300" />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-gold-400/80 font-medium">
                    {reflStrings.solapathReflection}
                  </p>
                </div>

                {/* Passage anchor label */}
                {todayWalk?.passage_reference && (
                  <p className="text-gold-300/80 text-xs mb-3 font-medium tracking-wide">
                    {reflStrings.passageAnchor}: {localizeReference(todayWalk.passage_reference, activeTranslation)}
                  </p>
                )}

                <p className="text-ivory-100 text-[15px] leading-[1.7] font-serif">
                  {reflectionResponse.answer_summary}
                </p>

                {/* Inline Scripture references in brass accents */}
                {reflectionResponse.inline_references && reflectionResponse.inline_references.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {reflectionResponse.inline_references.map((ref, i) => (
                      <span key={i} className="px-2 py-1 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-200 text-[11px] font-medium">
                        {ref.display_text}
                      </span>
                    ))}
                  </div>
                )}

                {/* Continue in Ask — secondary action */}
                {onContinueInAsk && (
                  <button
                    onClick={handleContinueInAsk}
                    className="mt-5 w-full btn-secondary text-sm"
                  >
                    {reflStrings.continueInAsk}
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="px-6 mt-8 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
        <div className="flex items-start gap-3 px-1">
          <div className="w-1 h-12 rounded-full bg-gradient-to-b from-gold-400/40 to-transparent shrink-0 mt-1" />
          <div>
            <p className="font-serif text-ivory-300 italic text-sm leading-relaxed">
              {copy.quote}
            </p>
            <p className="text-xs text-ivory-600 mt-1.5">{copy.quoteAttribution}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
