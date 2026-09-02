import { useState, useEffect, useCallback } from 'react';
import { X, Heart, Plus, Sparkles } from 'lucide-react';
import { vibrate, formatDate } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import { createLegacyEvent, getLegacyEvents, softDeleteLegacyEvent } from '@/lib/legacyEngine';
import type { Profile } from '@/lib/types';
import type { LegacyEvent } from '@/lib/legacyTypes';

interface Props {
  profile: Profile;
  onBack: () => void;
}

const FAITHFULNESS_TYPES = [
  { id: 'answered_prayer', label: 'Answered Prayer' },
  { id: 'unexpected_provision', label: 'Unexpected Provision' },
  { id: 'meaningful_scripture', label: 'Meaningful Scripture' },
  { id: 'restored_relationship', label: 'Restored Relationship' },
  { id: 'endurance_through_hardship', label: 'Endurance Through Hardship' },
  { id: 'church_community_support', label: 'Church / Community Support' },
  { id: 'spiritual_milestone', label: 'Spiritual Milestone' },
  { id: 'user_testimony', label: 'Testimony' },
];

const WAITING_CATEGORIES = [
  'God answered differently than I hoped',
  'I am still waiting',
  'I don\'t understand this yet',
  'I saw His faithfulness here',
];

export default function GodsFaithfulnessScreen({ profile, onBack }: Props) {
  const [events, setEvents] = useState<LegacyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [userText, setUserText] = useState('');
  const [faithfulnessType, setFaithfulnessType] = useState('answered_prayer');
  const [waitingCategory, setWaitingCategory] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLegacyEvents(profile.id, { eventType: 'spiritual_milestone' });
      const faithfulnessEvents = data.filter(
        e => e.source_type === 'user_created' || e.event_type === 'spiritual_milestone'
      );
      setEvents(faithfulnessEvents);
    } catch {
      setError('Could not load God\'s faithfulness records.');
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!title.trim()) return;
    vibrate(10);
    const fullText = waitingCategory ? `${waitingCategory}\n\n${userText}` : userText;
    await createLegacyEvent(profile.id, 'spiritual_milestone', title, new Date().toISOString().slice(0, 10), 'user_created', {
      userText: fullText,
      summary: FAITHFULNESS_TYPES.find(t => t.id === faithfulnessType)?.label || title,
    });
    setShowAdd(false);
    setTitle(''); setUserText(''); setWaitingCategory('');
    setFaithfulnessType('answered_prayer');
    load();
  };

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">God's Faithfulness</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-sage-500/10 border border-sage-500/20 flex items-center justify-center shrink-0">
              <Heart size={18} className="text-sage-400" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">GOD'S FAITHFULNESS</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Remember what He has done.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading..." />}
          {error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && !showAdd && (
            <>
              {events.length === 0 ? (
                <div className="premium-card p-6 text-center mb-4">
                  <p className="text-ivory-400 text-sm">No records yet.</p>
                  <p className="text-ivory-600 text-xs mt-2 leading-relaxed">Remember an answered prayer, unexpected provision, or moment of endurance.</p>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {events.map((event) => (
                    <div key={event.id} className="premium-card p-4">
                      <p className="text-ivory-100 font-medium text-sm">{event.title}</p>
                      <p className="text-ivory-600 text-xs mt-0.5">{formatDate(event.event_date)}</p>
                      {event.event_type !== 'prayer' && event.event_type !== 'answered_prayer' && event.user_text && <p className="text-ivory-300 text-xs mt-2 leading-relaxed">{event.user_text}</p>}
                      {(event.event_type === 'prayer' || event.event_type === 'answered_prayer') && (
                        <p className="text-ivory-300 text-xs mt-2 leading-relaxed">
                          {event.event_type === 'answered_prayer' ? 'Marked answered.' : 'A prayer was added to your journey.'}
                        </p>
                      )}
                      {event.summary && <p className="text-sage-400/60 text-[10px] uppercase tracking-wider mt-2">{event.summary}</p>}
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => { vibrate(10); setShowAdd(true); }} className="btn-primary w-full">
                <Plus size={16} /> Record God's Faithfulness
              </button>
            </>
          )}

          {showAdd && (
            <div className="premium-card p-5 space-y-3">
              <p className="ui-label">Record God's Faithfulness</p>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Type</label>
                <select value={faithfulnessType} onChange={e => setFaithfulnessType(e.target.value)} className="input-field">
                  {FAITHFULNESS_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., God provided a new job" className="input-field" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">What happened?</label>
                <textarea value={userText} onChange={e => setUserText(e.target.value)} placeholder="Your words..." className="input-field min-h-[80px]" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">How did God answer? (optional)</label>
                <select value={waitingCategory} onChange={e => setWaitingCategory(e.target.value)} className="input-field">
                  <option value="">—</option>
                  {WAITING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
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
              Not only when the outcome was pleasant. God is faithful in waiting, in endurance, and in not yet understanding.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
