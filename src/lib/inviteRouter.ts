import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { buildSolapathInviteUrl, getInviteBaseUrl, parseSolapathInviteUrl, type ParsedSolapathInvite } from '@/lib/inviteLinks';

const PENDING_INVITE_KEY = 'solapath_pending_invite';
const DUPLICATE_WINDOW_MS = 1500;

export type InviteRoute =
  | { kind: 'valid'; invite: ParsedSolapathInvite }
  | { kind: 'invalid' };

export function loadPendingInvite(): ParsedSolapathInvite | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(PENDING_INVITE_KEY);
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as Partial<ParsedSolapathInvite>;
    if (typeof stored.type !== 'string' || typeof stored.code !== 'string') return null;
    return parseSolapathInviteUrl(buildSolapathInviteUrl(stored.type as ParsedSolapathInvite['type'], stored.code));
  } catch {
    return null;
  }
}

export function loadInviteRoute(): InviteRoute | null {
  const invite = loadPendingInvite();
  return invite ? { kind: 'valid', invite } : null;
}

export function savePendingInvite(invite: ParsedSolapathInvite): void {
  localStorage.setItem(PENDING_INVITE_KEY, JSON.stringify({ type: invite.type, code: invite.code }));
}

export function clearPendingInvite(): void {
  localStorage.removeItem(PENDING_INVITE_KEY);
}

function looksLikeInviteLink(url: string): boolean {
  if (/^solapath:\/\/invite(\/|$)/i.test(url)) return true;
  const base = getInviteBaseUrl();
  return !!base && url.startsWith(`${base}/invite`);
}

export function startInviteLinkListener(onRoute: (route: InviteRoute) => void): () => void {
  if (!Capacitor.isNativePlatform()) return () => {};

  let lastUrl: string | null = null;
  let lastSeenAt = 0;
  let disposed = false;
  let handle: PluginListenerHandle | null = null;

  const handleUrl = (url: string) => {
    const now = Date.now();
    if (url === lastUrl && now - lastSeenAt < DUPLICATE_WINDOW_MS) return;
    lastUrl = url;
    lastSeenAt = now;

    const invite = parseSolapathInviteUrl(url);
    if (invite) {
      savePendingInvite(invite);
      onRoute({ kind: 'valid', invite });
    } else if (looksLikeInviteLink(url)) {
      onRoute({ kind: 'invalid' });
    }
  };

  CapacitorApp.addListener('appUrlOpen', ({ url }) => handleUrl(url)).then((listener) => {
    if (disposed) void listener.remove();
    else handle = listener;
  });

  CapacitorApp.getLaunchUrl().then((result) => {
    if (result?.url && !disposed) handleUrl(result.url);
  }).catch(() => {});

  return () => {
    disposed = true;
    void handle?.remove();
  };
}
