import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Heart, Check, Lock, Users, Clock } from 'lucide-react';
import { vibrate, formatRelative } from '@/lib/utils';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import {
  createSharedPrayer, getSharedPrayers, updatePrayerStatus,
  acknowledgePrayer, getAcknowledgementCount,
} from '@/lib/togetherEngine';
import type { Profile } from '@/lib/types';
import type { Circle, SharedPrayer } from '@/lib/togetherTypes';
import { PRAYER_STATUSES } from '@/lib/togetherTypes';

interface Props {
  profile: Profile;
  circle?: Circle;
  onBack: () => void;
}

export default function PrayerTogetherScreen({ profile, circle, onBack }: Props) {
  const [prayers, setPrayers] = useState<SharedPrayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scripture, setScripture] = useState('');
  const [visibility, setVisibility] = useState<string>(circle ? 'circle' : 'private');
  const [creating, setCreating] = useState(false);
  const [prayedSet, setPrayedSet] = useState<Set<string>>(new Set());
  const [prayerCounts, setPrayerCounts] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSharedPrayers(circle?.id);
      setPrayers(data);
      const counts: Record<string, number> = {};
      const prayed = new Set<string>();
      for (const p of data) {
        counts[p.id] = await getAcknowledgementCount(p.id);
        if (p.profile_id === profile.id) {
          const acks = await getAcknowledgementCount(p.id);
          if (acks > 0) prayed.add(p.id);
        }
      }
      setPrayerCounts(counts);
      setPrayedSet(prayed);
    } catch {
      setError('Could not load prayers.');
    } finally {
      setLoading(false);
    }
  }, [circle?.id, profile.id]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!title.trim()) return;
    vibrate(15);
    setCreating(true);
    try {
      await createSharedPrayer(
        profile.id, title.trim(),
        description.trim() || undefined,
        scripture.trim() || undefined,
        circle?.id,
        visibility,
      );
      setTitle(''); setDescription(''); setScripture('');
      setShowCreate(false);
      await load();
    } catch {
      setError('Could not create prayer.');
    } finally {
      setCreating(false);
    }
  }

  async function handlePrayed(prayerId: string) {
    vibrate(10);
    const wasNew = await acknowledgePrayer(prayerId, profile.id);
    if (wasNew) {
      setPrayedSet((prev) => new Set(prev).add(prayerId));
      setPrayerCounts((prev) => ({ ...prev, [prayerId]: (prev[prayerId] || 0) + 1 }));
    }
  }

  async function handleStatusChange(prayerId: string, status: string) {
    vibrate(8);
    await updatePrayerStatus(prayerId, status);
    setPrayers((prev) => prev.map((p) => p.id === prayerId ? { ...p, status } : p));
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Prayer Together</p>
        <button onClick={() => { vibrate(8); setShowCreate(true); }} className="btn-ghost">
          <Plus size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Heart size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Prayer Together</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Shared prayer requests for {circle ? circle.name : 'your circles'}.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading prayers..." />}
          {error && <ErrorState message={error} onRetry={load} />}
          {!loading && !error && prayers.length === 0 && <EmptyState message="No prayers shared yet." />}

          {!loading && !error && prayers.length > 0 && (
            <div className="flex flex-col gap-3">
              {prayers.map((p) => (
                <div key={p.id} className="premium-card p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <p className="text-ivory-100 font-medium text-sm">{p.title}</p>
                      {p.description && <p className="text-ivory-400 text-xs mt-1 leading-relaxed">{p.description}</p>}
                    </div>
                    {p.visibility === 'private' && <Lock size={12} className="text-ivory-600 shrink-0 mt-1" />}
                  </div>
                  {p.related_scripture && (
                    <p className="text-gold-300/80 text-xs mt-1 font-serif italic">{p.related_scripture}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                      p.status === 'ANSWERED' ? 'bg-sage-500/15 text-sage-400' :
                      p.status === 'CLOSED' ? 'bg-ink-700/40 text-ivory-600' :
                      'bg-gold-500/10 text-gold-300'
                    }`}>{p.status.replace(/_/g, ' ')}</span>
                    <span className="text-ivory-600 text-xs">{formatRelative(p.created_at)}</span>
                  </div>

                  {/* I Prayed For You */}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-ink-700/30">
                    <button
                      onClick={() => handlePrayed(p.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all no-tap-highlight ${
                        prayedSet.has(p.id) ? 'bg-sage-500/10 text-sage-400' : 'bg-ink-700/40 text-ivory-400'
                      }`}
                    >
                      <Heart size={12} className={prayedSet.has(p.id) ? 'fill-sage-400' : ''} />
                      I Prayed For You
                    </button>
                    {prayerCounts[p.id] > 0 && (
                      <p className="text-ivory-600 text-xs">{prayerCounts[p.id]} {prayerCounts[p.id] === 1 ? 'person' : 'people'} prayed for this.</p>
                    )}
                  </div>

                  {/* Status update (only for own prayers) */}
                  {p.profile_id === profile.id && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {PRAYER_STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(p.id, s)}
                          className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                            p.status === s ? 'bg-gold-500/20 text-gold-300' : 'bg-ink-700/30 text-ivory-600'
                          }`}
                        >
                          {s.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <Check size={13} className="text-sage-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              Prayer requests are not guaranteed outcomes. "I Prayed For You" is not a like — it is a quiet commitment to intercede.
            </p>
          </div>
        </div>
      </div>

      {/* Create prayer modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md bg-ink-900 rounded-t-3xl p-6 animate-fade-in-up max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl text-ivory-50">Share a Prayer Request</h3>
              <button onClick={() => setShowCreate(false)} className="btn-ghost"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <p className="ui-label mb-2">Share With</p>
                <div className="flex gap-2">
                  <button onClick={() => { vibrate(6); setVisibility('private'); }} className={`flex-1 px-3 py-2 rounded-xl border text-xs font-medium ${visibility === 'private' ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'}`}>
                    <Lock size={12} className="inline mr-1" /> Keep Private
                  </button>
                  {circle && (
                    <button onClick={() => { vibrate(6); setVisibility('circle'); }} className={`flex-1 px-3 py-2 rounded-xl border text-xs font-medium ${visibility === 'circle' ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'}`}>
                      <Users size={12} className="inline mr-1" /> {circle.name}
                    </button>
                  )}
                </div>
              </div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Prayer title" className="input-field" autoFocus />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What would you like prayer for?" className="input-field min-h-[80px] resize-none text-sm" />
              <input value={scripture} onChange={(e) => setScripture(e.target.value)} placeholder="Related Scripture (optional)" className="input-field" />
              <button onClick={handleCreate} disabled={creating || !title.trim()} className="btn-primary w-full disabled:opacity-40">
                <Plus size={16} /> {creating ? 'Sharing...' : 'Share Prayer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
