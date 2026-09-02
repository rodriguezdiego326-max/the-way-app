import { useState } from 'react';
import { X, BookOpen, ArrowDown, Lightbulb, HandHeart, ChevronRight } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { retrieveSources } from '@/lib/libraryEngine';
import type { Sermon } from '@/lib/togetherTypes';

interface Props {
  sermon: Sermon;
  onBack: () => void;
}

type Phase = 'stood_out' | 'passage' | 'read_again' | 'remember' | 'examine' | 'apply';

export default function SermonFollowUpScreen({ sermon, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('stood_out');
  const [stoodOut, setStoodOut] = useState('');
  const [readDone, setReadDone] = useState(false);
  const [mainPoint, setMainPoint] = useState('');
  const [examine, setExamine] = useState('');
  const [apply, setApply] = useState('');

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Sermon Follow-Up</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80 font-medium mb-2">{sermon.passage}</p>
            {sermon.title && <h2 className="font-serif text-2xl text-ivory-50">{sermon.title}</h2>}
          </div>

          {phase === 'stood_out' && (
            <div>
              <p className="text-ivory-300 text-sm leading-relaxed mb-4">What stood out from today's sermon?</p>
              <textarea value={stoodOut} onChange={(e) => setStoodOut(e.target.value)} placeholder="What God pressed on your heart..." className="input-field min-h-[100px] resize-none text-sm" autoFocus />
              <button onClick={() => { vibrate(10); setPhase('passage'); }} disabled={!stoodOut.trim()} className="btn-primary w-full mt-4 disabled:opacity-40">Continue</button>
            </div>
          )}

          {phase === 'passage' && (
            <div className="text-center py-8">
              <p className="text-ivory-400 text-sm mb-2">What passage was taught?</p>
              <h3 className="font-serif text-3xl text-ivory-50 mb-6">{sermon.passage}</h3>
              <button onClick={() => { vibrate(10); setPhase('read_again'); }} className="btn-primary">
                <BookOpen size={16} /> Read It Again
              </button>
            </div>
          )}

          {phase === 'read_again' && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-6">
                <BookOpen size={24} className="text-gold-300" />
              </div>
              <p className="text-ivory-300 text-sm leading-relaxed mb-6 max-w-xs mx-auto">Open your Bible to {sermon.passage}. Read it slowly. Let the text speak.</p>
              <button onClick={() => { vibrate(10); setReadDone(true); setPhase('remember'); }} className="btn-primary">
                <ArrowDown size={16} /> I've Read It
              </button>
            </div>
          )}

          {phase === 'remember' && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80 font-medium mb-2">Remember</p>
              <p className="text-ivory-300 text-sm leading-relaxed mb-4">What was the main point?</p>
              <textarea value={mainPoint} onChange={(e) => setMainPoint(e.target.value)} placeholder="The central message..." className="input-field min-h-[80px] resize-none text-sm" autoFocus />
              <button onClick={() => { vibrate(10); setPhase('examine'); }} disabled={!mainPoint.trim()} className="btn-primary w-full mt-4 disabled:opacity-40">Continue</button>
            </div>
          )}

          {phase === 'examine' && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80 font-medium mb-2">Examine</p>
              <p className="text-ivory-300 text-sm leading-relaxed mb-4">How did the sermon connect to the text?</p>
              <textarea value={examine} onChange={(e) => setExamine(e.target.value)} placeholder="Where the sermon and Scripture aligned..." className="input-field min-h-[80px] resize-none text-sm" autoFocus />
              <button onClick={() => { vibrate(10); setPhase('apply'); }} disabled={!examine.trim()} className="btn-primary w-full mt-4 disabled:opacity-40">Continue</button>
            </div>
          )}

          {phase === 'apply' && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80 font-medium mb-2">Apply</p>
              <p className="text-ivory-300 text-sm leading-relaxed mb-4">What should you carry into this week?</p>
              <textarea value={apply} onChange={(e) => setApply(e.target.value)} placeholder="How this truth shapes your Monday..." className="input-field min-h-[80px] resize-none text-sm" autoFocus />
              <button onClick={onBack} disabled={!apply.trim()} className="btn-primary w-full mt-4 disabled:opacity-40">Done</button>

              <div className="flex items-start gap-2 mt-5 px-1">
                <Lightbulb size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
                <p className="text-ivory-600 text-xs leading-relaxed font-medium">
                  SOLAPATH does not automatically judge the pastor or sermon from limited notes. This is your personal follow-up.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
