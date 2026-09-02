import { useState, useEffect, useCallback } from 'react';
import { X, BookOpen, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { vibrate, formatDate } from '@/lib/utils';
import { LoadingState, EmptyState } from '@/components/States';
import { getSermonNotes } from '@/lib/churchEngine';
import type { Profile } from '@/lib/types';
import type { Sermon, SermonNote } from '@/lib/togetherTypes';

interface Props {
  profile: Profile;
  onBack: () => void;
  onStartWalk: (passage: string) => void;
}

export default function ContinueSundayScreen({ profile, onBack, onStartWalk }: Props) {
  const [yesterdaySermon, setYesterdaySermon] = useState<Sermon | null>(null);
  const [yesterdayNote, setYesterdayNote] = useState<SermonNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [mondayQuestion, setMondayQuestion] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const notes = await getSermonNotes(profile.id);
      if (notes.length > 0) {
        const mostRecent = notes[0];
        const sermonDate = new Date(mostRecent.sermons.date);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - sermonDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
          setYesterdaySermon(mostRecent.sermons);
          setYesterdayNote(mostRecent);
        }
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Continue Sunday</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Calendar size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Continue Sunday</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Carry Sunday's worship into your week.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading..." />}

          {!loading && !yesterdaySermon && <EmptyState message="No recent sermon found. Take notes on Sunday to continue into the week." />}

          {!loading && yesterdaySermon && (
            <>
              <div className="premium-card p-5 mb-4">
                <p className="text-ivory-500 text-xs mb-1">Yesterday your church studied</p>
                <h3 className="font-serif text-2xl text-ivory-50">{yesterdaySermon.passage}</h3>
                {yesterdaySermon.title && <p className="text-ivory-400 text-sm mt-1">{yesterdaySermon.title}</p>}
                <p className="text-ivory-600 text-xs mt-2">{formatDate(yesterdaySermon.date)}</p>
              </div>

              <button onClick={() => { vibrate(12); onStartWalk(yesterdaySermon.passage); }} className="btn-primary w-full mb-4">
                <BookOpen size={16} /> Open {yesterdaySermon.passage} Again
              </button>

              {yesterdayNote?.main_point && (
                <div className="premium-card p-4 mb-4">
                  <p className="text-ivory-500 text-xs mb-1">You wrote that this stood out:</p>
                  <p className="text-ivory-200 text-sm leading-relaxed italic">"{yesterdayNote.main_point}"</p>
                </div>
              )}

              <div className="premium-card p-5 mb-4">
                <p className="text-ivory-300 text-sm leading-relaxed mb-3">How might that truth shape your {new Date().toLocaleDateString('en-US', { weekday: 'long' })}?</p>
                <textarea value={mondayQuestion} onChange={(e) => setMondayQuestion(e.target.value)} placeholder="How this truth applies to my week..." className="input-field min-h-[100px] resize-none text-sm" />
              </div>

              <div className="flex items-start gap-2 mt-5 px-1">
                <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
                <p className="text-ivory-600 text-xs leading-relaxed font-medium">
                  Sunday worship connects to Scripture, weekday discipleship, and real life.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
