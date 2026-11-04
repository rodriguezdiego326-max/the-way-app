import { useState, useEffect, useCallback } from 'react';
import { X, Pencil, Plus, Send, Archive, RotateCcw } from 'lucide-react';
import { vibrate } from '@/lib/utils';
import { LoadingState, ErrorState, EmptyState } from '@/components/States';
import {
  getStudyAssignments, updateChurchStudy, setChurchStudyStatus,
  createStudyAssignment, updateStudyAssignment, type AssignmentInput,
} from '@/lib/churchStudyEngine';
import ChurchAssignmentForm from '@/components/church/ChurchAssignmentForm';
import type { ChurchStudy, ChurchStudyAssignment, ChurchStudyStatus } from '@/lib/togetherTypes';

interface Props {
  study: ChurchStudy;
  onChanged: () => void;
  onClose: () => void;
}

type StatusAction = 'publish' | 'archive' | 'restore';

const STATUS_ACTIONS: Record<StatusAction, { title: string; body: string; confirm: string; status: ChurchStudyStatus }> = {
  publish: {
    title: 'Publish this study?',
    body: "Members of your church will be able to read it. It is labeled CHURCH CONTENT and is separate from SOLAPATH's Verified Library.",
    confirm: 'Publish',
    status: 'published',
  },
  archive: {
    title: 'Archive this study?',
    body: 'Members will no longer see it. Nothing is deleted, and you can move it back to drafts later.',
    confirm: 'Archive',
    status: 'archived',
  },
  restore: {
    title: 'Move back to drafts?',
    body: 'Members will not see this study until you publish it again.',
    confirm: 'Move to Drafts',
    status: 'draft',
  },
};

type FormState = { mode: 'create' } | { mode: 'edit'; assignment: ChurchStudyAssignment } | null;

