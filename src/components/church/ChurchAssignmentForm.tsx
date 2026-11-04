import { useState } from 'react';
import { vibrate } from '@/lib/utils';
import { parsePassageReference } from '@/lib/passageParser';
import type { AssignmentInput } from '@/lib/churchStudyEngine';
import type { ChurchStudyAssignment } from '@/lib/togetherTypes';

interface Props {
  initial: ChurchStudyAssignment | null;
  nextSortOrder: number;
  onSave: (input: AssignmentInput) => Promise<boolean>;
  onCancel: () => void;
}

export default function ChurchAssignmentForm({ initial, nextSortOrder, onSave, onCancel }: Props) {
  const [weekLabel, setWeekLabel] = useState(initial?.week_label ?? '');
  const [passage, setPassage] = useState(initial?.passage_reference ?? '');
  const [objective, setObjective] = useState(initial?.reading_objective ?? '');
  const [questions, setQuestions] = useState((initial?.discussion_questions ?? []).join('\n'));
  const [prayerFocus, setPrayerFocus] = useState(initial?.prayer_focus ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (saving) return;
    if (!weekLabel.trim()) {
      setError('Add a week label, such as "Week 1".');
      return;
    }
    if (!parsePassageReference(passage.trim())) {
      setError('Use a passage such as "John 3:16" or "Romans 8:28-30".');
      return;
    }
    setSaving(true);
    setError(null);
    const ok = await onSave({
      week_label: weekLabel.trim(),
      passage_reference: passage.trim(),
      reading_objective: objective.trim() || null,
      discussion_questions: questions.split('\n').map((q) => q.trim()).filter(Boolean),
      prayer_focus: prayerFocus.trim() || null,
      sort_order: initial?.sort_order ?? nextSortOrder,
    });
    setSaving(false);
    if (!ok) {
      setError('Could not save this assignment. Please try again.');
      return;
    }
    vibrate(10);
  }

  return (
    <div className="flex flex-col gap-3">
      <input value={weekLabel} onChange={(e) => setWeekLabel(e.target.value)} placeholder="Week label, e.g. Week 1" className="input-field" />
      <input value={passage} onChange={(e) => setPassage(e.target.value)} placeholder="Passage, e.g. Romans 8:28-30" className="input-field" />
      <textarea value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Reading objective (optional)" rows={2} className="input-field" />
      <textarea value={questions} onChange={(e) => setQuestions(e.target.value)} placeholder="Discussion questions, one per line (optional)" rows={3} className="input-field" />
      <input value={prayerFocus} onChange={(e) => setPrayerFocus(e.target.value)} placeholder="Prayer focus (optional)" className="input-field" />
      {error && <p className="text-error text-xs">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} disabled={saving} className="btn-secondary flex-1 text-sm">Cancel</button>
        <button type="button" onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm disabled:opacity-40">
          {saving ? 'Saving...' : initial ? 'Save Assignment' : 'Add Assignment'}
        </button>
      </div>
    </div>
  );
}
