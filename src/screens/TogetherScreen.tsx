import { useState, useEffect, useCallback } from 'react';
import { X, Users, Heart, BookOpen, CheckCircle, HandHeart, Shield, Church, Mail, Plus, ChevronRight, Sparkles, Check, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate, formatRelative } from '@/lib/utils';
import { LoadingState, ErrorState } from '@/components/States';
import { getMyCircles, getInvitationsForProfile, acceptInvitation, getInvitationByCode } from '@/lib/togetherEngine';
import { getMyChurchMembership, getChurch } from '@/lib/churchEngine';
import type { Profile } from '@/lib/types';
import type { Circle, CircleInvitation } from '@/lib/togetherTypes';

interface Props {
  profile: Profile;
  onBack: () => void;
  onOpenCircle: (circle: Circle) => void;
  onOpenCreateCircle: () => void;
  onOpenPrayer: (circle?: Circle) => void;
  onOpenScripture: (circle?: Circle) => void;
  onOpenCheckIn: (circle?: Circle) => void;
  onOpenEncouragement: () => void;
  onOpenAccountability: () => void;
  onOpenMyChurch: () => void;
  onOpenInvitations: () => void;
  onJoinByCode: () => void;
  initialTab?: 'main' | 'invitations' | 'join_code';
}

