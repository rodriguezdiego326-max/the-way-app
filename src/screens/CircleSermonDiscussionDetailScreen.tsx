import { useState } from 'react';
import { X, Trash2, BookOpen, AlertCircle } from 'lucide-react';
import { vibrate, formatRelative } from '@/lib/utils';
import SermonConfirmSheet from '@/components/sermon/SermonConfirmSheet';
import { deleteCircleSermonDiscussion } from '@/lib/togetherEngine';
import type { Profile } from '@/lib/types';
import type { Circle, CircleSermonDiscussion } from '@/lib/togetherTypes';

interface Props {
  profile: Profile;
  circle: Circle;
  discussion: CircleSermonDiscussion;
  onBack: () => void;
  onDeleted: () => void;
  onOpenScripture: (reference: string) => boolean;
}

export default function CircleSermonDiscussionDetailScreen({ profile, circle, discussion, onBack, onDeleted, onOpenScripture }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [scriptureError, setScriptureError] = useState<string | null>(null);
  const isCreator = discussion.created_by_profile_id === profile.id;

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCircleSermonDiscussion(discussion.id);
      vibrate(12);
      onDeleted();
    } catch (cause) {
      console.error('circle sermon discussion delete failed', cause);
      setDeleteError("We couldn't delete this discussion. Please try again.");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onBack} className="btn-ghost" aria-label="Back"><X size={20} /></button>
        <p className="ui-label truncate max-w-[60%]">{circle.name}</p>
        <span className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <p className="ui-label mb-2">From a sermon</p>
          <h2 className="font-serif text-2xl text-ivory-50 leading-tight mb-2">{discussion.sermon_title || 'Sermon discussion'}</h2>
          <p className="text-ivory-500 text-xs mb-6">
            {isCreator ? 'Shared by you' : 'Shared by a member'} · {formatRelative(discussion.created_at)}
          </p>

          <section className="premium-card p-5 mb-4">
            <p className="ui-label mb-3">Discussion</p>
            <p className="text-ivory-200 text-sm leading-[1.5] whitespace-pre-line">{discussion.discussion_body}</p>
          </section>

          {discussion.scripture_references.length > 0 && (
            <section className="mb-6">
              <p className="ui-label mb-3 px-1">Scripture to read</p>
              <div className="flex flex-col gap-2">
                {discussion.scripture_references.map((reference) => (
                  <button
                    key={reference}
                    onClick={() => {
                      vibrate(8);
                      setScriptureError(onOpenScripture(reference) ? null : `We couldn't open ${reference} in the Bible.`);
                    }}
                    className="premium-card p-4 flex items-center justify-between gap-3 text-left hover:border-gold-500/30 transition-all duration-300"
                  >
                    <span className="font-serif text-ivory-50 text-lg">{reference}</span>
                    <span className="flex items-center gap-1.5 text-gold-300 text-xs shrink-0">
                      <BookOpen size={14} /> Open in Bible
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {scriptureError && (
            <div className="flex items-start gap-2 mb-4 px-1" role="alert">
              <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
              <p className="text-ivory-300 text-xs leading-relaxed">{scriptureError}</p>
            </div>
          )}

          {deleteError && (
            <div className="flex items-start gap-2 mb-4 px-1" role="alert">
              <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
              <p className="text-ivory-300 text-xs leading-relaxed">{deleteError}</p>
            </div>
          )}

          {isCreator && (
            <button onClick={() => { vibrate(8); setConfirmDelete(true); }} disabled={deleting} className="btn-secondary w-full disabled:opacity-40 mb-8">
              <Trash2 size={16} /> Delete Discussion
            </button>
          )}
        </div>
      </div>

      <SermonConfirmSheet
        open={confirmDelete}
        title="Delete this sermon discussion?"
        body="This removes it from the Circle for everyone. Your private sermon recording, transcript, and Sermon Insights will not be changed."
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
