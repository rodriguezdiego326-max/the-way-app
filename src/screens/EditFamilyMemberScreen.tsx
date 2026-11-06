import { useState } from 'react';
import { AlertCircle, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate } from '@/lib/utils';
import type { AgeRange, FamilyMember } from '@/lib/familyTypes';
import FamilyMemberFields from '@/components/FamilyMemberFields';

interface EditFamilyMemberScreenProps {
  member: FamilyMember;
  onClose: () => void;
  onSaved: (member: FamilyMember) => void;
  onDeleted: (memberId: string) => void;
}

export default function EditFamilyMemberScreen({ member, onClose, onSaved, onDeleted }: EditFamilyMemberScreenProps) {
  const [nickname, setNickname] = useState(member.nickname ?? '');
  const [ageRange, setAgeRange] = useState<AgeRange>(member.age_range);
  const [relationship, setRelationship] = useState(member.relationship ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function saveChanges() {
    if (saving) return;
    vibrate(10);
    setSaving(true);
    setSaveError(null);

    const { data, error } = await supabase
      .from('family_members')
      .update({
        nickname: nickname.trim() || null,
        age_range: ageRange,
        relationship: relationship.trim() || null,
      })
      .eq('id', member.id)
      .eq('family_profile_id', member.family_profile_id)
      .select('*')
      .single();

    if (error || !data) {
      console.error('[SOLAPATH] Family member update failed:', error?.message || 'No data returned');
      setSaveError('We couldn\'t save these changes. Please try again.');
      setSaving(false);
      return;
    }

    onSaved(data as FamilyMember);
  }

  function closeDeleteConfirm() {
    if (deleting) return;
    setConfirmingDelete(false);
  }

  async function confirmDelete() {
    if (deleting) return;
    vibrate(20);
    setDeleting(true);
    setDeleteError(null);

    const { data, error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', member.id)
      .eq('family_profile_id', member.family_profile_id)
      .select('id');

    if (error || !data || data.length === 0) {
      console.error('[SOLAPATH] Family member delete failed:', error?.message || 'No rows deleted');
      setDeleteError('We couldn\'t remove this family member. Please try again.');
      setDeleting(false);
      return;
    }

    setDeleting(false);
    onDeleted(member.id);
  }

  return (
    <div className="app-container bg-ink-950 bg-parchment h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onClose} className="btn-ghost" aria-label="Close">
          <X size={20} />
        </button>
        <p className="ui-label">Edit Family Member</p>
        <span className="w-10" />
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pt-6 nav-safe-padding animate-fade-in">

        <div className="flex flex-col gap-5">
          <FamilyMemberFields
            nickname={nickname}
            onNicknameChange={setNickname}
            ageRange={ageRange}
            onAgeRangeChange={setAgeRange}
            relationship={relationship}
            onRelationshipChange={setRelationship}
          />
          {saveError && (
            <div role="alert" className="premium-card p-3 border-error/30 animate-fade-in">
              <p className="text-error text-sm">{saveError}</p>
            </div>
          )}
          <button onClick={saveChanges} disabled={saving} className="btn-primary w-full disabled:opacity-40">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <div className="mt-4 border-t border-ink-700 pt-6">
            <button
              onClick={() => setConfirmingDelete(true)}
              disabled={saving || deleting}
              className="btn-secondary w-full text-error border-error/30 hover:bg-error/10 disabled:opacity-40"
            >
              <Trash2 size={16} /> Delete Family Member
            </button>
          </div>
        </div>
      </div>

      {confirmingDelete && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center px-4 animate-fade-in" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="absolute inset-0 bg-ink-950/60" onClick={closeDeleteConfirm} />
          <div role="alertdialog" aria-labelledby="delete-family-member-title" className="relative w-full max-w-lg bg-ink-800/95 backdrop-blur-md border border-error/30 rounded-2xl p-5 shadow-xl shadow-ink-950/50 animate-fade-in-up mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={18} className="text-error" />
              <p id="delete-family-member-title" className="text-ivory-50 text-base font-medium font-serif">Delete this family member?</p>
            </div>
            <p className="text-ivory-400 text-sm leading-relaxed mb-4">
              This removes {member.nickname || 'this person'} from your family list. This cannot be undone.
            </p>
            {deleteError && <p role="alert" className="text-error text-xs mb-3">{deleteError}</p>}
            <div className="flex flex-col gap-2">
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="btn-secondary w-full text-error border-error/30 hover:bg-error/10 disabled:opacity-40"
              >
                <Trash2 size={16} /> {deleting ? 'Deleting...' : 'Delete'}
              </button>
              <button onClick={closeDeleteConfirm} disabled={deleting} className="btn-secondary w-full">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
