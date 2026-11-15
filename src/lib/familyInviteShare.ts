import { Share } from '@capacitor/share';
import type { FamilyInvitation } from '@/lib/familyAccountEngine';

const EXPIRY_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
};

export const REVOKE_INVITATION_DIALOG = {
  title: 'Revoke this invitation?',
  body: 'This code will no longer be able to join your Family. Existing Family members will not be affected.',
  confirmLabel: 'Revoke',
  cancelLabel: 'Cancel',
};

export function formatInviteExpiry(expiresAt: string | null | undefined): string {
  if (!expiresAt) return 'No expiration';
  return new Date(expiresAt).toLocaleString(undefined, EXPIRY_FORMAT);
}

export function formatFamilyInviteShareText(
  familyName: string,
  invitation: Pick<FamilyInvitation, 'invite_code' | 'expires_at'>,
): string {
  const expiryLine = invitation.expires_at
    ? `Expires: ${formatInviteExpiry(invitation.expires_at)}`
    : 'This invitation does not expire.';
  return [
    `You're invited to join “${familyName}” in SOLAPATH Family.`,
    'Open SOLAPATH → Family → Join a Family and enter this invitation code:',
    invitation.invite_code,
    expiryLine,
  ].join('\n\n');
}

export async function shareFamilyInvite(
  familyName: string,
  invitation: Pick<FamilyInvitation, 'invite_code' | 'expires_at'>,
): Promise<void> {
  await Share.share({
    title: 'Join my SOLAPATH Family',
    text: formatFamilyInviteShareText(familyName, invitation),
    dialogTitle: 'Share invitation',
  });
}

export async function copyFamilyInviteCode(code: string): Promise<void> {
  await navigator.clipboard.writeText(code);
}