export default function ChurchStudyEditor({ study, onChanged, onClose }: Props) {
  const [title, setTitle] = useState(study.title);
  const [description, setDescription] = useState(study.description ?? '');
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [assignments, setAssignments] = useState<ChurchStudyAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [assignmentsError, setAssignmentsError] = useState(false);
  const [form, setForm] = useState<FormState>(null);
  const [pendingAction, setPendingAction] = useState<StatusAction | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadAssignments = useCallback(async () => {
    setAssignmentsLoading(true);
    setAssignmentsError(false);
    try {
      setAssignments(await getStudyAssignments(study.id));
    } catch {
      setAssignmentsError(true);
    } finally {
      setAssignmentsLoading(false);
    }
  }, [study.id]);

  useEffect(() => { loadAssignments(); }, [loadAssignments]);

  async function handleSaveDetails() {
    if (!title.trim() || savingDetails) return;
    setSavingDetails(true);
    setDetailsError(null);
    const ok = await updateChurchStudy(study.id, { title, description: description || null });
    setSavingDetails(false);
    if (!ok) {
      setDetailsError('Could not save the study details. Please try again.');
      return;
    }
    vibrate(10);
    onChanged();
  }

  async function handleConfirmAction() {
    if (!pendingAction || actionBusy) return;
    setActionBusy(true);
    setActionError(null);
    const ok = await setChurchStudyStatus(study.id, STATUS_ACTIONS[pendingAction].status);
    setActionBusy(false);
    if (!ok) {
      setActionError('Could not change the study status. Please try again.');
      return;
    }
    vibrate(15);
    setPendingAction(null);
    onChanged();
  }

  async function handleSaveAssignment(input: AssignmentInput, assignmentId: string | null): Promise<boolean> {
    const ok = assignmentId
      ? await updateStudyAssignment(assignmentId, input)
      : (await createStudyAssignment(study.id, input)) !== null;
    if (!ok) return false;
    vibrate(10);
    setForm(null);
    await loadAssignments();
    return true;
  }

  const nextSortOrder = assignments.reduce((max, a) => Math.max(max, a.sort_order), -1) + 1;
  const nextAction: StatusAction | null = study.status === 'published' ? 'archive' : study.status === 'draft' ? 'publish' : 'restore';
  const NextIcon = study.status === 'published' ? Archive : study.status === 'draft' ? Send : RotateCcw;
  const nextLabel = study.status === 'published' ? 'Archive Study' : study.status === 'draft' ? 'Publish Study' : 'Move to Drafts';
  const statusLabel = study.status === 'published' ? 'Published' : study.status === 'draft' ? 'Draft' : 'Archived';

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen pb-28 flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onClose} className="btn-ghost" aria-label="Back"><X size={20} /></button>
        <p className="ui-label">Edit Study</p>
        <span className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 mt-4">
        <div className="animate-fade-in-up flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-gold-500/10 text-gold-300">CHURCH CONTENT</span>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-ink-700/60 text-ivory-300">{statusLabel}</span>
          </div>

          <section className="premium-card p-4 flex flex-col gap-3">
            <p className="ui-label">Details</p>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Study title" className="input-field" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description (optional)" rows={3} className="input-field" />
            {detailsError && <p className="text-error text-xs">{detailsError}</p>}
            <button type="button" onClick={handleSaveDetails} disabled={savingDetails || !title.trim()} className="btn-secondary text-sm disabled:opacity-40">
              {savingDetails ? 'Saving...' : 'Save Details'}
            </button>
          </section>

          <section className="premium-card p-4 flex flex-col gap-3">
            <p className="ui-label">Status</p>
            <p className="text-ivory-500 text-xs leading-relaxed">
              {study.status === 'published'
                ? 'Members can read this study now.'
                : study.status === 'draft'
                  ? 'Only you and other publishers can see this draft.'
                  : 'Hidden from members. Nothing has been deleted.'}
            </p>
            {actionError && <p className="text-error text-xs">{actionError}</p>}
            {nextAction && (
              <button type="button" onClick={() => { setActionError(null); setPendingAction(nextAction); }} className="btn-primary text-sm">
                <NextIcon size={14} /> {nextLabel}
              </button>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="ui-label">Assignments</p>
              {form === null && (
                <button type="button" onClick={() => { vibrate(6); setForm({ mode: 'create' }); }} className="btn-ghost text-xs">
                  <Plus size={12} /> Add
                </button>
              )}
            </div>

            {form && (
              <div className="premium-card p-4 mb-3">
                <ChurchAssignmentForm
                  initial={form.mode === 'edit' ? form.assignment : null}
                  nextSortOrder={nextSortOrder}
                  onSave={(input) => handleSaveAssignment(input, form.mode === 'edit' ? form.assignment.id : null)}
                  onCancel={() => setForm(null)}
                />
              </div>
            )}

            {assignmentsLoading && <LoadingState message="Loading..." />}
            {assignmentsError && <ErrorState message="Could not load assignments." onRetry={loadAssignments} />}
            {!assignmentsLoading && !assignmentsError && assignments.length === 0 && (
              <EmptyState message="No assignments yet. Add a passage for each week." />
            )}
            {!assignmentsLoading && !assignmentsError && assignments.length > 0 && (
              <div className="flex flex-col gap-2">
                {assignments.map((a) => (
                  <div key={a.id} className="premium-card p-4 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-gold-300">{a.week_label}</p>
                      <p className="font-serif text-base text-ivory-100 mt-1">{a.passage_reference}</p>
                      {a.reading_objective && <p className="text-ivory-500 text-xs mt-1 leading-relaxed">{a.reading_objective}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => { vibrate(6); setForm({ mode: 'edit', assignment: a }); }}
                      className="btn-ghost text-xs shrink-0"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {pendingAction && (
        <div className="fixed inset-0 z-[70] bg-ink-950/90 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="premium-card p-6 max-w-sm w-full animate-fade-in-up">
            <h3 className="font-serif text-xl text-ivory-50 mb-2">{STATUS_ACTIONS[pendingAction].title}</h3>
            <p className="text-ivory-500 text-sm leading-relaxed mb-4">{STATUS_ACTIONS[pendingAction].body}</p>
            {actionError && <p className="text-error text-xs mb-3">{actionError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setPendingAction(null)} disabled={actionBusy} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button type="button" onClick={handleConfirmAction} disabled={actionBusy} className="btn-primary flex-1 text-sm disabled:opacity-40">
                {actionBusy ? 'Working...' : STATUS_ACTIONS[pendingAction].confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
