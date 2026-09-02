import { useEffect, useState } from 'react';
import { X, Check, Mic, BookOpen, ChevronRight, Sparkles, Lightbulb } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate } from '@/lib/utils';
import type { Walk, TheologicalDepth } from '@/lib/types';

interface BibleModeScreenProps {
  walk: Walk;
  mode: 'physical' | 'in-app';
  theologicalDepth: TheologicalDepth;
  onExit: () => void;
  onReflectionComplete: (walk: Walk) => void;
  onHelpMeUnderstand: (walk: Walk) => void;
}

type Phase = 'intro' | 'reading' | 'reflection1' | 'reflection2' | 'understand' | 'done';

export default function BibleModeScreen({
  walk,
  mode,
  theologicalDepth,
  onExit,
  onReflectionComplete,
  onHelpMeUnderstand,
}: BibleModeScreenProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [reflection1, setReflection1] = useState('');
  const [reflection2, setReflection2] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (phase !== 'reading') return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  function formatElapsed(s: number): string {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }

  async function startBibleTime() {
    vibrate(15);
    setElapsed(0);
    setPhase('reading');
    await supabase
      .from('walks')
      .update({ status: 'reading', started_at: new Date().toISOString() })
      .eq('id', walk.id);
  }

  async function finishReading() {
    vibrate(12);
    setPhase('reflection1');
    await supabase
      .from('walks')
      .update({ status: 'reflecting' })
      .eq('id', walk.id);
  }

  function goToReflection2() {
    vibrate(8);
    setPhase('reflection2');
  }

  function skipToUnderstand() {
    vibrate(8);
    setPhase('understand');
  }

  async function saveAndShowUnderstand() {
    await saveReflections();
    setPhase('understand');
  }

  async function saveAndFinish() {
    await saveReflections();
    setPhase('done');
  }

  async function saveReflections() {
    const combined = [reflection1.trim(), reflection2.trim()].filter(Boolean).join('\n\n');
    if (!combined) return;
    setSaving(true);
    vibrate(10);

    await supabase.from('walk_reflections').insert({
      walk_id: walk.id,
      body: combined,
      input_mode: isRecording ? 'voice' : 'text',
    });

    await supabase
      .from('walks')
      .update({ status: 'complete', finished_at: new Date().toISOString() })
      .eq('id', walk.id);

    setSaving(false);
  }

  function toggleRecording() {
    vibrate(10);
    setIsRecording(!isRecording);
  }

  // INTRO PHASE
  if (phase === 'intro') {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top">
          <button onClick={onExit} className="btn-ghost">
            <X size={20} />
          </button>
          <p className="ui-label">Bible Mode</p>
          <span className="w-10" />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-8">
            <BookOpen size={28} className="text-gold-300" />
          </div>

          <p className="text-xs uppercase tracking-[0.25em] text-gold-400/80 font-medium mb-4">
            Open Your Bible
          </p>

          <h1 className="font-serif text-5xl text-ivory-50 tracking-tight mb-6">
            {walk.passage_reference}
          </h1>

          <div className="gold-divider w-32 mb-6" />

          <p className="text-ivory-300 leading-relaxed max-w-xs mb-3">
            {walk.reading_objective}
          </p>

          {walk.observation_prompt && (
            <p className="text-ivory-500 text-sm italic mt-4 max-w-xs">
              {walk.observation_prompt}
            </p>
          )}

          <div className="flex items-center gap-1.5 text-ivory-600 text-sm mt-8">
            <span>One observation question</span>
          </div>
        </div>

        <div className="px-6 pb-10 safe-bottom">
          <button onClick={startBibleTime} className="btn-primary w-full">
            Start Bible Time
          </button>
          {mode === 'physical' && (
            <p className="text-center text-ivory-600 text-xs mt-4">
              Put your phone down. Open your Bible. Take your time.
            </p>
          )}
        </div>
      </div>
    );
  }

  // READING PHASE — minimal, distraction-free
  if (phase === 'reading') {
    return (
      <div className="app-container bg-ink-950 min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top">
          <span className="text-ivory-600 text-sm tabular-nums">{formatElapsed(elapsed)}</span>
          <button onClick={onExit} className="btn-ghost">
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-ivory-600 mb-6">SOLAPATH</p>
          <h1 className="font-serif text-4xl text-ivory-50 tracking-tight mb-8 animate-fade-in">
            {walk.passage_reference}
          </h1>

          <div className="w-2 h-2 rounded-full bg-gold-400/40 animate-breathe mb-8" />

          <p className="font-serif text-2xl text-ivory-400 italic tracking-wide">
            Take your time.
          </p>
        </div>

        <div className="px-6 pb-10 safe-bottom">
          <button onClick={finishReading} className="btn-primary w-full">
            <Check size={18} />
            I'm Finished
          </button>
        </div>
      </div>
    );
  }

  // REFLECTION 1 — "What stood out to you?"
  if (phase === 'reflection1') {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top">
          <button onClick={onExit} className="btn-ghost">
            <X size={20} />
          </button>
          <p className="ui-label">Reflect</p>
          <span className="w-10" />
        </header>

        <div className="flex-1 px-6 py-8 animate-fade-in">
          <h2 className="font-serif text-3xl text-ivory-50 leading-tight mb-2">
            What stood out to you?
          </h2>
          <p className="text-ivory-500 text-sm mt-1 mb-6">
            Take a moment to reflect. Scripture first, understanding follows.
          </p>

          <textarea
            autoFocus
            value={reflection1}
            onChange={(e) => setReflection1(e.target.value)}
            placeholder="Write what you noticed, what surprised you, what you're wondering about..."
            className="input-field min-h-[160px] resize-none text-base leading-relaxed font-serif"
            style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
          />

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={toggleRecording}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all no-tap-highlight ${
                isRecording
                  ? 'bg-clay-500/20 border-clay-500/40 text-clay-400'
                  : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
              }`}
            >
              <Mic size={16} className={isRecording ? 'animate-pulse' : ''} />
              <span className="text-sm font-medium">
                {isRecording ? 'Recording...' : 'Voice input'}
              </span>
            </button>
            <p className="text-ivory-600 text-xs">
              {isRecording ? 'Voice architecture ready — transcription connects later.' : 'Or type above'}
            </p>
          </div>
        </div>

        <div className="px-6 pb-10 safe-bottom flex flex-col gap-2">
          <button
            onClick={goToReflection2}
            disabled={!reflection1.trim()}
            className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
            <ChevronRight size={18} />
          </button>
          <button onClick={skipToUnderstand} className="btn-ghost text-sm">
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  // REFLECTION 2 — "What is this showing you about God?"
  if (phase === 'reflection2') {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top">
          <button onClick={() => setPhase('reflection1')} className="btn-ghost">
            <X size={20} />
          </button>
          <p className="ui-label">Reflect</p>
          <span className="w-10" />
        </header>

        <div className="flex-1 px-6 py-8 animate-fade-in">
          <h2 className="font-serif text-3xl text-ivory-50 leading-tight mb-2">
            What do you think this passage is showing you about God?
          </h2>
          <p className="text-ivory-500 text-sm mt-1 mb-6">
            Before SOLAPATH offers any explanation, sit with the text yourself.
          </p>

          <textarea
            autoFocus
            value={reflection2}
            onChange={(e) => setReflection2(e.target.value)}
            placeholder="What does this passage reveal about God's character, His promises, His ways?"
            className="input-field min-h-[160px] resize-none text-base leading-relaxed font-serif"
            style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
          />
        </div>

        <div className="px-6 pb-10 safe-bottom flex flex-col gap-2">
          <button
            onClick={saveAndShowUnderstand}
            disabled={saving}
            className="btn-primary w-full disabled:opacity-40"
          >
            <Lightbulb size={18} />
            Help Me Understand
          </button>
          <button onClick={saveAndFinish} className="btn-ghost text-sm">
            Save & Finish
          </button>
        </div>
      </div>
    );
  }

  // UNDERSTAND PHASE — AI explanation becomes prominent
  if (phase === 'understand') {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top">
          <button onClick={onExit} className="btn-ghost">
            <X size={20} />
          </button>
          <p className="ui-label">Understanding</p>
          <span className="w-10" />
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 animate-fade-in">
          <h2 className="font-serif text-3xl text-ivory-50 leading-tight mb-4">
            {walk.passage_reference}
          </h2>

          {(reflection1.trim() || reflection2.trim()) && (
            <div className="premium-card p-4 mb-6">
              {reflection1.trim() && (
                <div className="mb-3">
                  <p className="text-[10px] uppercase tracking-wider text-gold-400/60 font-medium mb-1">
                    What stood out
                  </p>
                  <p className="font-serif text-ivory-300 text-sm leading-relaxed italic">
                    {reflection1}
                  </p>
                </div>
              )}
              {reflection2.trim() && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gold-400/60 font-medium mb-1">
                    What this shows about God
                  </p>
                  <p className="font-serif text-ivory-300 text-sm leading-relaxed italic">
                    {reflection2}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="gold-divider mb-6" />

          <div className="flex items-start gap-3 mb-6">
            <Sparkles size={16} className="text-gold-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-ivory-200 text-sm leading-relaxed mb-2">
                You've spent time in Scripture. Now SOLAPATH can help you go deeper — context, Reformed understanding, confessional witness, and application.
              </p>
              <p className="text-ivory-600 text-xs">
                AI Integration Pending — full theological response engine connects here.
              </p>
            </div>
          </div>

          {theologicalDepth === 'deep_study' && (
            <div className="premium-card p-4 mb-4 animate-fade-in">
              <p className="text-gold-300 text-sm font-medium mb-1">Go Deeper</p>
              <p className="text-ivory-500 text-xs leading-relaxed">
                With Deep Study enabled, SOLAPATH will provide confessional material, historical theology, interpretive differences, and carefully used original-language insights.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={() => onHelpMeUnderstand(walk)}
              className="btn-primary w-full"
            >
              <Lightbulb size={18} />
              Help Me Understand This Passage
            </button>
            <button onClick={() => setPhase('done')} className="btn-secondary w-full">
              I'm Good — Finish Walk
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DONE PHASE
  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="animate-scale-in flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-8">
          <Check size={32} className="text-gold-300" />
        </div>

        <h2 className="font-serif text-3xl text-ivory-50 mb-3">
          You opened Scripture today.
        </h2>

        <p className="text-ivory-400 leading-relaxed max-w-xs mb-2">
          {walk.passage_reference}
        </p>
        <p className="text-ivory-500 text-sm">
          {formatElapsed(elapsed)} in the Word
        </p>

        <div className="gold-divider w-24 my-8" />

        <p className="font-serif text-ivory-300 italic text-lg leading-relaxed max-w-xs">
          "The grass withers, the flower fades, but the word of our God will stand forever."
        </p>
        <p className="text-xs text-ivory-600 mt-2">Isaiah 40:8</p>
      </div>

      <div className="mt-10 w-full max-w-xs">
        <button onClick={() => onReflectionComplete(walk)} className="btn-primary w-full">
          Continue
        </button>
      </div>
    </div>
  );
}
