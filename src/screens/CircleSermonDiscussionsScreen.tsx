import { useCallback, useEffect, useState } from 'react';
import { X, ChevronRight, MessageSquare } from 'lucide-react';
import { vibrate, formatRelative } from '@/lib/utils';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import { getCircleSermonDiscussions } from '@/lib/togetherEngine';
import type { Profile } from '@/lib/types';
import type { Circle, CircleSermonDiscussion } from '@/lib/togetherTypes';

interface Props {
  profile: Profile;
  circle: Circle;
  onBack: () => void;
  onOpenDiscussion: (discussion: CircleSermonDiscussion) => void;
}

export default function CircleSermonDiscussionsScreen({ profile, circle, onBack, onOpenDiscussion }: Props) {
  const [discussions, setDiscussions] = useState<CircleSermonDiscussion[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      setDiscussions(await getCircleSermonDiscussions(circle.id));
    } catch (cause) {
      console.error('circle sermon discussions load failed', cause);
      setError(true);
    }
  }, [circle.id]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost" aria-label="Back"><X size={20} /></button>
        <p className="ui-label">Sermon Discussions</p>
        <span className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <h2 className="font-serif text-2xl text-ivory-50 mb-1">{circle.name}</h2>
          <p className="text-ivory-500 text-sm mb-6">Discussions members chose to share from a sermon.</p>

          {!discussions && !error && <LoadingState message="Loading discussions..." />}
          {error && <ErrorState message="We couldn't load sermon discussions. Please try again." onRetry={load} />}

          {discussions && discussions.length === 0 && (
            <EmptyState message="No sermon discussions yet. When a member shares one from Sermon Insights, it will appear here." />
          )}

          {discussions && discussions.length > 0 && (
            <div className="flex flex-col gap-2">
              {discussions.map((discussion) => (
                <button
                  key={discussion.id}
                  onClick={() => { vibrate(8); onOpenDiscussion(discussion); }}
                  className="premium-card p-4 flex items-start gap-3 text-left hover:border-gold-500/30 transition-all duration-300 group"
                >
                  <div className="w-9 h-9 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare size={16} className="text-ivory-400 group-hover:text-gold-300 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="ui-label mb-1.5">From a sermon</p>
                    {discussion.sermon_title && <p className="text-ivory-100 font-medium text-sm truncate">{discussion.sermon_title}</p>}
                    <p className="text-ivory-400 text-xs leading-relaxed mt-1 line-clamp-2">{discussion.discussion_body}</p>
                    {discussion.scripture_references.length > 0 && (
                      <p className="text-gold-200/80 text-xs mt-2">{discussion.scripture_references.join(', ')}</p>
                    )}
                    <p className="text-ivory-600 text-xs mt-2">
                      {discussion.created_by_profile_id === profile.id ? 'Shared by you' : 'Shared by a member'} · {formatRelative(discussion.created_at)}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-ivory-600 shrink-0 mt-2" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
