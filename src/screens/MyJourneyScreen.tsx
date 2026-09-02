import { useState, useEffect, useCallback } from 'react';
import { X, Clock, Plus, ChevronRight, Sparkles, BookOpen } from 'lucide-react';
import { vibrate, formatDate } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import { getLegacyEvents } from '@/lib/legacyEngine';
import { SOURCE_LABELS } from '@/lib/legacyTypes';
import type { Profile } from '@/lib/types';
import type { LegacyEvent } from '@/lib/legacyTypes';

interface Props {
  profile: Profile;
  onBack: () => void;
  onOpenBuildLegacy: () => void;
}

export default function MyJourneyScreen({ profile, onBack, onOpenBuildLegacy }: Props) {
  const [events, setEvents] = useState<LegacyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLegacyEvents(profile.id);
      setEvents(data);
    } catch {
      setError('Could not load your journey.');
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">My Journey</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Clock size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">MY JOURNEY</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">A chronological record of your walk.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading your journey..." />}
          {error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && events.length === 0 && (
            <div className="premium-card p-6 text-center mb-4">
              <p className="text-ivory-400 text-sm">Your journey is empty.</p>
              <p className="text-ivory-600 text-xs mt-2 leading-relaxed">Add a record to begin building your Legacy.</p>
              <button onClick={() => { vibrate(10); onOpenBuildLegacy(); }} className="btn-primary mt-4">
                <Plus size={16} /> Add a Record
              </button>
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="premium-card p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-ivory-100 font-medium text-sm">{event.title}</p>
                      <p className="text-ivory-600 text-xs mt-0.5">{formatDate(event.event_date)}</p>
                    </div>
                    <span className="px-2 py-1 rounded-md bg-ink-700/40 text-ivory-500 text-[10px] font-medium tracking-wider shrink-0">
                      {SOURCE_LABELS[event.source_type] || event.source_type}
                    </span>
                  </div>
                  {(event.event_type === 'prayer' || event.event_type === 'answered_prayer') && (
                    <p className="text-ivory-300 text-xs mt-2 leading-relaxed">
                      {event.event_type === 'answered_prayer' ? 'Marked answered.' : 'A prayer was added to your journey.'}
                    </p>
                  )}
                  {event.event_type !== 'prayer' && event.event_type !== 'answered_prayer' && event.user_text && (
                    <p className="text-ivory-300 text-xs mt-2 leading-relaxed">{event.user_text}</p>
                  )}
                  {event.summary && (
                    <p className="text-ivory-400 text-xs mt-1 leading-relaxed">{event.summary}</p>
                  )}
                  {event.ai_summary && (
                    <div className="mt-2 pt-2 border-t border-ink-700/40">
                      <p className="text-gold-400/60 text-[10px] uppercase tracking-wider font-medium mb-1">SOLAPATH Summary</p>
                      <p className="text-ivory-500 text-xs leading-relaxed">{event.ai_summary}</p>
                    </div>
                  )}
                  {event.scripture_references && event.scripture_references.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {event.scripture_references.map((ref, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-gold-500/10 text-gold-300/80 text-[10px] font-medium">{ref}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              Every record shows its actual source. AI organizes. It does not invent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
