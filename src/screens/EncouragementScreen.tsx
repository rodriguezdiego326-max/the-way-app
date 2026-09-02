import { useState, useEffect, useCallback } from 'react';
import { X, HandHeart, BookOpen, Heart, MessageCircle, Lock } from 'lucide-react';
import { vibrate, formatRelative } from '@/lib/utils';
import { LoadingState, EmptyState } from '@/components/States';
import { sendEncouragement, getEncouragementsForProfile, getEncouragementsForCircle } from '@/lib/togetherEngine';
import { getCircleMembers } from '@/lib/togetherEngine';
import type { Profile } from '@/lib/types';
import type { Circle, CircleMember, Encouragement } from '@/lib/togetherTypes';
import { ENCOURAGEMENT_ACTIONS } from '@/lib/togetherTypes';

interface Props {
  profile: Profile;
  circle?: Circle;
  onBack: () => void;
}

export default function EncouragementScreen({ profile, circle, onBack }: Props) {
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [received, setReceived] = useState<Encouragement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<CircleMember | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [encs, m] = await Promise.all([
        circle ? getEncouragementsForCircle(circle.id) : getEncouragementsForProfile(profile.id),
        circle ? getCircleMembers(circle.id) : [],
      ]);
      setReceived(encs.filter((e) => e.to_profile_id === profile.id));
      setMembers(m.filter((m) => m.profile_id !== profile.id));
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [circle?.id, profile.id]);

  useEffect(() => { load(); }, [load]);

  async function handleSend() {
    if (!selectedMember || !action) return;
    vibrate(15);
    setSending(true);
    try {
      await sendEncouragement(
        profile.id, selectedMember.profile_id,
        action, message.trim() || undefined,
        circle?.id,
      );
      setSelectedMember(null); setAction(null); setMessage('');
      await load();
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Encouragement</p><span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <HandHeart size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Encouragement</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Intentional, not social. No likes, no reaction counts, no popularity.</p>
            </div>
          </div>

          {/* Send encouragement */}
          {circle && members.length > 0 && (
            <div className="mb-6">
              <p className="ui-label mb-3">Encourage Someone</p>
              {!selectedMember ? (
                <div className="flex flex-col gap-2">
                  {members.map((m) => (
                    <button key={m.id} onClick={() => { vibrate(8); setSelectedMember(m); }} className="premium-card p-3 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all">
                      <div className="w-8 h-8 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0">
                        <Heart size={14} className="text-ivory-400" />
                      </div>
                      <p className="text-ivory-200 text-sm flex-1">{m.role === 'OWNER' ? 'Circle Owner' : 'Circle Member'}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="animate-fade-in">
                  <p className="text-ivory-400 text-sm mb-3">Choose an action:</p>
                  <div className="flex flex-col gap-2 mb-4">
                    {ENCOURAGEMENT_ACTIONS.map((a) => (
                      <button key={a.id} onClick={() => { vibrate(6); setAction(a.id); }} className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-all ${action === a.id ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'}`}>
                        {a.id === 'encourage' && <HandHeart size={14} />}
                        {a.id === 'share_scripture' && <BookOpen size={14} />}
                        {a.id === 'praying_for_you' && <Heart size={14} />}
                        {a.id === 'check_in_privately' && <MessageCircle size={14} />}
                        {a.label}
                      </button>
                    ))}
                  </div>
                  {action && (
                    <>
                      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Optional message" className="input-field min-h-[60px] resize-none text-sm mb-3" />
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedMember(null); setAction(null); setMessage(''); }} className="btn-secondary flex-1">Cancel</button>
                        <button onClick={handleSend} disabled={sending} className="btn-primary flex-1 disabled:opacity-40">{sending ? 'Sending...' : 'Send'}</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Received */}
          <p className="ui-label mb-3">Encouragement Received</p>
          {loading ? <LoadingState message="Loading..." /> : received.length === 0 ? (
            <EmptyState message="No encouragement yet." />
          ) : (
            <div className="flex flex-col gap-2">
              {received.map((e) => (
                <div key={e.id} className="premium-card p-3">
                  <div className="flex items-center gap-2 mb-1">
                    {e.action_type === 'encourage' && <HandHeart size={12} className="text-gold-300" />}
                    {e.action_type === 'share_scripture' && <BookOpen size={12} className="text-gold-300" />}
                    {e.action_type === 'praying_for_you' && <Heart size={12} className="text-gold-300" />}
                    {e.action_type === 'check_in_privately' && <MessageCircle size={12} className="text-gold-300" />}
                    <span className="text-ivory-200 text-sm">{e.action_type.replace(/_/g, ' ')}</span>
                    <span className="text-ivory-600 text-xs ml-auto">{formatRelative(e.created_at)}</span>
                  </div>
                  {e.message && <p className="text-ivory-300 text-xs mt-1 leading-relaxed">{e.message}</p>}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <Lock size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              No likes. No reaction counts. No popularity ranking. No engagement streaks. Just intentional encouragement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
