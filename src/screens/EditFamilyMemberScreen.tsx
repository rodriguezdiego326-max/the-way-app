import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate } from '@/lib/utils';
import type { AgeRange, FamilyMember } from '@/lib/familyTypes';
import FamilyMemberFields from '@/components/FamilyMemberFields';

interface EditFamilyMemberScreenProps {
  member: FamilyMember;
  onClose: () => void;
  onSaved: (member: FamilyMember) => void;
}

export default function EditFamilyMemberScreen({ member, onClose, onSaved }: EditFamilyMemberScreenProps) {
  const [nickname, setNickname] = useState(member.nickname ?? '');
  const [ageRange, setAgeRange] = useState<AgeRange>(member.age_range);
  const [relationship, setRelationship] = useState(member.relationship ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  return (
    <div className="app-container bg-ink-950 bg-parchment min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 pt-14 safe-top shrink-0">
        <button onClick={onClose} className="btn-ghost" aria-label="Close">
          <X size={20} />
        </button>
        <p className="ui-label">Edit Family Member</p>
        <span className="w-10" />
      </header>
      <div className="flex-1 px-6 py-6 animate-fade-in">
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
        </div>
      </div>
      <div className="px-6 pb-10 safe-bottom">
        <button onClick={saveChanges} disabled={saving} className="btn-primary w-full disabled:opacity-40">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
