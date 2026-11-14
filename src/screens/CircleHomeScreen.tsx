import { useState, useEffect, useCallback } from 'react';
import { X, Users, Heart, BookOpen, CheckCircle, HandHeart, Shield, ChevronRight, UserPlus, LogOut, MessageSquare } from 'lucide-react';

import { vibrate, formatRelative } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import {
  getMyRole, leaveCircle, removeCircleMember, getCircleMemberSummaries,
  getScriptureStudies, getSharedPrayers, getCheckIns, getCircleSermonDiscussions,
} from '@/lib/togetherEngine';
import type { Profile } from '@/lib/types';
import type { Circle, CircleMemberSummary, SharedScriptureStudy, SharedPrayer, CircleCheckIn, CircleSermonDiscussion } from '@/lib/togetherTypes';
import InvitePeopleSheet from '@/components/circle/InvitePeopleSheet';
import PendingInvitationsList from '@/components/circle/PendingInvitationsList';
import CircleMemberList from '@/components/circle/CircleMemberList';
import CircleConfirmDialog from '@/components/circle/CircleConfirmDialog';

interface Props {
  profile: Profile;
  circle: Circle;
  onBack: () => void;
  onOpenPrayer: (circle: Circle) => void;
  onOpenScripture: (circle: Circle) => void;
  onOpenCheckIn: (circle: Circle) => void;
  onOpenEncouragement: (circle: Circle) => void;
  onOpenAccountability: (circle: Circle) => void;
  onOpenSermonDiscussions: (circle: Circle) => void;
}

function discussionSummary(discussions: CircleSermonDiscussion[] | null): string {
  if (discussions === null) return 'Open to view shared discussions';
  if (discussions.length === 0) return 'No sermon discussions yet';
  return `${discussions.length} shared · latest ${formatRelative(discussions[0].created_at)}`;
}

