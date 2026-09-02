import { useState, useEffect, useCallback } from 'react';
import { X, BookOpen, ChevronRight, Calendar, ArrowDown, Sparkles } from 'lucide-react';
import { vibrate, formatRelative } from '@/lib/utils';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import { getMyChurchMembership, getChurch, getChurchStudies, getStudyAssignments } from '@/lib/churchEngine';
import type { Profile } from '@/lib/types';
import type { ChurchStudy, ChurchStudyAssignment } from '@/lib/togetherTypes';

interface Props {
  profile: Profile;
  onBack: () => void;
}

export default function ChurchStudiesScreen({ profile, onBack }: Props) {
  const [studies, setStudies] = useState<ChurchStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStudy, setActiveStudy] = useState<ChurchStudy | null>(null);
  const [assignments, setAssignments] = useState<ChurchStudyAssignment[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const membership = await getMyChurchMembership(profile.id);
      if (membership) {
        const church = await getChurch(membership.church_id);
        if (church) {
          const studs = await getChurchStudies(church.id);
          setStudies(studs);
        }
      }
    } catch {
      setError('Could not load church studies.');
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => { load(); }, [load]);

  async function handleOpenStudy(study: ChurchStudy) {
    vibrate(10);
    setActiveStudy(study);
    const assigns = await getStudyAssignments(study.id);
    setAssignments(assigns);
  }

  if (activeStudy) {
    return (
      <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
        <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
          <button onClick={() => setActiveStudy(null)} className="btn-ghost"><X size={20} /></button>
          <p className="ui-label">From My Church</p><span className="w-10" />
        </header>

        <div className="flex-1 overflow-y-auto px-6 mt-4">
          <div className="animate-fade-in-up">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80 font-medium mb-2">From My Church</p>
              <h2 className="font-serif text-2xl text-ivory-50">{activeStudy.title}</h2>
              {activeStudy.description && <p className="text-ivory-500 text-sm mt-1 leading-relaxed">{activeStudy.description}</p>}
            </div>

            {assignments.length === 0 ? (
              <EmptyState message="No assignments in this study yet." />
            ) : (
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
                    <button onClick={() => { vibrate(8); }} className="btn-secondary w-full mt-3 text-xs">
                      <BookOpen size={12} /> Open Bible to {a.passage_reference}
                    </button>
                  </div>
                ))}
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
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">From My Church</p><span className="w-10" />
      </header>

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

          {loading && <LoadingState message="Loading..." />}
          {error && <ErrorState message={error} onRetry={load} />}
          {!loading && !error && studies.length === 0 && <EmptyState message="No church studies available yet." />}

          {!loading && !error && studies.length > 0 && (
            <div className="flex flex-col gap-2">
              {studies.map((s) => (
                <button key={s.id} onClick={() => handleOpenStudy(s)} className="premium-card p-4 flex items-center gap-3 text-left no-tap-highlight hover:border-gold-500/30 transition-all">
                  <div className="w-9 h-9 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0">
                    <BookOpen size={16} className="text-ivory-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-ivory-100 font-medium text-sm">{s.title}</p>
                    <p className="text-ivory-600 text-xs">{formatRelative(s.created_at)}</p>
                  </div>
                  <ChevronRight size={16} className="text-ivory-600 shrink-0" />
                </button>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 mt-5 px-1">
            <Sparkles size={13} className="text-gold-400/60 shrink-0 mt-0.5" />
            <p className="text-ivory-600 text-xs leading-relaxed font-medium">
              Church content is labeled CHURCH CONTENT. It does not automatically enter SOLAPATH's globally verified theological Library.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
