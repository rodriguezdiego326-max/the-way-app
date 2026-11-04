import { useState, useEffect, useCallback } from 'react';
import { X, BookOpen, ChevronRight, ArrowDown, ShieldCheck } from 'lucide-react';
import { vibrate, formatRelative } from '@/lib/utils';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import { getChurchMembershipForChurch, getChurchStudies } from '@/lib/churchEngine';
import { getStudyAssignments } from '@/lib/churchStudyEngine';
import type { Profile } from '@/lib/types';
import type { ChurchStudy, ChurchStudyAssignment } from '@/lib/togetherTypes';

interface Props {
  profile: Profile;
  churchId: string | null;
  onBack: () => void;
  onOpenBible: (passageReference: string) => boolean;
}

type LoadState = 'loading' | 'no_church' | 'not_member' | 'error' | 'ready';

export default function ChurchStudiesScreen({ profile, churchId, onBack, onOpenBible }: Props) {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [studies, setStudies] = useState<ChurchStudy[]>([]);
  const [activeStudy, setActiveStudy] = useState<ChurchStudy | null>(null);
  const [assignments, setAssignments] = useState<ChurchStudyAssignment[]>([]);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [passageError, setPassageError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!churchId) {
      setLoadState('no_church');
      return;
    }
    setLoadState('loading');
    try {
      const membership = await getChurchMembershipForChurch(profile.id, churchId);
      if (!membership) {
        setLoadState('not_member');
        return;
      }
      setStudies(await getChurchStudies(churchId));
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [profile.id, churchId]);

  useEffect(() => { load(); }, [load]);

  async function handleOpenStudy(study: ChurchStudy) {
    vibrate(10);
    setDetailError(null);
    setPassageError(null);
    setActiveStudy(study);
    try {
      setAssignments(await getStudyAssignments(study.id));
    } catch {
      setDetailError('Could not load this study. Please try again.');
    }
  }

  function handleOpenPassage(passage: string) {
    vibrate(8);
    setPassageError(null);
    if (!onOpenBible(passage)) {
      setPassageError(`We could not open "${passage}". Try searching for it in the Bible tab.`);
    }
  }

  const header = (onClose: () => void) => (
    <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
      <button onClick={onClose} className="btn-ghost" aria-label="Close"><X size={20} /></button>
      <p className="ui-label">From My Church</p>
      <span className="w-10" />
    </header>
  );

  const churchContentNotice = (
    <div className="premium-card p-4 mb-6 border-gold-500/20">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck size={13} className="text-gold-300 shrink-0" />
        <span className="text-[10px] uppercase tracking-[0.18em] font-medium text-gold-300">CHURCH CONTENT</span>
      </div>
      <p className="text-ivory-400 text-xs leading-relaxed">
        Published by your church. Church content is separate from SOLAPATH's Verified Library.
      </p>
    </div>
  );

  if (activeStudy) {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
        {header(() => setActiveStudy(null))}

        <div className="flex-1 overflow-y-auto px-6 mt-4">
          <div className="animate-fade-in-up">
            {churchContentNotice}

            <div className="mb-6">
              <h2 className="font-serif text-2xl text-ivory-50">{activeStudy.title}</h2>
              {activeStudy.description && <p className="text-ivory-500 text-sm mt-1 leading-relaxed">{activeStudy.description}</p>}
            </div>

            {detailError && <ErrorState message={detailError} onRetry={() => handleOpenStudy(activeStudy)} />}

            {!detailError && assignments.length === 0 && (
              <EmptyState message="No assignments in this study yet." />
            )}

            {!detailError && assignments.length > 0 && (
              <div className="flex flex-col gap-2">
                {assignments.map((a) => (
                  <div key={a.id} className="premium-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-gold-500/10 text-gold-300">{a.week_label}</span>
                      {a.meeting_date && <span className="text-ivory-600 text-xs">{new Date(a.meeting_date).toLocaleDateString()}</span>}
                    </div>
                    <p className="font-serif text-lg text-ivory-100">{a.passage_reference}</p>
                    {a.reading_objective && <p className="text-ivory-400 text-xs mt-1 leading-relaxed">{a.reading_objective}</p>}
                    {a.discussion_questions.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {a.discussion_questions.map((q, i) => (
                          <p key={i} className="text-ivory-500 text-xs leading-relaxed">• {q}</p>
                        ))}
                      </div>
                    )}
                    {a.prayer_focus && <p className="text-gold-300/60 text-xs mt-3 italic">Prayer: {a.prayer_focus}</p>}
                    <button onClick={() => handleOpenPassage(a.passage_reference)} className="btn-secondary w-full mt-3 text-xs">
                      <BookOpen size={12} /> Open Bible to {a.passage_reference}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {passageError && (
              <div className="premium-card p-3 mt-4 border-error/30">
                <p className="text-error text-xs leading-relaxed">{passageError}</p>
              </div>
            )}

            <div className="flex items-start gap-2 mt-5 px-1">
              <ArrowDown size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
              <p className="text-ivory-600 text-xs leading-relaxed font-medium">
                Flow: Open Bible → Read → Reflect privately → Optional share → Pray
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      {header(onBack)}

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <BookOpen size={18} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ivory-50">Church Studies</h2>
              <p className="text-ivory-500 text-sm mt-1 leading-relaxed">Studies from your church. Open your Bible, read, reflect, share, pray.</p>
            </div>
          </div>

          {loadState === 'loading' && <LoadingState message="Loading..." />}
          {loadState === 'error' && <ErrorState message="Could not load church studies." onRetry={load} />}
          {loadState === 'no_church' && (
            <EmptyState message="Choose a church in My Church to see its studies." />
          )}
          {loadState === 'not_member' && (
            <EmptyState message="You are not a member of this church, so its studies are not shown." />
          )}

          {loadState === 'ready' && studies.length === 0 && (
            <EmptyState message="Your church has not published any studies in SOLAPATH yet." />
          )}

          {loadState === 'ready' && studies.length > 0 && (
            <>
              {churchContentNotice}
              <div className="flex flex-col gap-2">
                {studies.map((s) => (
                  <button key={s.id} onClick={() => handleOpenStudy(s)} className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0">
                      <BookOpen size={16} className="text-ivory-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-ivory-100 font-medium text-sm">{s.title}</p>
                      <p className="text-ivory-600 text-xs">
                        {s.published_at ? `Published ${formatRelative(s.published_at)}` : formatRelative(s.created_at)}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-ivory-600 shrink-0" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
