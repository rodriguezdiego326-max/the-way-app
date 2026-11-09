import { useCallback, useEffect, useState } from 'react';
import { X, Check, BookOpen, AlertCircle } from 'lucide-react';
import { formatRelative } from '@/lib/utils';
import { LoadingState } from '@/components/States';
import { loadMyFamilyProfile, getFamilySermonDiscussions } from '@/lib/familySermonDiscussions';
import type { FamilySermonDiscussion } from '@/lib/familyTypes';

interface Props {
  onBack: () => void;
  onOpenDiscussion: (discussion: FamilySermonDiscussion) => void;
}

export default function FamilySermonDiscussionsScreen({ onBack, onOpenDiscussion }: Props) {
  const [discussions, setDiscussions] = useState<FamilySermonDiscussion[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const profile = await loadMyFamilyProfile();
      const list = profile ? await getFamilySermonDiscussions(profile.id) : [];
      setDiscussions(list);
    } catch (cause) {
      console.error('family sermon discussions load failed', cause);
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen nav-safe-padding">
      <header className="px-6 pt-14 safe-top">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="btn-ghost" aria-label="Back"><X size={20} /></button>
          <p className="ui-label">Family</p>
          <span className="w-10" />
        </div>
        <h1 className="font-serif text-4xl text-ivory-50 mt-6 tracking-tight">Sermon Discussions</h1>
        <p className="text-ivory-500 text-sm mt-2 leading-relaxed">Bring a sermon point back to Scripture and talk through it together.</p>
      </header>

      <div className="px-6 mt-8">
        {!discussions && !loadError && <LoadingState message="Loading Family discussions..." />}

        {loadError && (
          <div className="premium-card p-5 animate-fade-in-up" role="alert">
            <div className="flex items-start gap-2 mb-4">
              <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
              <p className="text-ivory-300 text-sm leading-relaxed">We couldn&apos;t load your Family discussions. Please try again.</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={load} className="btn-primary w-full">Retry</button>
            </div>
          </div>
        )}

        {discussions && discussions.length === 0 && (
          <div className="premium-card p-5 text-center animate-fade-in-up">
            <p className="text-ivory-400 text-sm">No sermon discussions saved yet.</p>
          </div>
        )}

        {discussions && discussions.length > 0 && (
          <div className="flex flex-col gap-3 animate-fade-in-up">
            {discussions.map((discussion) => {
              const isComplete = discussion.status === 'complete';
              const firstReference = discussion.scripture_references[0];
              return (
                <button
                  key={discussion.id}
                  onClick={() => onOpenDiscussion(discussion)}
                  className="premium-card p-5 text-left hover:border-gold-500/30 transition-all duration-300 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`flex items-center gap-1 text-xs ${isComplete ? 'text-sage-400' : 'text-ivory-500'}`}>
                      {isComplete && <Check size={12} />} {isComplete ? 'Complete' : 'Ready'}
                    </span>
                    <span className="text-ivory-600 text-xs">{formatRelative(discussion.created_at)}</span>
                  </div>
                  {discussion.sermon_title && (
                    <p className="font-serif text-lg text-ivory-50 leading-snug">{discussion.sermon_title}</p>
                  )}
                  {discussion.main_point && (
                    <p className="text-ivory-300 text-sm leading-relaxed">{discussion.main_point}</p>
                  )}
                  {!discussion.sermon_title && !discussion.main_point && (
                    <p className="font-serif text-lg text-ivory-50 leading-snug">Family discussion</p>
                  )}
                  {firstReference && (
                    <p className="flex items-center gap-1.5 text-ivory-500 text-xs">
                      <BookOpen size={12} /> {firstReference}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
