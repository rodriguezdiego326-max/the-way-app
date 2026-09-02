import { useState, useEffect, useCallback } from 'react';
import { X, BookOpen, Plus, Sparkles, Map } from 'lucide-react';
import { vibrate, formatDate } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import { createScriptureRef, getScriptureRefs, getScriptureMap, softDeleteScriptureRef, getLifeSeasons } from '@/lib/legacyEngine';
import type { Profile } from '@/lib/types';
import type { LegacyScriptureRef, ScriptureMapEntry, LegacyLifeSeason } from '@/lib/legacyTypes';

interface Props {
  profile: Profile;
  onBack: () => void;
}

export default function ScriptureThatCarriedMeScreen({ profile, onBack }: Props) {
  const [refs, setRefs] = useState<LegacyScriptureRef[]>([]);
  const [map, setMap] = useState<ScriptureMapEntry[]>([]);
  const [seasons, setSeasons] = useState<LegacyLifeSeason[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');

  const [passage, setPassage] = useState('');
  const [book, setBook] = useState('');
  const [why, setWhy] = useState('');
  const [reflection, setReflection] = useState('');
  const [seasonId, setSeasonId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [scriptureRefs, scriptureMap, lifeSeasons] = await Promise.all([
        getScriptureRefs(profile.id),
        getScriptureMap(profile.id),
        getLifeSeasons(profile.id),
      ]);
      setRefs(scriptureRefs);
      setMap(scriptureMap);
      setSeasons(lifeSeasons);
    } catch {
      setError('Could not load your Scripture records.');
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!passage.trim() || !book.trim()) return;
    vibrate(10);
    await createScriptureRef(profile.id, passage, book, new Date().toISOString().slice(0, 10), {
      lifeSeasonId: seasonId || undefined,
      whyItMattered: why || undefined,
      userReflection: reflection || undefined,
    });
    setShowAdd(false);
    setPassage(''); setBook(''); setWhy(''); setReflection(''); setSeasonId('');
    load();
  };

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Scripture That Carried Me</p>
        <button
          onClick={() => { vibrate(5); setView(view === 'list' ? 'map' : 'list'); }}
          className="btn-ghost"
        >{view === 'list' ? <Map size={18} /> : <BookOpen size={18} />}</button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <BookOpen size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">SCRIPTURE THAT CARRIED ME</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Passages that became significant.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading..." />}
          {error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && view === 'map' && (
            <div className="space-y-2 mb-4">
              <p className="ui-label mb-2">My Scripture Map</p>
              {map.length === 0 ? (
                <p className="text-ivory-600 text-xs">No Scripture marked yet.</p>
              ) : (
                map.map(entry => (
                  <div key={entry.book} className="premium-card p-3 flex items-center justify-between">
                    <p className="text-ivory-100 text-sm font-medium">{entry.book}</p>
                    <span className="text-ivory-500 text-xs">{entry.count} {entry.count === 1 ? 'reference' : 'references'}</span>
                  </div>
                ))
              )}
              <p className="text-ivory-600 text-xs mt-2 leading-relaxed">This is activity history only. Quantity is never interpreted as spiritual maturity.</p>
            </div>
          )}

          {!loading && !error && view === 'list' && !showAdd && (
            <>
              {refs.length === 0 ? (
                <div className="premium-card p-6 text-center mb-4">
                  <p className="text-ivory-400 text-sm">No Scripture marked yet.</p>
                  <p className="text-ivory-600 text-xs mt-2 leading-relaxed">Mark a passage that carried you through a particular season.</p>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {refs.map(ref => (
                    <div key={ref.id} className="premium-card p-4">
                      <p className="text-gold-300 font-medium text-sm">{ref.passage_reference}</p>
                      <p className="text-ivory-600 text-xs mt-0.5">{formatDate(ref.date_marked)}</p>
                      {ref.why_it_mattered && <p className="text-ivory-400 text-xs mt-2 leading-relaxed">Why it mattered: {ref.why_it_mattered}</p>}
                      {ref.user_reflection && <p className="text-ivory-300 text-xs mt-1 leading-relaxed italic">{ref.user_reflection}</p>}
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => { vibrate(10); setShowAdd(true); }} className="btn-primary w-full">
                <Plus size={16} /> Mark Scripture
              </button>
            </>
          )}

          {showAdd && (
            <div className="premium-card p-5 space-y-3">
              <p className="ui-label">Mark Scripture</p>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Passage Reference</label>
                <input value={passage} onChange={e => { setPassage(e.target.value); setBook(e.target.value.split(' ')[0]); }} placeholder="e.g., Romans 8:28-39" className="input-field" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Book</label>
                <input value={book} onChange={e => setBook(e.target.value)} placeholder="e.g., Romans" className="input-field" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Life Season (optional)</label>
                <select value={seasonId} onChange={e => setSeasonId(e.target.value)} className="input-field">
                  <option value="">—</option>
                  {seasons.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Why It Mattered</label>
                <textarea value={why} onChange={e => setWhy(e.target.value)} placeholder="What was happening when this passage carried you?" className="input-field min-h-[60px]" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Your Reflection</label>
                <textarea value={reflection} onChange={e => setReflection(e.target.value)} placeholder="What did this passage teach you?" className="input-field min-h-[60px]" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleAdd} className="btn-primary flex-1">Save</button>
                <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              References are sufficient. Full Bible text is not displayed unless licensing permits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