export default function TogetherScreen({
  profile, onBack, onOpenCircle, onOpenCreateCircle,
  onOpenPrayer, onOpenScripture, onOpenCheckIn, onOpenEncouragement,
  onOpenAccountability, onOpenMyChurch, onOpenInvitations, onJoinByCode,
  initialTab,
}: Props) {
  const [view, setView] = useState<'main' | 'invitations' | 'join_code'>(initialTab || 'main');
  const [circles, setCircles] = useState<Circle[]>([]);
  const [invitations, setInvitations] = useState<Array<CircleInvitation & { circles: Circle }>>([]);
  const [churchName, setChurchName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [myCircles, myInvitations] = await Promise.all([
        getMyCircles(profile),
        getInvitationsForProfile(profile.id),
      ]);
      setCircles(myCircles || []);
      setInvitations(myInvitations || []);
      const membership = await getMyChurchMembership(profile.id);
      if (membership) {
        const church = await getChurch(membership.church_id);
        setChurchName(church?.name || null);
      }
    } catch {
      setError('Could not load your Together data.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  async function handleAcceptInvitation(inv: CircleInvitation & { circles: Circle }) {
    vibrate(10);
    try {
      const result = await acceptInvitation(inv.invite_code, profile);
      if (result.success) {
        setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
        setCircles((prev) => result.circle ? [...prev, result.circle] : prev);
      } else {
        setError(result.error || 'Could not accept invitation.');
      }
    } catch {
      setError('Could not accept invitation. Please try again.');
    }
  }

  async function handleDeclineInvitation(inv: CircleInvitation & { circles: Circle }) {
    vibrate(8);
    try {
      await supabase.from('circle_invitations').update({ revoked_at: new Date().toISOString() }).eq('id', inv.id);
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
    } catch {
      setError('Could not decline invitation.');
    }
  }

  async function handleJoinByCode() {
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinError(null);
    try {
      const result = await acceptInvitation(joinCode.trim(), profile);
      if (result.success) {
        setJoinCode('');
        setView('main');
        load();
      } else {
        setJoinError(result.error || 'Invalid code.');
      }
    } catch {
      setJoinError('Could not join circle. Please try again.');
    } finally {
      setJoining(false);
    }
  }

  // INVITATIONS VIEW
  if (view === 'invitations') {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setView('main')} className="btn-ghost"><X size={20} /></button>
          <p className="ui-label">Invitations</p><span className="w-10" />
        </header>
        <div className="flex-1 overflow-y-auto px-6 mt-4">
          {loading ? (
            <LoadingState message="Loading invitations..." />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : invitations.length === 0 ? (
            <div className="premium-card p-6 text-center">
              <Mail size={24} className="text-gold-300 mx-auto mb-4" />
              <p className="text-ivory-400 text-sm">No invitations yet.</p>
              <p className="text-ivory-600 text-xs mt-2 leading-relaxed">When someone invites you to a Circle, it will appear here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {invitations.map((inv) => (
                <div key={inv.id} className="premium-card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={16} className="text-gold-300" />
                    <p className="text-ivory-100 font-medium text-sm">{inv.circles?.name || 'Unknown Circle'}</p>
                  </div>
                  <p className="text-ivory-600 text-xs mb-4">
                    {inv.circles?.circle_type || 'Circle'} · Invited {formatRelative(inv.created_at)}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => handleAcceptInvitation(inv)} className="btn-primary flex-1 text-sm">
                      <Check size={16} /> Accept
                    </button>
                    <button onClick={() => handleDeclineInvitation(inv)} className="btn-secondary flex-1 text-sm">
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // JOIN BY CODE VIEW
  if (view === 'join_code') {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setView('main')} className="btn-ghost"><X size={20} /></button>
          <p className="ui-label">Join with Code</p><span className="w-10" />
        </header>
        <div className="flex-1 overflow-y-auto px-6 mt-4">
          <div className="premium-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound size={18} className="text-gold-300" />
              <p className="text-ivory-100 font-medium text-sm">Enter Invitation Code</p>
            </div>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter code..."
              className="input-field mb-3"
              autoCapitalize="none"
              autoCorrect="off"
            />
            {joinError && <p className="text-error text-xs mb-3">{joinError}</p>}
            <button onClick={handleJoinByCode} disabled={!joinCode.trim() || joining} className="btn-primary w-full disabled:opacity-40">
              {joining ? 'Joining...' : 'Join Circle'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN VIEW
  const primaryCards = [
    { icon: Users, label: 'My Circles', desc: `${circles.length} circle${circles.length !== 1 ? 's' : ''}`, onClick: () => {} },
    { icon: Heart, label: 'Prayer Together', desc: 'Shared prayer requests', onClick: () => onOpenPrayer() },
    { icon: BookOpen, label: 'Scripture Together', desc: 'Read and reflect as a group', onClick: () => onOpenScripture() },
    { icon: CheckCircle, label: 'Check In', desc: 'How are you arriving?', onClick: () => onOpenCheckIn() },
    { icon: HandHeart, label: 'Encouragement', desc: 'Intentional, not social', onClick: onOpenEncouragement },
    { icon: Shield, label: 'Accountability', desc: 'Private · Opt-in', onClick: onOpenAccountability },
    { icon: Church, label: 'My Church', desc: churchName || 'Connect your church', onClick: onOpenMyChurch },
    { icon: Mail, label: 'Invitations', desc: `${invitations.length} pending`, onClick: () => setView('invitations') },
  ];

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Together</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Users size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">TOGETHER</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">You were never meant to walk alone.</p>
            </div>
          </div>

          {loading && <LoadingState message="Loading your circles..." />}
          {error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && (
            <>
              {/* My Circles */}
              <p className="ui-label mb-3">My Circles</p>
              {circles.length === 0 ? (
                <div className="premium-card p-6 text-center mb-4">
                  <p className="text-ivory-400 text-sm">You haven't joined any Circles yet.</p>
                  <p className="text-ivory-600 text-xs mt-2 leading-relaxed">Create a private Circle for your marriage, small group, Bible study, or prayer group.</p>
                  <button onClick={() => { vibrate(10); onOpenCreateCircle(); }} className="btn-primary mt-4">
                    <Plus size={16} /> Create a Circle
                  </button>
                  <button onClick={() => { vibrate(8); setView('join_code'); }} className="btn-secondary mt-2 w-full">
                    Join with Code
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mb-4">
                  {circles.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { vibrate(8); onOpenCircle(c); }}
                      className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-ink-700/50 flex items-center justify-center shrink-0">
                        <Users size={17} className="text-ivory-400 group-hover:text-gold-300 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-ivory-100 font-medium text-sm">{c.name}</p>
                        <p className="text-ivory-600 text-xs">{c.circle_type} · Created {formatRelative(c.created_at)}</p>
                      </div>
                      <ChevronRight size={16} className="text-ivory-600 shrink-0" />
                    </button>
                  ))}
                  <button onClick={() => { vibrate(10); onOpenCreateCircle(); }} className="btn-secondary mt-2">
                    <Plus size={16} /> Create Another Circle
                  </button>
                </div>
              )}

              {/* Primary cards */}
              <p className="ui-label mb-3 mt-6">Together</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {primaryCards.slice(1).map((card) => (
                  <button
                    key={card.label}
                    onClick={() => { vibrate(8); card.onClick(); }}
                    className="premium-card p-4 text-left no-tap-highlight hover:border-gold-500/30 transition-all duration-300 group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-ink-700/50 flex items-center justify-center mb-2">
                      <card.icon size={16} className="text-ivory-400 group-hover:text-gold-300 transition-colors" />
                    </div>
                    <p className="text-ivory-100 font-medium text-sm">{card.label}</p>
                    <p className="text-ivory-600 text-xs mt-0.5">{card.desc}</p>
                  </button>
                ))}
              </div>

              {/* Invitations */}
              {invitations.length > 0 && (
                <div className="premium-card p-4 mb-4 border-gold-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail size={14} className="text-gold-300" />
                    <p className="text-ivory-100 text-sm font-medium">{invitations.length} Pending Invitation{invitations.length !== 1 ? 's' : ''}</p>
                  </div>
                  <p className="text-ivory-500 text-xs leading-relaxed mb-3">Someone has invited you to join their Circle.</p>
                  <button onClick={() => { vibrate(8); setView('invitations'); }} className="btn-secondary w-full text-sm">
                    View Invitations
                  </button>
                </div>
              )}

              {/* Principle */}
              <div className="flex items-start gap-2 mt-5 px-1">
                <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
                <p className="text-ivory-600 text-xs leading-relaxed font-medium">
                  AI should strengthen human Christian relationships, not replace them. SOLAPATH strengthens the local church, not becomes it.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
