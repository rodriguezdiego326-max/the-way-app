import { Users, UserMinus } from 'lucide-react';
import { formatRelative } from '@/lib/utils';
import type { CircleMemberSummary } from '@/lib/togetherTypes';

interface Props {
  members: CircleMemberSummary[];
  canRemove: boolean;
  onRemove: (member: CircleMemberSummary) => void;
}

export const SAFE_MEMBER_FALLBACK_NAME = 'SOLAPATH Member';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  LEADER: 'Leader',
  MEMBER: 'Member',
};

function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? 'Member';
}

export default function CircleMemberList({ members, canRemove, onRemove }: Props) {
  return (
    <div className="flex flex-col gap-2 mb-6">
      {members.map((m) => {
        const isOwner = m.member_role === 'OWNER';
        const showRemove = canRemove && !isOwner && !m.is_current_user;
        const name = m.member_display_name?.trim() || SAFE_MEMBER_FALLBACK_NAME;
        const meta = [roleLabel(m.member_role), m.is_current_user ? 'You' : null].filter(Boolean).join(' · ');
        return (
          <div key={m.member_profile_id} className="premium-card p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-ink-700/50 flex items-center justify-center shrink-0">
              <Users size={14} className="text-ivory-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-ivory-100 text-sm font-medium truncate">{name}</p>
              <p className="text-ivory-500 text-xs">{meta} · Joined {formatRelative(m.member_joined_at)}</p>
            </div>
            {showRemove && (
              <button
                onClick={() => onRemove(m)}
                className="btn-ghost text-xs text-ivory-500 hover:text-error"
                aria-label={`Remove ${name} from Circle`}
              >
                <UserMinus size={14} /> Remove
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
