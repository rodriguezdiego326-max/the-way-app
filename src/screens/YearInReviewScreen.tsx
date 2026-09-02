import { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Plus, Sparkles, FileText, Eye } from 'lucide-react';
import { vibrate, formatDate } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import { getLegacyEvents, getLifeSeasons, getScriptureRefs, getMilestones, getLetters, upsertYearReview, getYearReview, deleteYearReviewAiSummary } from '@/lib/legacyEngine';
import type { Profile } from '@/lib/types';
import type { LegacyEvent, LegacyLifeSeason, LegacyScriptureRef, LegacyMilestone, LegacyLetter, LegacyYearReview } from '@/lib/legacyTypes';

interface Props {
  profile: Profile;
  onBack: () => void;
}

export default function YearInReviewScreen({ profile, onBack }: Props) {
  const [review, setReview] = useState<LegacyYearReview | null>(null);
  const [events, setEvents] = useState<LegacyEvent[]>([]);
  const [seasons, setSeasons] = useState<LegacyLifeSeason[]>([]);
  const [scripture, setScripture] = useState<LegacyScriptureRef[]>([]);
  const [milestones, setMilestones] = useState<LegacyMilestone[]>([]);
  const [letters, setLetters] = useState<LegacyLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year] = useState(new Date().getFullYear());
  const [showRecords, setShowRecords] = useState(false);
  const [lookingAhead, setLookingAhead] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;
      const [existingReview, allEvents, allSeasons, allScripture, allMilestones, allLetters] = await Promise.all([
        getYearReview(profile.id, year),
        getLegacyEvents(profile.id),
        getLifeSeasons(profile.id),
        getScriptureRefs(profile.id),
        getMilestones(profile.id),
        getLetters(profile.id),
      ]);
      setReview(existingReview);
      setEvents(allEvents.filter(e => e.event_date >= yearStart && e.event_date <= yearEnd));
      setSeasons(allSeasons.filter(s => s.start_date >= yearStart || (s.end_date && s.end_date >= yearStart)));
      setScripture(allScripture.filter(s => s.date_marked >= yearStart && s.date_marked <= yearEnd));
      setMilestones(allMilestones.filter(m => m.milestone_date >= yearStart && m.milestone_date <= yearEnd));
      setLetters(allLetters.filter(l => l.created_at >= yearStart && l.created_at <= yearEnd + 'T23:59:59'));
      if (existingReview?.looking_ahead) setLookingAhead(existingReview.looking_ahead);
    } catch {
      setError('Could not load your Year in Review.');
    } finally {
      setLoading(false);
    }
  }, [profile.id, year]);

  useEffect(() => { load(); }, [load]);

  const recordsUsed = [
    ...events.map(e => ({ type: 'Legacy Event', id: e.id, title: e.title, date: e.event_date })),
    ...seasons.map(s => ({ type: 'Life Season', id: s.id, title: s.title, date: s.start_date })),
    ...scripture.map(s => ({ type: 'Scripture Reflection', id: s.id, title: s.passage_reference, date: s.date_marked })),
    ...milestones.map(m => ({ type: 'Milestone', id: m.id, title: m.title, date: m.milestone_date })),
    ...letters.map(l => ({ type: 'Letter', id: l.id, title: l.recipient_label || 'Letter', date: l.created_at.slice(0, 10) })),
  ];

  const handleSaveLookingAhead = async () => {
    vibrate(10);
    await upsertYearReview(profile.id, year, { looking_ahead: lookingAhead });
    load();
  };

  const handleDeleteAi = async () => {
    vibrate(10);
    await deleteYearReviewAiSummary(profile.id, year);
    load();
  };

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Year in Review</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Calendar size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">{year}</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">A year of God's faithfulness.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading..." />}
          {error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && (
            <>
              {recordsUsed.length === 0 ? (
                <div className="premium-card p-6 text-center">
                  <p className="text-ivory-400 text-sm">No records for {year} yet.</p>
                  <p className="text-ivory-600 text-xs mt-2 leading-relaxed">Add Legacy records throughout the year to see them here.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-4">
                    <YearSection title="Scripture" count={scripture.length} items={scripture.map(s => s.passage_reference)} />
                    <YearSection title="Prayers" count={events.filter(e => e.event_type === 'prayer' || e.event_type === 'answered_prayer').length} items={events.filter(e => e.event_type === 'prayer' || e.event_type === 'answered_prayer').map(e => e.title)} />
                    <YearSection title="Life Seasons" count={seasons.length} items={seasons.map(s => s.title)} />
                    <YearSection title="Milestones" count={milestones.length} items={milestones.map(m => m.title)} />
                    <YearSection title="Letters" count={letters.length} items={letters.map(l => l.recipient_label || 'Letter')} />
                  </div>

                  {review?.ai_year_summary && (
                    <div className="premium-card p-4 mb-4 border-gold-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-gold-300 text-xs font-medium">SOLAPATH Summary of Your Year</p>
                        <button onClick={handleDeleteAi} className="text-ivory-600 text-xs hover:text-error transition-colors">Delete</button>
                      </div>
                      <p className="text-ivory-400 text-xs leading-relaxed whitespace-pre-wrap">{review.ai_year_summary}</p>
                    </div>
                  )}

                  <button
                    onClick={() => { vibrate(8); setShowRecords(!showRecords); }}
                    className="btn-secondary w-full mb-4 text-sm"
                  >
                    <Eye size={14} /> {showRecords ? 'Hide' : 'Show'} Records Used ({recordsUsed.length})
                  </button>

                  {showRecords && (
                    <div className="premium-card p-4 mb-4">
                      <p className="ui-label mb-2">Records Used</p>
                      <div className="space-y-1">
                        {recordsUsed.map((r, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <span className="text-ivory-600 shrink-0">{r.type}</span>
                            <span className="text-ivory-300">— {r.title}</span>
                            <span className="text-ivory-600 ml-auto shrink-0">{formatDate(r.date)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="premium-card p-4 space-y-3">
                    <p className="ui-label">Looking Ahead</p>
                    <textarea value={lookingAhead} onChange={e => setLookingAhead(e.target.value)} placeholder="Your intentions and prayers for the coming year..." className="input-field min-h-[80px]" />
                    <button onClick={handleSaveLookingAhead} className="btn-primary w-full text-sm">Save Looking Ahead</button>
                  </div>
                </>
              )}
            </>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              Generated only from your verified records. AI does not invent missing events or make theological claims about what God was doing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function YearSection({ title, count, items }: { title: string; count: number; items: string[] }) {
  if (count === 0) return null;
  return (
    <div className="premium-card p-4">
      <p className="text-ivory-100 font-medium text-sm">{title}</p>
      <p className="text-ivory-600 text-xs mt-0.5">{count} {count === 1 ? 'item' : 'items'}</p>
      {items.length > 0 && (
        <div className="mt-2 space-y-1">
          {items.slice(0, 5).map((item, i) => (
            <p key={i} className="text-ivory-400 text-xs leading-relaxed">{item}</p>
          ))}
          {items.length > 5 && <p className="text-ivory-600 text-xs">+{items.length - 5} more</p>}
        </div>
      )}
    </div>
  );
}
