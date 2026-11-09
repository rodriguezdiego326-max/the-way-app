import { Share } from '@capacitor/share';

export const INVITE_EXPIRY_OPTIONS: { label: string; hours: number | null }[] = [
  { label: '24 Hours', hours: 24 },
  { label: '7 Days', hours: 168 },
  { label: 'No Expiration', hours: null },
];

export const DEFAULT_INVITE_EXPIRY_HOURS = 168;

export function formatInviteExpiry(expiresAt: string | null): string {
  if (!expiresAt) return 'No expiration';
  return new Date(expiresAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatInviteCreated(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export function buildInviteShareText(circleName: string, code: string, expiresAt: string | null): string {
  const lines = [
    `You're invited to join “${circleName}” in SOLAPATH.`,
    '',
    'Open SOLAPATH → Together → Join a Circle and enter this invitation code:',
    '',
    code,
  ];
  if (expiresAt) {
    lines.push('', `This invitation expires ${formatInviteExpiry(expiresAt)}.`);
  }
  return lines.join('\n');
}

export async function shareInvitation(circleName: string, code: string, expiresAt: string | null): Promise<void> {
  await Share.share({
    title: `Join ${circleName} in SOLAPATH`,
    text: buildInviteShareText(circleName, code, expiresAt),
    dialogTitle: 'Invite to Circle',
  });
}
