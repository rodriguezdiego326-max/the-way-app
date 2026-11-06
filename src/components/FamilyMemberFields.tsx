import type { AgeRange } from '@/lib/familyTypes';
import { vibrate } from '@/lib/utils';

const ageRangeOptions: { id: AgeRange; label: string }[] = [
  { id: '3-5', label: '3–5' },
  { id: '6-8', label: '6–8' },
  { id: '9-12', label: '9–12' },
  { id: '13-15', label: '13–15' },
  { id: '16-17', label: '16–17' },
  { id: '18+', label: '18+ / Adult' },
];

interface FamilyMemberFieldsProps {
  nickname: string;
  onNicknameChange: (value: string) => void;
  ageRange: AgeRange;
  onAgeRangeChange: (value: AgeRange) => void;
  relationship: string;
  onRelationshipChange: (value: string) => void;
}

export default function FamilyMemberFields({
  nickname,
  onNicknameChange,
  ageRange,
  onAgeRangeChange,
  relationship,
  onRelationshipChange,
}: FamilyMemberFieldsProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label htmlFor="family-member-nickname" className="text-sm text-ivory-400 mb-2 block">Nickname or First Name (optional)</label>
        <input
          id="family-member-nickname"
          type="text"
          value={nickname}
          onChange={(e) => onNicknameChange(e.target.value)}
          placeholder="Child A"
          className="input-field"
        />
        <p className="text-ivory-600 text-xs mt-2 leading-relaxed">
          You do not need to enter a real name. A nickname or label like "Child A" works fine.
        </p>
      </div>
      <div>
        <p className="text-sm text-ivory-400 mb-2 block">Age Range</p>
        <div className="grid grid-cols-3 gap-2">
          {ageRangeOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              aria-pressed={ageRange === opt.id}
              onClick={() => {
                vibrate(6);
                onAgeRangeChange(opt.id);
              }}
              className={`min-h-[44px] py-3 rounded-xl border text-sm font-medium transition-all no-tap-highlight ${
                ageRange === opt.id
                  ? 'bg-gold-500/10 border-gold-500/40 text-ivory-50'
                  : 'bg-ink-800/40 border-ink-700/40 text-ivory-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="family-member-relationship" className="text-sm text-ivory-400 mb-2 block">Relationship (optional)</label>
        <input
          id="family-member-relationship"
          type="text"
          value={relationship}
          onChange={(e) => onRelationshipChange(e.target.value)}
          placeholder="Son, Daughter, etc."
          className="input-field"
        />
      </div>
    </div>
  );
}
