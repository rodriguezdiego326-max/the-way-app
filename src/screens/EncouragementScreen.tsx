import { useState, useEffect, useCallback } from 'react';
import { X, HandHeart, BookOpen, Heart, MessageCircle, Lock } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import CircleChooser from '@/components/CircleChooser';
import EncouragementItem from '@/components/EncouragementItem';
import { sendEncouragement, getEncouragementsForProfile, getCircleMemberSummaries } from '@/lib/togetherEngine';
import { parsePassageReference, formatPassageReference } from '@/lib/passageParser';
import type { Profile } from '@/lib/types';
import type { Circle, CircleMemberSummary, Encouragement } from '@/lib/togetherTypes';
import { ENCOURAGEMENT_ACTIONS } from '@/lib/togetherTypes';

interface Props {
  profile: Profile;
  circle?: Circle;
  initialPickedCircle?: Circle;
  onBack: () => void;
  onOpenScripture: (reference: string, pickedCircle: Circle | undefined) => boolean;
}

function normalizeScriptureReference(input: string): string | null {
  const parsed = parsePassageReference(input.trim());
  if (!parsed) return null;
  if (parsed.verseStart !== null && parsed.verseEnd !== null && parsed.verseEnd < parsed.verseStart) return null;
  return formatPassageReference(parsed);
}

