import { useState, useEffect, useCallback } from 'react';
import { X, Users, Plus, Sparkles, Lock } from 'lucide-react';
import { vibrate, formatDate } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import { createLegacyEvent, getLegacyEvents, softDeleteLegacyEvent } from '@/lib/legacyEngine';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import type { LegacyEvent } from '@/lib/legacyTypes';

interface Props {
  profile: Profile;
  onBack: () => void;
}

export default function FamilyLegacyScreen({ profile, onBack }: Props) {
  const [events, setEvents] = useState<LegacyEvent[]>([]);
  const [familyWalks, setFamilyWalks] = useState<Array<{ id: string; passage_reference: string; created_at: string }>>([]);
  const [familyPrayers, setFamilyPrayers] = useState<Array<{ id: string; title: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [userText, setUserText] = useState('');
  const [familyRef, setFamilyRef] = useState('');
  const [scripture, setScripture] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [legacyData, walks, prayers] = await Promise.all([
        getLegacyEvents(profile.id, { eventType: 'family_milestone' }),
        supabase.from('family_walks').select('id, passage_reference, created_at').order('created_at', { ascending: false }).limit(20),
        supabase.from('family_prayers').select('id, title, created_at').order('created_at', { ascending: false }).limit(20),
      ]);
      setEvents(legacyData);
      setFamilyWalks((walks.data || []) as Array<{ id: string; passage_reference: string; created_at: string }>);
      setFamilyPrayers((prayers.data || []) as Array<{ id: string; title: string; created_at: string }>);
    } catch {
      setError('Could not load your Family Legacy.');
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!title.trim()) return;
    vibrate(10);
    await createLegacyEvent(profile.id, 'family_milestone', title, new Date().toISOString().slice(0, 10), 'family', {
      userText: userText || undefined,
      familyMemberReference: familyRef || undefined,
      scriptureReferences: scripture ? [scripture] : undefined,
    });
    setShowAdd(false);
    setTitle(''); setUserText(''); setFamilyRef(''); setScripture('');
    load();
  };

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Family Legacy</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Users size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">FAMILY LEGACY</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Parent-controlled. Your family's story of faith.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading..." />}
          {error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && !showAdd && (
            <>
              {events.length === 0 && familyWalks.length === 0 && familyPrayers.length === 0 ? (
                <div className="premium-card p-6 text-center mb-4">
                  <p className="text-ivory-400 text-sm">No Family Legacy records yet.</p>
                  <p className="text-ivory-600 text-xs mt-2 leading-relaxed">Add family prayers, Family Walk milestones, or children's theological questions to your Legacy.</p>
                </div>
              ) : (
                <div className="space-y-4 mb-4">
                  {events.length > 0 && (
                    <div>
                      <p className="ui-label mb-2">Family Milestones</p>
                      <div className="space-y-2">
                        {events.map(e => (
                          <div key={e.id} className="premium-card p-4">
                            <p className="text-ivory-100 font-medium text-sm">{e.title}</p>
                            <p className="text-ivory-600 text-xs mt-0.5">{formatDate(e.event_date)}</p>
                            {e.family_member_reference && <p className="text-ivory-500 text-xs mt-1">Family: {e.family_member_reference}</p>}
                            {e.user_text && <p className="text-ivory-400 text-xs mt-2 leading-relaxed">{e.user_text}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {familyWalks.length > 0 && (
                    <div>
                      <p className="ui-label mb-2">Family Walks (eligible to add)</p>
                      <div className="space-y-1">
                        {familyWalks.map(w => (
                          <div key={w.id} className="premium-card p-3 flex items-center justify-between">
                            <div>
                              <p className="text-ivory-100 text-sm font-medium">{w.passage_reference}</p>
                              <p className="text-ivory-600 text-xs">{formatDate(w.created_at)}</p>
                            </div>
                            <button
                              onClick={async () => {
                                vibrate(8);
                                await createLegacyEvent(profile.id, 'family_walk_milestone', `Family Walk: ${w.passage_reference}`, w.created_at.slice(0, 10), 'family', { sourceId: w.id, scriptureReferences: [w.passage_reference] });
                                load();
                              }}
                              className="btn-secondary text-xs"
                            >Add to Legacy</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {familyPrayers.length > 0 && (
                    <div>
                      <p className="ui-label mb-2">Family Prayers (eligible to add)</p>
                      <div className="space-y-1">
                        {familyPrayers.map(p => (
                          <div key={p.id} className="premium-card p-3 flex items-center justify-between">
                            <div>
                              <p className="text-ivory-100 text-sm font-medium">{p.title}</p>
                              <p className="text-ivory-600 text-xs">{formatDate(p.created_at)}</p>
                            </div>
                            <button
                              onClick={async () => {
                                vibrate(8);
                                await createLegacyEvent(profile.id, 'prayer', `Family Prayer: ${p.title}`, p.created_at.slice(0, 10), 'family', { sourceId: p.id });
                                load();
                              }}
                              className="btn-secondary text-xs"
                            >Add to Legacy</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <button onClick={() => { vibrate(10); setShowAdd(true); }} className="btn-primary w-full">
                <Plus size={16} /> Add Family Legacy Record
              </button>
            </>
          )}

          {showAdd && (
            <div className="premium-card p-5 space-y-3">
              <p className="ui-label">Add Family Legacy Record</p>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Family prayer for new baby" className="input-field" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Family Member (optional)</label>
                <input value={familyRef} onChange={e => setFamilyRef(e.target.value)} placeholder="e.g., My son" className="input-field" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Your Words</label>
                <textarea value={userText} onChange={e => setUserText(e.target.value)} placeholder="Your reflection..." className="input-field min-h-[80px]" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Scripture (optional)</label>
                <input value={scripture} onChange={e => setScripture(e.target.value)} placeholder="e.g., Deuteronomy 6:6-7" className="input-field" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleAdd} className="btn-primary flex-1">Save</button>
                <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <Lock size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              Child-related Legacy records have heightened privacy. Parent controls all inclusion. No Circle, Church, or third-party access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
