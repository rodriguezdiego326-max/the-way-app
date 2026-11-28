import { useState, useEffect, useCallback } from 'react';
import { X, Heart, Plus, ChevronRight, Trash2, Copy, RefreshCw, LogOut, KeyRound } from 'lucide-react';
import { vibrate, formatRelative } from '@/lib/utils';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import {
  getMyChurchMembership,
  getChurchMembershipForChurch,
  getChurch,
  getChurchGroups,
  getGroupDiscussions,
  addGroupDiscussion,
  createChurchGroup,
  deleteChurchGroup,
  joinChurchGroupByCode,
  getChurchGroupInviteCode,
  rotateChurchGroupInviteCode,
  leaveChurchGroup,
} from '@/lib/churchEngine';
import type { Profile } from '@/lib/types';
import type { ChurchGroup, GroupDiscussion } from '@/lib/togetherTypes';
import { isVerifiedChurchLeadership } from '@/lib/togetherTypes';
import CircleConfirmDialog from '@/components/circle/CircleConfirmDialog';

interface Props {
  profile: Profile;
  activeChurchId: string | null;
  onBack: () => void;
}

export default function SmallGroupModeScreen({ profile, activeChurchId, onBack }: Props) {
  const [groups, setGroups] = useState<ChurchGroup[]>([]);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberOnly, setMemberOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<ChurchGroup | null>(null);
  const [discussions, setDiscussions] = useState<GroupDiscussion[]>([]);
  const [topic, setTopic] = useState('');
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDay, setNewDay] = useState('');
  const [creating, setCreating] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<ChurchGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [deleteGroupError, setDeleteGroupError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [rotatingCode, setRotatingCode] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMemberOnly(false);
    try {
      let cid = activeChurchId;
      if (!cid) {
        const membership = await getMyChurchMembership(profile.id);
        cid = membership?.church_id || null;
      }
      setChurchId(cid);
      if (cid) {
        const access = await getChurchMembershipForChurch(profile.id, cid);
        if (access?.membership_status !== 'member') {
          setMemberOnly(true);
          setCanManage(false);
          setLoading(false);
          return;
        }
      }
      if (!cid) {
        setGroups([]);
        setCanManage(false);
        setLoading(false);
        return;
      }

      const church = await getChurch(cid);
      if (!church) {
        setGroups([]);
        setCanManage(false);
        return;
      }

      const [grps, membership] = await Promise.all([
        getChurchGroups(church.id),
        getChurchMembershipForChurch(profile.id, church.id),
      ]);
      setGroups(grps);
      setCanManage(isVerifiedChurchLeadership(membership?.verified_church_role));
    } catch {
      setError('Could not load groups.');
    } finally {
      setLoading(false);
    }
  }, [profile.id, activeChurchId]);

  useEffect(() => { void load(); }, [load]);

  async function handleOpenGroup(group: ChurchGroup) {
    vibrate(10);
    setActiveGroup(group);
    setInviteCode(null);
    const [discs, code] = await Promise.all([
      getGroupDiscussions(group.id),
      canManage || group.leader_profile_id === profile.id
        ? getChurchGroupInviteCode(group.id)
        : Promise.resolve(null),
    ]);
    setDiscussions(discs);
    setInviteCode(code);
  }

  async function handleJoinGroup() {
    if (!joinCode.trim() || joining) return;
    vibrate(12);
    setJoining(true);
    setJoinError(null);
    const joined = await joinChurchGroupByCode(joinCode);
    setJoining(false);
    if (!joined) {
      setJoinError('Invite code not found, or this group belongs to a different church.');
      return;
    }
    setJoinCode('');
    await load();
    await handleOpenGroup(joined);
  }

  async function handleRotateCode() {
    if (!activeGroup || rotatingCode) return;
    vibrate(10);
    setRotatingCode(true);
    const code = await rotateChurchGroupInviteCode(activeGroup.id);
    setRotatingCode(false);
    if (code) setInviteCode(code);
  }

  async function handleCopyCode() {
    if (!inviteCode) return;
    vibrate(6);
    try {
      await navigator.clipboard.writeText(inviteCode);
    } catch {
      // The code remains visible for manual copy if clipboard permission is unavailable.
    }
  }

  async function handleLeaveGroup() {
    if (!activeGroup || leavingGroup || canManage || activeGroup.leader_profile_id === profile.id) return;
    vibrate(15);
    setLeavingGroup(true);
    const ok = await leaveChurchGroup(activeGroup.id, profile.id);
    setLeavingGroup(false);
    if (!ok) return;
    setActiveGroup(null);
    setDiscussions([]);
    await load();
  }

  async function handleDeleteGroup() {
    if (!groupToDelete || deletingGroup) return;
    vibrate(20);
    setDeletingGroup(true);
    setDeleteGroupError(null);
    const ok = await deleteChurchGroup(groupToDelete.id);
    if (!ok) {
      setDeleteGroupError("We couldn't delete this group. Please try again.");
      setDeletingGroup(false);
      return;
    }
    setGroupToDelete(null);
    setActiveGroup(null);
    setDiscussions([]);
    setDeletingGroup(false);
    await load();
  }

  async function handlePost() {
    if (!activeGroup || !topic.trim() || !body.trim()) return;
    vibrate(15);
    setPosting(true);
    try {
      await addGroupDiscussion(activeGroup.id, profile.id, topic.trim(), body.trim());
      setTopic('');
      setBody('');
      setDiscussions(await getGroupDiscussions(activeGroup.id));
    } finally {
      setPosting(false);
    }
  }

  if (memberOnly) return <div className="app-container bg-parchment min-h-screen px-6 pt-14 safe-top">
    <button className="btn-secondary mb-4" onClick={onBack}>Back</button>
    <EmptyState message="Accept a membership invitation from your pastor or church admin in My Church to access this area." />
  </div>;

  if (activeGroup) {
    const isCreator = activeGroup.leader_profile_id === profile.id;
    const canShareInvite = canManage || isCreator;

    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setActiveGroup(null)} className="btn-ghost"><X size={20} /></button>
          <p className="ui-label">{activeGroup.name}</p>
          {isCreator ? (
            <button
              type="button"
              className="btn-ghost text-clay-400"
              aria-label="Delete small group"
              onClick={() => { vibrate(8); setDeleteGroupError(null); setGroupToDelete(activeGroup); }}
            >
              <Trash2 size={16} />
            </button>
          ) : <span className="w-10" />}
        </header>

        <div className="flex-1 overflow-y-auto px-6 mt-4">
          <div className="animate-fade-in-up">
            <div className="mb-6">
              <h2 className="font-serif text-2xl text-ivory-50">{activeGroup.name}</h2>
              {activeGroup.description && <p className="text-ivory-500 text-sm mt-1 leading-relaxed">{activeGroup.description}</p>}
              {activeGroup.meeting_day && <p className="text-ivory-600 text-xs mt-2">Meets: {activeGroup.meeting_day}</p>}
            </div>

            {canShareInvite && inviteCode && (
              <div className="premium-card p-4 mb-5 border-gold-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <KeyRound size={15} className="text-gold-300" />
                  <p className="ui-label">Invite Code</p>
                </div>
                <p className="font-mono text-2xl tracking-[0.2em] text-ivory-50">{inviteCode}</p>
                <p className="text-ivory-600 text-xs mt-2 leading-relaxed">
                  Share this code only with people who belong to this church. They will see this group after joining.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button type="button" onClick={() => void handleCopyCode()} className="btn-secondary text-xs">
                    <Copy size={13} /> Copy
                  </button>
                  <button type="button" onClick={() => void handleRotateCode()} disabled={rotatingCode} className="btn-secondary text-xs disabled:opacity-40">
                    <RefreshCw size={13} className={rotatingCode ? 'animate-spin' : ''} /> New Code
                  </button>
                </div>
              </div>
            )}

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

            {!canManage && !isCreator && (
              <button
                type="button"
                onClick={() => void handleLeaveGroup()}
                disabled={leavingGroup}
                className="btn-secondary w-full text-clay-400 border-clay-500/20 mt-6 disabled:opacity-40"
              >
                <LogOut size={14} /> {leavingGroup ? 'Leaving...' : 'Leave Group'}
              </button>
            )}
          </div>
        </div>

        {groupToDelete && (
          <CircleConfirmDialog
            title={`Delete ${groupToDelete.name}?`}
            body="This permanently deletes this church small group, joined-member access, and its discussion posts. You can create a new group afterward."
            confirmLabel="Delete Group"
            cancelLabel="Cancel"
            destructive
            busy={deletingGroup}
            error={deleteGroupError}
            onConfirm={() => void handleDeleteGroup()}
            onCancel={() => setGroupToDelete(null)}
          />
        )}
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
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">
                {canManage
                  ? 'Verified church leadership can see every small group for this church.'
                  : 'You only see small groups you have joined with an invite code.'}
              </p>
            </div>
          </div>

          {loading && <LoadingState message="Loading..." />}
          {error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && !canManage && (
            <div className="premium-card p-5 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <KeyRound size={16} className="text-gold-300" />
                <p className="ui-label">Join Small Group</p>
              </div>
              <p className="text-ivory-600 text-xs mb-3 leading-relaxed">
                Enter the private invite code given to you by your church group leader.
              </p>
              <input
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(null); }}
                placeholder="Enter invite code"
                maxLength={12}
                autoCapitalize="characters"
                className="input-field font-mono tracking-widest"
              />
              {joinError && <p className="text-error text-xs mt-2">{joinError}</p>}
              <button
                type="button"
                onClick={() => void handleJoinGroup()}
                disabled={joining || !joinCode.trim()}
                className="btn-primary w-full mt-3 disabled:opacity-40"
              >
                {joining ? 'Joining...' : 'Join Group'}
              </button>
            </div>
          )}

          {!loading && !error && groups.length === 0 && (
            <div className="premium-card p-6 text-center">
              <p className="text-ivory-400 text-sm">
                {canManage ? 'No small groups yet.' : "You haven't joined any small groups yet."}
              </p>
              {canManage && (
                <>
                  <p className="text-ivory-600 text-xs mt-2 leading-relaxed">Create a small group for your church.</p>
                  <button onClick={() => { vibrate(8); setShowCreate(true); }} className="btn-primary mt-4">
                    <Plus size={16} /> Create Small Group
                  </button>
                </>
              )}
            </div>
          )}

          {!loading && !error && groups.length > 0 && (
            <>
              <div className="flex flex-col gap-2">
                {groups.map((g) => (
                  <button key={g.id} onClick={() => void handleOpenGroup(g)} className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all">
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
              {canManage && (
                <button onClick={() => { vibrate(8); setShowCreate(true); }} className="btn-secondary w-full mt-4 text-sm">
                  <Plus size={16} /> Create Small Group
                </button>
              )}
            </>
          )}

          {showCreate && canManage && churchId && (
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
                    const group = await createChurchGroup(churchId, newName.trim(), newDesc.trim() || undefined, newDay.trim() || undefined, profile.id);
                    setCreating(false);
                    if (!group) return;
                    setNewName('');
                    setNewDesc('');
                    setNewDay('');
                    setShowCreate(false);
                    await load();
                    await handleOpenGroup(group);
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