export default function EncouragementScreen({ profile, circle, initialPickedCircle, onBack, onOpenScripture }: Props) {
  const [pickedCircle, setPickedCircle] = useState<Circle | null>(initialPickedCircle ?? null);
  const activeCircle = circle ?? pickedCircle;
  const activeCircleId = activeCircle?.id;
  const [history, setHistory] = useState<Encouragement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [members, setMembers] = useState<CircleMemberSummary[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<CircleMemberSummary | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [scriptureInput, setScriptureInput] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      setHistory(await getEncouragementsForProfile(profile.id, circle?.id));
    } catch {
      setHistoryError("We couldn't load your encouragement history. Please try again.");
    } finally {
      setHistoryLoading(false);
    }
  }, [profile.id, circle?.id]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const loadMembers = useCallback(async () => {
    if (!activeCircleId) {
      setMembers([]);
      return;
    }
    setMembersLoading(true);
    setMembersError(null);
    try {
      const summaries = await getCircleMemberSummaries(activeCircleId);
      setMembers(summaries.filter((m) => m.member_profile_id !== profile.id));
    } catch {
      setMembers([]);
      setMembersError("We couldn't load the members of this Circle. Please try again.");
    } finally {
      setMembersLoading(false);
    }
  }, [activeCircleId, profile.id]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  function resetComposer() {
    setSelectedMember(null);
    setAction(null);
    setScriptureInput('');
    setMessage('');
    setSendError(null);
  }

  function chooseAction(actionId: string) {
    vibrate(6);
    setAction(actionId);
    setScriptureInput('');
    setSendError(null);
  }

  async function handleSend() {
    if (!selectedMember || !action || !activeCircleId) return;
    let scriptureReference: string | undefined;
    if (action === 'share_scripture') {
      const normalized = normalizeScriptureReference(scriptureInput);
      if (!normalized) {
        setSendError('Enter a valid Scripture reference, such as Romans 8:1–4.');
        return;
      }
      scriptureReference = normalized;
    }
    vibrate(15);
    setSending(true);
    setSendError(null);
    try {
      await sendEncouragement(
        profile.id, selectedMember.member_profile_id,
        action, message.trim() || undefined,
        activeCircleId, scriptureReference,
      );
      resetComposer();
      await loadHistory();
    } catch {
      setSendError("We couldn't send that encouragement. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function handleOpenScripture(reference: string) {
    const opened = onOpenScripture(reference, pickedCircle ?? undefined);
    setOpenError(opened ? null : "We couldn't open this Scripture reference.");
    return opened;
  }

  const received = history.filter((e) => e.to_profile_id === profile.id);
  const sent = history.filter((e) => e.from_profile_id === profile.id);

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

          <div className="mb-6">
            {!activeCircle ? (
              <>
                <p className="ui-label mb-3">Choose a Circle to Encourage Someone</p>
                <CircleChooser
                  profile={profile}
                  emptyMessage="Join or create a Circle to send encouragement."
                  onChoose={(c) => { resetComposer(); setPickedCircle(c); }}
                  onBack={onBack}
                />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="ui-label">Encourage Someone</p>
                  {!circle && (
                    <button onClick={() => { vibrate(6); resetComposer(); setPickedCircle(null); }} className="text-gold-300 text-xs font-medium">Change Circle</button>
                  )}
                </div>
                {membersLoading && <LoadingState message="Loading members..." />}
                {membersError && <ErrorState message={membersError} onRetry={loadMembers} />}
                {!membersLoading && !membersError && members.length === 0 && (
                  <EmptyState message="No other members in this Circle yet." />
                )}
                {!membersLoading && !membersError && members.length > 0 && (!selectedMember ? (
                  <div className="flex flex-col gap-2">
                    {members.map((m) => (
                      <button key={m.member_profile_id} onClick={() => { vibrate(8); resetComposer(); setSelectedMember(m); }} className="premium-card p-3 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all">
                        <div className="w-8 h-8 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0">
                          <Heart size={14} className="text-ivory-400" />
                        </div>
                        <p className="text-ivory-200 text-sm flex-1">{m.member_display_name || 'SOLAPATH Member'}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    <p className="text-ivory-400 text-sm mb-3">Choose an action:</p>
                    <div className="flex flex-col gap-2 mb-4">
                      {ENCOURAGEMENT_ACTIONS.map((a) => (
                        <button key={a.id} onClick={() => chooseAction(a.id)} className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-all ${action === a.id ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50' : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'}`}>
                          {a.id === 'encourage' && <HandHeart size={14} />}
                          {a.id === 'share_scripture' && <BookOpen size={14} />}
                          {a.id === 'praying_for_you' && <Heart size={14} />}
                          {a.id === 'check_in_privately' && <MessageCircle size={14} />}
                          {a.label}
                        </button>
                      ))}
                    </div>
                    {action === 'share_scripture' && (
                      <>
                        <p className="ui-label mb-2">Scripture Reference</p>
                        <input
                          value={scriptureInput}
                          onChange={(e) => setScriptureInput(e.target.value)}
                          placeholder="Romans 8:1–17"
                          aria-label="Scripture Reference"
                          className="input-field text-sm mb-4"
                        />
                        <p className="ui-label mb-2">Personal Note</p>
                        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Why this passage made me think of you..." className="input-field min-h-[60px] resize-none text-sm mb-3" />
                      </>
                    )}
                    {action && action !== 'share_scripture' && (
                      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Optional message" className="input-field min-h-[60px] resize-none text-sm mb-3" />
                    )}
                    {action && (
                      <>
                        {sendError && <p role="alert" className="text-clay-400 text-xs mb-3">{sendError}</p>}
                        <div className="flex gap-2">
                          <button onClick={resetComposer} className="btn-secondary flex-1">Cancel</button>
                          <button onClick={handleSend} disabled={sending} className="btn-primary flex-1 disabled:opacity-40">{sending ? 'Sending...' : 'Send'}</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>

          {historyLoading && <LoadingState message="Loading encouragement..." />}
          {historyError && <ErrorState message={historyError} onRetry={loadHistory} />}
          {!historyLoading && !historyError && (
            <>
              {openError && <p role="alert" className="text-clay-400 text-xs mb-3">{openError}</p>}
              <p className="ui-label mb-3">Encouragement Received</p>
              {received.length === 0 ? (
                <EmptyState message="No encouragement received yet." />
              ) : (
                <div className="flex flex-col gap-2">
                  {received.map((e) => <EncouragementItem key={e.id} encouragement={e} onOpenScripture={handleOpenScripture} />)}
                </div>
              )}

              <p className="ui-label mb-3 mt-6">Encouragement Sent</p>
              {sent.length === 0 ? (
                <EmptyState message="You haven't sent any encouragement yet." />
              ) : (
                <div className="flex flex-col gap-2">
                  {sent.map((e) => <EncouragementItem key={e.id} encouragement={e} onOpenScripture={handleOpenScripture} />)}
                </div>
              )}
            </>
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
