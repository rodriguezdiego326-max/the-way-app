import { useState, useEffect, useCallback } from 'react';
import { X, Heart, Plus, ChevronRight } from 'lucide-react';
import { vibrate, formatRelative } from '@/lib/utils';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import { getMyChurchMembership, getChurch, getChurchGroups, getGroupDiscussions, addGroupDiscussion, createChurchGroup, isChurchOwner } from '@/lib/churchEngine';
import type { Profile } from '@/lib/types';
import type { ChurchGroup, GroupDiscussion } from '@/lib/togetherTypes';

interface Props {
  profile: Profile;
  activeChurchId: string | null;
  onBack: () => void;
}

export default function SmallGroupModeScreen({ profile, activeChurchId, onBack }: Props) {
  const [groups, setGroups] = useState<ChurchGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<ChurchGroup | null>(null);
  const [discussions, setDiscussions] = useState<GroupDiscussion[]>([]);
  const [topic, setTopic] = useState('');
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDay, setNewDay] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let cid = activeChurchId;
      if (!cid) {
        const membership = await getMyChurchMembership(profile.id);
        cid = membership?.church_id || null;
      }
      if (!cid) {
        setLoading(false);
        return;
      }
      const church = await getChurch(cid);
      if (church) {
        const grps = await getChurchGroups(church.id);
        setGroups(grps);
        const owner = await isChurchOwner(profile.id, church.id);
        setIsOwner(owner);
      }
    } catch {
      setError('Could not load groups.');
    } finally {
      setLoading(false);
    }
  }, [profile.id, activeChurchId]);

  useEffect(() => { load(); }, [load]);

  async function handleOpenGroup(group: ChurchGroup) {
    vibrate(10);
    setActiveGroup(group);
    const discs = await getGroupDiscussions(group.id);
    setDiscussions(discs);
  }

  async function handlePost() {
    if (!activeGroup || !topic.trim() || !body.trim()) return;
    vibrate(15);
    setPosting(true);
    try {
      await addGroupDiscussion(activeGroup.id, profile.id, topic.trim(), body.trim());
      setTopic(''); setBody('');
      const discs = await getGroupDiscussions(activeGroup.id);
      setDiscussions(discs);
    } catch { /* ignore */ } finally {
      setPosting(false);
    }
  }

  if (activeGroup) {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setActiveGroup(null)} className="btn-ghost"><X size={20} /></button>
          <p className="ui-label">{activeGroup.name}</p><span className="w-10" />
        </header>

        <div className="flex-1 overflow-y-auto px-6 mt-4">
          <div className="animate-fade-in-up">
            <div className="mb-6">
              <h2 className="font-serif text-2xl text-ivory-50">{activeGroup.name}</h2>
              {activeGroup.description && <p className="text-ivory-500 text-sm mt-1 leading-relaxed">{activeGroup.description}</p>}
              {activeGroup.meeting_day && <p className="text-ivory-600 text-xs mt-2">Meets: {activeGroup.meeting_day}</p>}
            </div>

            <div className="flex flex-col gap-3 mb-4">
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Discussion topic" className="input-field" />
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share your thoughts..." className="input-field min-h-[80px] resize-none text-sm" />
              <button onClick={handlePost} disabled={posting || !topic.trim() || !body.trim()} className="btn-primary disabled:opacity-40">
                <Plus size={16} /> {posting ? 'Posting...' : 'Share'}
              </button>
            </div>

            <p className="ui-label mb-3">Discussion</p>
            {discussions.length === 0 ? (
              <EmptyState message="No discussion yet. Be the first to share." />
            ) : (
              <div className="flex flex-col gap-2">
                {discussions.map((d) => (
                  <div key={d.id} className={`premium-card p-4 ${d.is_ai_summary ? 'border-gold-500/20' : ''}`}>
                    {d.is_ai_summary && (
                      <p className="text-[10px] uppercase tracking-wider text-gold-400/60 font-medium mb-1">AI Summary of Shared Discussion</p>
                    )}
                    <p className="text-ivory-100 font-medium text-sm">{d.topic}</p>
                    <p className="text-ivory-300 text-xs mt-1 leading-relaxed">{d.body}</p>
                    <p className="text-ivory-600 text-xs mt-2">{formatRelative(d.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Small Groups</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Heart size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Small Groups</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Church-connected small groups. Read before gathering, reflect, share, pray.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading..." />}
          {error && <ErrorState message={error} onRetry={load} />}
          {!loading && !error && groups.length === 0 && (
            <div className="premium-card p-6 text-center">
              <p className="text-ivory-400 text-sm">No small groups yet.</p>
              {isOwner ? (
                <>
                  <p className="text-ivory-600 text-xs mt-2 leading-relaxed">Create a small group for your church.</p>
                  <button onClick={() => { vibrate(8); setShowCreate(true); }} className="btn-primary mt-4">
                    <Plus size={16} /> Create Small Group
                  </button>
                </>
              ) : (
                <p className="text-ivory-600 text-xs mt-2 leading-relaxed">Your church hasn't added any small groups yet.</p>
              )}
            </div>
          )}

          {!loading && !error && groups.length > 0 && (
            <>
              <div className="flex flex-col gap-2">
                {groups.map((g) => (
                  <button key={g.id} onClick={() => handleOpenGroup(g)} className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0">
                      <Heart size={16} className="text-ivory-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-ivory-100 font-medium text-sm">{g.name}</p>
                      {g.meeting_day && <p className="text-ivory-600 text-xs">{g.meeting_day}</p>}
                    </div>
                    <ChevronRight size={16} className="text-ivory-600 shrink-0" />
                  </button>
                ))}
              </div>
              {isOwner && (
                <button onClick={() => { vibrate(8); setShowCreate(true); }} className="btn-secondary w-full mt-4 text-sm">
                  <Plus size={16} /> Create Small Group
                </button>
              )}
            </>
          )}


          {showCreate && (
            <div className="premium-card p-5 mt-4 animate-fade-in-up">
              <p className="ui-label mb-3">Create Small Group</p>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Group name" className="input-field mb-3" autoFocus />
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)" className="input-field min-h-[80px] resize-none text-sm mb-3" />
              <input value={newDay} onChange={(e) => setNewDay(e.target.value)} placeholder="Meeting day (optional, e.g. Wednesday)" className="input-field mb-4" />
              <div className="flex gap-2">
                <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                <button
                  onClick={async () => {
                    if (!newName.trim() || creating) return;
                    setCreating(true);
                    vibrate(12);
                    let cid = activeChurchId;
                    if (!cid) {
                      const membership = await getMyChurchMembership(profile.id);
                      cid = membership?.church_id || null;
                    }
                    if (cid) {
                      const group = await createChurchGroup(cid, newName.trim(), newDesc.trim() || undefined, newDay.trim() || undefined, profile.id);
                      if (group) {
                        setNewName(''); setNewDesc(''); setNewDay('');
                        setShowCreate(false);
                        await load();
                      }
                    }
                    setCreating(false);
                  }}
                  disabled={!newName.trim() || creating}
                  className="btn-primary flex-1 text-sm disabled:opacity-40"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
