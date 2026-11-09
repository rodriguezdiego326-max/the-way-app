import { useState } from 'react';
import { X, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { vibrate, formatRelative } from '@/lib/utils';
import SermonConfirmSheet from '@/components/sermon/SermonConfirmSheet';
import FamilyDiscussionContent from '@/components/family/FamilyDiscussionContent';
import { completeFamilySermonDiscussion, deleteFamilySermonDiscussion } from '@/lib/familySermonDiscussions';
import type { FamilySermonDiscussion } from '@/lib/familyTypes';

interface Props {
  discussion: FamilySermonDiscussion;
  onBack: () => void;
  onDeleted: () => void;
  onOpenScripture: (reference: string) => boolean;
}

export default function FamilySermonDiscussionDetailScreen({ discussion, onBack, onDeleted, onOpenScripture }: Props) {
  const [current, setCurrent] = useState(discussion);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [scriptureError, setScriptureError] = useState<string | null>(null);
  const isComplete = current.status === 'complete';

  async function handleComplete() {
    if (completing || isComplete) return;
    setCompleting(true);
    setCompleteError(null);
    try {
      const updated = await completeFamilySermonDiscussion(current.id);
      vibrate(12);
      setCurrent(updated);
    } catch (cause) {
      console.error('family sermon discussion complete failed', cause);
      setCompleteError("We couldn't mark this discussion complete. Please try again.");
    } finally {
      setCompleting(false);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteFamilySermonDiscussion(current.id);
      vibrate(12);
      onDeleted();
    } catch (cause) {
      console.error('family sermon discussion delete failed', cause);
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
        <p className="ui-label">Family Discussion</p>
        <span className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up">
          <p className="text-ivory-500 text-xs mb-6">
            {isComplete ? 'Completed' : 'Ready to talk through'} · Saved {formatRelative(current.created_at)}
          </p>

          <FamilyDiscussionContent
            sermonTitle={current.sermon_title}
            mainPoint={current.main_point}
            scriptures={current.scripture_references}
            question={current.discussion_question}
            body={current.discussion_body}
            onOpenScripture={(reference) => {
              vibrate(8);
              setScriptureError(onOpenScripture(reference) ? null : `We couldn't open ${reference} in the Bible.`);
            }}
          />

          {scriptureError && (
            <div className="flex items-start gap-2 mt-4 px-1" role="alert">
              <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
              <p className="text-ivory-300 text-xs leading-relaxed">{scriptureError}</p>
            </div>
          )}

          <div className="flex flex-col gap-2 mt-6">
            {!isComplete && (
              <button onClick={handleComplete} disabled={completing} className="btn-primary w-full disabled:opacity-40">
                <CheckCircle2 size={16} /> {completing ? 'Saving...' : 'Mark as Complete'}
              </button>
            )}
            {completeError && (
              <div className="flex items-start gap-2 px-1" role="alert">
                <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
                <p className="text-ivory-300 text-xs leading-relaxed">{completeError}</p>
              </div>
            )}
            {deleteError && (
              <div className="flex items-start gap-2 px-1" role="alert">
                <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
                <p className="text-ivory-300 text-xs leading-relaxed">{deleteError}</p>
              </div>
            )}
            <button onClick={() => { vibrate(8); setConfirmDelete(true); }} disabled={deleting} className="btn-secondary w-full disabled:opacity-40 mb-8">
              <Trash2 size={16} /> Delete Discussion
            </button>
          </div>
        </div>
      </div>

      <SermonConfirmSheet
        open={confirmDelete}
        title="Delete this Family discussion?"
        body="This removes it from your Family. Your sermon recording and Sermon Insights will not be changed."
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