export default function CircleHomeScreen({
  profile, circle, onBack, onOpenPrayer, onOpenScripture, onOpenCheckIn, onOpenEncouragement, onOpenAccountability, onOpenSermonDiscussions,
}: Props) {
  const [members, setMembers] = useState<CircleMemberSummary[] | null>(null);
  const [membersFailed, setMembersFailed] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [studies, setStudies] = useState<SharedScriptureStudy[]>([]);
  const [prayers, setPrayers] = useState<SharedPrayer[]>([]);
  const [checkIns, setCheckIns] = useState<CircleCheckIn[]>([]);
  const [discussions, setDiscussions] = useState<CircleSermonDiscussion[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [pendingRefreshKey, setPendingRefreshKey] = useState(0);
  const [memberToRemove, setMemberToRemove] = useState<CircleMemberSummary | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [showOwnerLeaveNotice, setShowOwnerLeaveNotice] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    setMembersFailed(false);
    try {
      setMembers(await getCircleMemberSummaries(circle.id));
    } catch {
      setMembersFailed(true);
    }
  }, [circle.id]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [role, studs, prays, checkins, discussionRows] = await Promise.all([
        getMyRole(circle.id, profile.id),
        getScriptureStudies(circle.id),
        getSharedPrayers(circle.id),
        getCheckIns(circle.id),
        getCircleSermonDiscussions(circle.id).catch(() => null),
      ]);
      setMyRole(role);
      setStudies(studs);
      setPrayers(prays);
      setCheckIns(checkins);
      setDiscussions(discussionRows);
    } catch {
      setError('Could not load this Circle.');
    } finally {
      setLoading(false);
    }
  }, [circle.id, profile.id]);

  useEffect(() => { load(); loadMembers(); }, [load, loadMembers]);

  async function handleRemoveMember() {
    if (!memberToRemove || removing) return;
    setRemoving(true);
    setRemoveError(null);
    try {
      await removeCircleMember(circle.id, memberToRemove.member_profile_id);
      setMemberToRemove(null);
      await loadMembers();
    } catch {
      setRemoveError("We couldn't remove this member. Please try again.");
    } finally {
      setRemoving(false);
    }
  }

  async function handleLeave() {
    if (leaving) return;
    vibrate(20);
    setLeaving(true);
    setLeaveError(null);
    try {
      await leaveCircle(circle.id, profile.id);
      onBack();
    } catch {
      setLeaveError("We couldn't leave this Circle. Please try again.");
      setLeaving(false);
    }
  }

  function handleLeaveTap() {
    vibrate(8);
    if (myRole === 'OWNER') {
      setShowOwnerLeaveNotice(true);
      return;
    }
    setLeaveError(null);
    setConfirmLeave(true);
  }

  const isOwner = myRole === 'OWNER';
  const isLeader = isOwner || myRole === 'LEADER' || myRole === 'PASTOR' || myRole === 'CHURCH_LEADER';
  const sharedPrayerCount = prayers.filter((p) => p.visibility === 'circle').length;
  const recentCheckIns = checkIns.filter((c) => c.visibility !== 'private').slice(0, 3);
  const memberCount = members?.length;

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost" aria-label="Close"><X size={20} /></button>
        <p className="ui-label">{circle.circle_type}</p>
        <button onClick={handleLeaveTap} disabled={leaving} className="btn-ghost" aria-label="Leave Circle">
          <LogOut size={16} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Users size={18} className="text-gold-300" />
            </div>
            <div className="flex-1">
              <h2 className="font-serif text-2xl text-ivory-50">{circle.name}</h2>
              <p className="text-ivory-500 text-sm mt-1">
                {circle.circle_type} · {memberCount === undefined ? 'Members loading' : `${memberCount} member${memberCount !== 1 ? 's' : ''}`} · {circle.privacy}
              </p>
              {circle.description && <p className="text-ivory-400 text-xs mt-2 leading-relaxed">{circle.description}</p>}
            </div>
          </div>

          {loading && <LoadingState message="Loading circle..." />}
          {error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && (
            <>
              <p className="ui-label mb-3">This Week</p>
              <div className="flex flex-col gap-2 mb-6">
                <CircleActionCard icon={BookOpen} label="Scripture" desc={studies.length > 0 ? `${studies[0].passage_reference}` : 'No study assigned'} onClick={() => onOpenScripture(circle)} />
                <CircleActionCard icon={MessageSquare} label="Sermon Discussions" desc={discussionSummary(discussions)} onClick={() => onOpenSermonDiscussions(circle)} />
                <CircleActionCard icon={Heart} label="Prayer" desc={sharedPrayerCount > 0 ? `${sharedPrayerCount} shared prayer request${sharedPrayerCount !== 1 ? 's' : ''}` : 'No prayers shared yet'} onClick={() => onOpenPrayer(circle)} />
                <CircleActionCard icon={CheckCircle} label="Check-In" desc={recentCheckIns.length > 0 ? `${recentCheckIns.length} recent check-in${recentCheckIns.length !== 1 ? 's' : ''}` : 'How is everyone arriving?'} onClick={() => onOpenCheckIn(circle)} />
                <CircleActionCard icon={HandHeart} label="Encouragement" desc="Encourage someone intentionally" onClick={() => onOpenEncouragement(circle)} />
                <CircleActionCard icon={Shield} label="Accountability" desc="Private · Opt-in" onClick={() => onOpenAccountability(circle)} />
              </div>

              <div className="flex items-center justify-between mb-3">
                <p className="ui-label">Members</p>
                {isLeader && (
                  <button onClick={() => { vibrate(8); setShowInvite(true); }} className="btn-ghost text-xs">
                    <UserPlus size={12} /> Invite People
                  </button>
                )}
              </div>

              {members === null && !membersFailed && <LoadingState message="Loading members..." />}
              {membersFailed && <ErrorState message="We couldn't load the member list." onRetry={loadMembers} />}
              {members && (
                <CircleMemberList
                  members={members}
                  canRemove={isOwner}
                  onRemove={(m) => { vibrate(8); setRemoveError(null); setMemberToRemove(m); }}
                />
              )}

              {isLeader && (
                <PendingInvitationsList circleId={circle.id} circleName={circle.name} refreshKey={pendingRefreshKey} />
              )}
            </>
          )}
        </div>
      </div>

      {showInvite && (
        <InvitePeopleSheet
          circleId={circle.id}
          circleName={circle.name}
          onChanged={() => setPendingRefreshKey((k) => k + 1)}
          onClose={() => setShowInvite(false)}
        />
      )}

      {memberToRemove && (
        <CircleConfirmDialog
          title="Remove this member?"
          body="They will lose access to this Circle and its shared content. Content they previously shared may remain unless that content has its own delete controls."
          confirmLabel="Remove Member"
          cancelLabel="Cancel"
          destructive
          busy={removing}
          error={removeError}
          onConfirm={handleRemoveMember}
          onCancel={() => setMemberToRemove(null)}
        />
      )}

      {showOwnerLeaveNotice && (
        <CircleConfirmDialog
          title="Circle owners can't leave yet"
          body="To keep the Circle from becoming ownerless, the owner must remain in the Circle. Ownership transfer can be added in a future update."
          confirmLabel="OK"
          onConfirm={() => setShowOwnerLeaveNotice(false)}
        />
      )}

      {confirmLeave && (
        <CircleConfirmDialog
          title="Leave this Circle?"
          body="You'll lose access to this Circle and its shared content. You can join again later with a new invitation."
          confirmLabel="Leave Circle"
          cancelLabel="Cancel"
          destructive
          busy={leaving}
          error={leaveError}
          onConfirm={handleLeave}
          onCancel={() => setConfirmLeave(false)}
        />
      )}
    </div>
  );
}

function CircleActionCard({ icon: Icon, label, desc, onClick }: { icon: typeof Heart; label: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={() => { vibrate(8); onClick(); }} className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group">
      <div className="w-9 h-9 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-ivory-400 group-hover:text-gold-300 transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-ivory-100 font-medium text-sm">{label}</p>
        <p className="text-ivory-600 text-xs">{desc}</p>
      </div>
      <ChevronRight size={16} className="text-ivory-600 shrink-0" />
    </button>
  );
}
