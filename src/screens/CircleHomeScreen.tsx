import { useState, useEffect, useCallback } from 'react';
import { X, Users, Heart, BookOpen, CheckCircle, HandHeart, Shield, Plus, ChevronRight, UserPlus, LogOut, Mail, Clock, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate, formatRelative } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import {
  getCircle, getCircleMembers, getMyRole, leaveCircle, createInvitation, getScriptureStudies, getSharedPrayers, getCheckIns,
} from '@/lib/togetherEngine';
import type { Profile } from '@/lib/types';
import type { Circle, CircleMember, SharedScriptureStudy, SharedPrayer, CircleCheckIn, CircleInvitation } from '@/lib/togetherTypes';

interface Props {
  profile: Profile;
  circle: Circle;
  onBack: () => void;
  onOpenPrayer: (circle: Circle) => void;
  onOpenScripture: (circle: Circle) => void;
  onOpenCheckIn: (circle: Circle) => void;
  onOpenEncouragement: (circle: Circle) => void;
  onOpenAccountability: (circle: Circle) => void;
}

export default function CircleHomeScreen({
  profile, circle, onBack, onOpenPrayer, onOpenScripture, onOpenCheckIn, onOpenEncouragement, onOpenAccountability,
}: Props) {
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [studies, setStudies] = useState<SharedScriptureStudy[]>([]);
  const [prayers, setPrayers] = useState<SharedPrayer[]>([]);
  const [checkIns, setCheckIns] = useState<CircleCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, role, studs, prays, checkins] = await Promise.all([
        getCircleMembers(circle.id),
        getMyRole(circle.id, profile.id),
        getScriptureStudies(circle.id),
        getSharedPrayers(circle.id),
        getCheckIns(circle.id),
      ]);
      setMembers(m);
      setMyRole(role);
      setStudies(studs);
      setPrayers(prays);
      setCheckIns(checkins);
    } catch {
      setError('Could not load this Circle.');
    } finally {
      setLoading(false);
    }
  }, [circle.id, profile.id]);

  useEffect(() => { load(); }, [load]);

  async function handleInvite() {
    vibrate(10);
    const inv = await createInvitation(circle.id, profile.id);
    if (inv) setInviteCode(inv.invite_code);
  }

  async function handleLeave() {
    vibrate(20);
    setLeaving(true);
    await leaveCircle(circle.id, profile.id);
    onBack();
  }

  const isLeader = myRole === 'OWNER' || myRole === 'LEADER' || myRole === 'PASTOR' || myRole === 'CHURCH_LEADER';
  const recentPrayers = prayers.slice(0, 3);
  const recentCheckIns = checkIns.filter((c) => c.visibility !== 'private').slice(0, 3);

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">{circle.circle_type}</p>
        <button onClick={handleLeave} disabled={leaving} className="btn-ghost">
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
              <p className="text-ivory-500 text-sm mt-1">{circle.circle_type} · {members.length} member{members.length !== 1 ? 's' : ''} · {circle.privacy}</p>
              {circle.description && <p className="text-ivory-400 text-xs mt-2 leading-relaxed">{circle.description}</p>}
            </div>
          </div>

          {loading && <LoadingState message="Loading circle..." />}
          {error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && (
            <>
              {/* This Week section */}
              <p className="ui-label mb-3">This Week</p>
              <div className="flex flex-col gap-2 mb-6">
                <CircleActionCard icon={BookOpen} label="Scripture" desc={studies.length > 0 ? `${studies[0].passage_reference}` : 'No study assigned'} onClick={() => onOpenScripture(circle)} />
                <CircleActionCard icon={Heart} label="Prayer" desc={recentPrayers.length > 0 ? `${recentPrayers.length} prayer request${recentPrayers.length !== 1 ? 's' : ''}` : 'No prayers shared yet'} onClick={() => onOpenPrayer(circle)} />
                <CircleActionCard icon={CheckCircle} label="Check-In" desc={recentCheckIns.length > 0 ? `${recentCheckIns.length} recent check-in${recentCheckIns.length !== 1 ? 's' : ''}` : 'How is everyone arriving?'} onClick={() => onOpenCheckIn(circle)} />
                <CircleActionCard icon={HandHeart} label="Encouragement" desc="Encourage someone intentionally" onClick={() => onOpenEncouragement(circle)} />
                <CircleActionCard icon={Shield} label="Accountability" desc="Private · Opt-in" onClick={() => onOpenAccountability(circle)} />
              </div>

              {/* Members */}
              <div className="flex items-center justify-between mb-3">
                <p className="ui-label">Members</p>
                {isLeader && (
                  <button onClick={() => { vibrate(8); setShowInvite(true); }} className="btn-ghost text-xs">
                    <UserPlus size={12} /> Invite
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2 mb-6">
                {members.map((m) => (
                  <div key={m.id} className="premium-card p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0">
                      <Users size={14} className="text-ivory-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-ivory-200 text-sm">
                        {m.profile_id === circle.owner_profile_id ? 'Owner' : m.profile_id === profile.id ? 'You' : 'Member'}
                      </p>
                      <p className="text-ivory-600 text-xs">{m.role} · Joined {formatRelative(m.joined_at)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Invite modal */}
              {showInvite && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowInvite(false); setInviteCode(null); }}>
                  <div className="w-full max-w-md bg-ink-900 rounded-t-3xl p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-serif text-xl text-ivory-50">Invite to Circle</h3>
                      <button onClick={() => { setShowInvite(false); setInviteCode(null); }} className="btn-ghost"><X size={18} /></button>
                    </div>
                    {!inviteCode ? (
                      <>
                        <p className="text-ivory-400 text-sm leading-relaxed mb-4">Generate an invite code to share with someone you trust. The code is revocable and can optionally expire.</p>
                        <div className="premium-card p-3 mb-4">
                          <div className="flex items-start gap-2">
                            <Lock size={12} className="text-gold-400/60 shrink-0 mt-0.5" />
                            <p className="text-ivory-500 text-xs leading-relaxed">Circle content is not visible until the invitation is accepted.</p>
                          </div>
                        </div>
                        <button onClick={handleInvite} className="btn-primary w-full">
                          <Mail size={16} /> Generate Invite Code
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-ivory-400 text-sm leading-relaxed mb-3">Share this code with someone you trust:</p>
                        <div className="premium-card p-4 mb-4 text-center">
                          <p className="font-mono text-lg text-gold-300 tracking-wider">{inviteCode}</p>
                        </div>
                        <button onClick={() => { setShowInvite(false); setInviteCode(null); }} className="btn-secondary w-full">Done</button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
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
