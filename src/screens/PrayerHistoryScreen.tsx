import { useState, useEffect, useCallback } from 'react';
import { X, Heart, Plus, Sparkles, BookOpen } from 'lucide-react';
import { vibrate, formatDate } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import { supabase } from '@/lib/supabase';
import { createLegacyEvent, softDeleteLegacyEvent } from '@/lib/legacyEngine';
import { ANSWERED_PRAYER_OPTIONS } from '@/lib/legacyTypes';
import type { Profile } from '@/lib/types';
import type { Prayer } from '@/lib/types';

interface Props {
  profile: Profile;
  onBack: () => void;
}

type PrayerTab = 'active' | 'waiting' | 'answered' | 'continuing' | 'closed';

export default function PrayerHistoryScreen({ profile, onBack }: Props) {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<PrayerTab>('active');
  const [addingToLegacy, setAddingToLegacy] = useState<Prayer | null>(null);
  const [answerType, setAnswerType] = useState('');
  const [reflection, setReflection] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('prayers')
        .select('*')
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      setPrayers((data || []) as Prayer[]);
    } catch {
      setError('Could not load your prayers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredPrayers = prayers.filter(p => {
    switch (tab) {
      case 'active': return p.status === 'praying';
      case 'waiting': return p.status === 'waiting';
      case 'answered': return p.status === 'answered';
      case 'continuing': return p.status === 'praying' && p.created_at < new Date(Date.now() - 7 * 86400000).toISOString();
      case 'closed': return p.status === 'closed';
      default: return true;
    }
  });

  const handleAddToLegacy = async () => {
    if (!addingToLegacy) return;
    vibrate(10);
    const summary = answerType ? `How God answered: ${answerType}` : (reflection.trim() ? reflection.trim().slice(0, 200) : undefined);
    await createLegacyEvent(profile.id, 'answered_prayer', addingToLegacy.title, new Date().toISOString().slice(0, 10), 'prayer', {
      sourceId: addingToLegacy.id,
      summary,
      scriptureReferences: addingToLegacy.related_scripture ? [addingToLegacy.related_scripture] : undefined,
      prayerId: addingToLegacy.id,
    });
    setAddingToLegacy(null);
    setAnswerType('');
    setReflection('');
  };

  const tabs: { id: PrayerTab; label: string }[] = [
    { id: 'active', label: 'Active' },
    { id: 'waiting', label: 'Waiting' },
    { id: 'answered', label: 'Answered' },
    { id: 'continuing', label: 'Continuing' },
    { id: 'closed', label: 'Closed' },
  ];

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Prayer History</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Heart size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">PRAYER HISTORY</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Your prayers through the years.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading prayers..." />}
          {error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && !addingToLegacy && (
            <>
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { vibrate(5); setTab(t.id); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      tab === t.id ? 'bg-gold-500/15 text-gold-300 border border-gold-500/20' : 'bg-ink-800/40 text-ivory-500 border border-transparent'
                    }`}
                  >{t.label}</button>
                ))}
              </div>

              {filteredPrayers.length === 0 ? (
                <div className="premium-card p-6 text-center">
                  <p className="text-ivory-400 text-sm">No prayers in this category.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPrayers.map(prayer => (
                    <div key={prayer.id} className="premium-card p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-ivory-100 font-medium text-sm">{prayer.title}</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                          prayer.status === 'answered' ? 'bg-sage-500/10 text-sage-400' :
                          prayer.status === 'waiting' ? 'bg-clay-500/10 text-clay-400' :
                          'bg-ink-700/40 text-ivory-500'
                        }`}>{prayer.status}</span>
                      </div>
                      <p className="text-ivory-600 text-xs">Started {formatDate(prayer.started_at)}</p>
                      {prayer.related_scripture && <p className="text-gold-300/80 text-xs mt-1 font-medium">{prayer.related_scripture}</p>}
                      <button
                        onClick={() => { vibrate(8); setAddingToLegacy(prayer); }}
                        className="btn-secondary mt-3 text-xs w-full"
                      >Add This Prayer Journey to Legacy</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {addingToLegacy && (
            <div className="premium-card p-5 space-y-3">
              <p className="ui-label">Add to Legacy: {addingToLegacy.title}</p>
              {addingToLegacy.status === 'answered' && (
                <div>
                  <label className="text-ivory-600 text-xs font-medium mb-1 block">How was this prayer answered?</label>
                  <select value={answerType} onChange={e => setAnswerType(e.target.value)} className="input-field">
                    <option value="">—</option>
                    {ANSWERED_PRAYER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">What do you want to remember about this?</label>
                <textarea value={reflection} onChange={e => setReflection(e.target.value)} placeholder="Your reflection..." className="input-field min-h-[80px]" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleAddToLegacy} className="btn-primary flex-1">Add to Legacy</button>
                <button onClick={() => setAddingToLegacy(null)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              Prayers are not automatically added to Legacy. You choose what to remember.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
