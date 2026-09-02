import { useState, useEffect, useCallback } from 'react';
import { X, Award, Plus, Sparkles, Church } from 'lucide-react';
import { vibrate, formatDate } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import { createMilestone, getMilestones, softDeleteMilestone } from '@/lib/legacyEngine';
import { MILESTONE_TYPES } from '@/lib/legacyTypes';
import type { Profile } from '@/lib/types';
import type { LegacyMilestone } from '@/lib/legacyTypes';

interface Props {
  profile: Profile;
  onBack: () => void;
}

export default function MilestonesScreen({ profile, onBack }: Props) {
  const [milestones, setMilestones] = useState<LegacyMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [type, setType] = useState('baptism');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [churchName, setChurchName] = useState('');
  const [pastorName, setPastorName] = useState('');
  const [scripture, setScripture] = useState('');
  const [reflection, setReflection] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMilestones(profile.id);
      setMilestones(data);
    } catch {
      setError('Could not load your milestones.');
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    vibrate(10);
    await createMilestone(profile.id, type, title, date, {
      churchName: churchName || undefined,
      pastorName: pastorName || undefined,
      scripture: scripture || undefined,
      reflection: reflection || undefined,
    });
    setShowCreate(false);
    setType('baptism'); setTitle(''); setDate(new Date().toISOString().slice(0, 10));
    setChurchName(''); setPastorName(''); setScripture(''); setReflection('');
    load();
  };

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Milestones</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Award size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">MILESTONES</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Moments worth remembering.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading milestones..." />}
          {error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && !showCreate && (
            <>
              {milestones.length === 0 ? (
                <div className="premium-card p-6 text-center mb-4">
                  <p className="text-ivory-400 text-sm">No milestones recorded.</p>
                  <p className="text-ivory-600 text-xs mt-2 leading-relaxed">Record a baptism, marriage, birth, or significant moment.</p>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {milestones.map(m => (
                    <div key={m.id} className="premium-card p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-ivory-100 font-medium text-sm">{m.title}</p>
                        <span className="px-2 py-0.5 rounded bg-gold-500/10 text-gold-300/80 text-[10px] font-medium shrink-0">
                          {MILESTONE_TYPES.find(t => t.id === m.milestone_type)?.label || m.milestone_type}
                        </span>
                      </div>
                      <p className="text-ivory-600 text-xs">{formatDate(m.milestone_date)}</p>
                      {m.church_name && <p className="text-ivory-500 text-xs mt-1 flex items-center gap-1"><Church size={10} /> {m.church_name}</p>}
                      {m.scripture && <p className="text-gold-300/80 text-xs mt-1 font-medium">{m.scripture}</p>}
                      {m.reflection && <p className="text-ivory-400 text-xs mt-2 leading-relaxed">{m.reflection}</p>}
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => { vibrate(10); setShowCreate(true); }} className="btn-primary w-full">
                <Plus size={16} /> Record a Milestone
              </button>
            </>
          )}

          {showCreate && (
            <div className="premium-card p-5 space-y-3">
              <p className="ui-label">New Milestone</p>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Type</label>
                <select value={type} onChange={e => setType(e.target.value)} className="input-field">
                  {MILESTONE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., My Baptism" className="input-field" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Church (optional)</label>
                <input value={churchName} onChange={e => setChurchName(e.target.value)} placeholder="Church name" className="input-field" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Pastor (optional)</label>
                <input value={pastorName} onChange={e => setPastorName(e.target.value)} placeholder="Pastor name" className="input-field" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Scripture (optional)</label>
                <input value={scripture} onChange={e => setScripture(e.target.value)} placeholder="e.g., Romans 6:4" className="input-field" />
              </div>
              <div>
                <label className="text-ivory-600 text-xs font-medium mb-1 block">Reflection (optional)</label>
                <textarea value={reflection} onChange={e => setReflection(e.target.value)} placeholder="What does this milestone mean to you?" className="input-field min-h-[60px]" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleCreate} className="btn-primary flex-1">Save</button>
                <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              Milestones are never assumed. You create or confirm them. Church admins cannot write directly into your Legacy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
