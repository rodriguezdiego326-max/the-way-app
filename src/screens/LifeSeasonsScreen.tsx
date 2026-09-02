import { useState, useEffect, useCallback } from 'react';
import { X, Clock, Plus, ChevronRight, Sparkles, Calendar } from 'lucide-react';
import { vibrate, formatDate } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import { createLifeSeason, getLifeSeasons, endLifeSeason, softDeleteLifeSeason } from '@/lib/legacyEngine';
import { LIFE_SEASON_PRESETS } from '@/lib/legacyTypes';
import type { Profile } from '@/lib/types';
import type { LegacyLifeSeason } from '@/lib/legacyTypes';

interface Props {
  profile: Profile;
  onBack: () => void;
}

export default function LifeSeasonsScreen({ profile, onBack }: Props) {
  const [seasons, setSeasons] = useState<LegacyLifeSeason[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [reflectSeason, setReflectSeason] = useState<LegacyLifeSeason | null>(null);

  // Create form
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [scripture, setScripture] = useState('');
  const [prayer, setPrayer] = useState('');
  const [learning, setLearning] = useState('');
  const [people, setPeople] = useState('');

  // Reflect form
  const [reflectText, setReflectText] = useState('');
  const [reflectEndDate, setReflectEndDate] = useState(new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLifeSeasons(profile.id);
      setSeasons(data);
    } catch {
      setError('Could not load your Life Seasons.');
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    vibrate(10);
    const season = await createLifeSeason(profile.id, title, startDate, {
      description: description || undefined,
      scripture: scripture || undefined,
      prayer: prayer || undefined,
      whatImLearning: learning || undefined,
      peopleInvolved: people || undefined,
    });
    if (season) {
      setShowCreate(false);
      setTitle(''); setDescription(''); setScripture(''); setPrayer(''); setLearning(''); setPeople('');
      setStartDate(new Date().toISOString().slice(0, 10));
      load();
    }
  };

  const handleEndSeason = async () => {
    if (!reflectSeason) return;
    vibrate(10);
    await endLifeSeason(reflectSeason.id, reflectEndDate, reflectText);
    setReflectSeason(null);
    setReflectText('');
    setReflectEndDate(new Date().toISOString().slice(0, 10));
    load();
  };

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Life Seasons</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Clock size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">LIFE SEASONS</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Mark the seasons of your journey.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading seasons..." />}
          {error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && !showCreate && !reflectSeason && (
            <>
              {seasons.length === 0 ? (
                <div className="premium-card p-6 text-center mb-4">
                  <p className="text-ivory-400 text-sm">No Life Seasons yet.</p>
                  <p className="text-ivory-600 text-xs mt-2 leading-relaxed">Mark a season of transition, growth, waiting, or change.</p>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {seasons.map((season) => (
                    <div key={season.id} className="premium-card p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-ivory-100 font-medium text-sm">{season.title}</p>
                        {season.end_date ? (
                          <span className="px-2 py-0.5 rounded bg-ink-700/40 text-ivory-500 text-[10px]">Completed</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-sage-500/10 text-sage-400 text-[10px] font-medium">Ongoing</span>
                        )}
                      </div>
                      <p className="text-ivory-600 text-xs">{formatDate(season.start_date)}{season.end_date ? ` — ${formatDate(season.end_date)}` : ' — present'}</p>
                      {season.description && <p className="text-ivory-400 text-xs mt-2 leading-relaxed">{season.description}</p>}
                      {season.scripture && <p className="text-gold-300/80 text-xs mt-1 font-medium">{season.scripture}</p>}
                      {season.what_im_learning && <p className="text-ivory-500 text-xs mt-1 leading-relaxed">Learning: {season.what_im_learning}</p>}
                      {season.season_reflection && (
                        <div className="mt-2 pt-2 border-t border-ink-700/40">
                          <p className="text-ivory-500 text-xs leading-relaxed italic">{season.season_reflection}</p>
                        </div>
                      )}
                      {!season.end_date && (
                        <button onClick={() => { vibrate(8); setReflectSeason(season); setReflectText(''); }} className="btn-secondary mt-3 text-xs w-full">
                          Reflect on This Season
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => { vibrate(10); setShowCreate(true); }} className="btn-primary w-full">
                <Plus size={16} /> Start a Life Season
              </button>
            </>
          )}

          {showCreate && (
            <div className="premium-card p-5 space-y-3">
              <p className="ui-label">New Life Season</p>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Career Transition"
                  className="input-field" list="season-presets" />
                <datalist id="season-presets">
                  {LIFE_SEASON_PRESETS.map(p => <option key={p} value={p} />)}
                </datalist>
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is happening in this season?" className="input-field min-h-[60px]" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Scripture</label>
                <input value={scripture} onChange={e => setScripture(e.target.value)} placeholder="e.g., Romans 8:28" className="input-field" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Prayer</label>
                <textarea value={prayer} onChange={e => setPrayer(e.target.value)} placeholder="What are you praying about?" className="input-field min-h-[50px]" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">What I'm Learning</label>
                <textarea value={learning} onChange={e => setLearning(e.target.value)} placeholder="What is God teaching you?" className="input-field min-h-[50px]" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">People Involved</label>
                <input value={people} onChange={e => setPeople(e.target.value)} placeholder="Optional" className="input-field" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleCreate} className="btn-primary flex-1">Create Season</button>
                <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}

          {reflectSeason && (
            <div className="premium-card p-5 space-y-3">
              <p className="ui-label">Reflect on: {reflectSeason.title}</p>
              <p className="text-ivory-500 text-xs leading-relaxed">What happened? What did you pray about? What Scripture mattered most? What did you learn? What changed? What are you still waiting on? Where did you see God's faithfulness?</p>
              <textarea value={reflectText} onChange={e => setReflectText(e.target.value)} placeholder="Your reflection..." className="input-field min-h-[120px]" />
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">End Date</label>
                <input type="date" value={reflectEndDate} onChange={e => setReflectEndDate(e.target.value)} className="input-field" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleEndSeason} className="btn-primary flex-1">Save Reflection</button>
                <button onClick={() => setReflectSeason(null)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              AI may suggest a season, but never silently creates a spiritual narrative. You confirm every season.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
