export type SolapathInviteType = 'family' | 'circle' | 'church' | 'small-group';

export interface ParsedSolapathInvite {
  type: SolapathInviteType;
  code: string;
}

const CUSTOM_SCHEME = 'solapath:';
const CUSTOM_HOST = 'invite';
const MAX_URL_LENGTH = 512;
const MAX_CODE_LENGTH = 128;

const INVITE_TYPES: readonly SolapathInviteType[] = ['family', 'circle', 'church', 'small-group'];

const HEX_CODE_LENGTH: Partial<Record<SolapathInviteType, number>> = {
  family: 32,
  circle: 24,
};

const RESERVED_CODE_PATTERN = /^[a-z0-9_-]{8,128}$/;

export function getInviteBaseUrl(): string | null {
  const raw = import.meta.env.VITE_SOLAPATH_INVITE_BASE_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.search || url.hash) return null;
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  } catch {
    return null;
  }
}

function isInviteType(value: string): value is SolapathInviteType {
  return (INVITE_TYPES as readonly string[]).includes(value);
}

function normalizeCode(type: SolapathInviteType, rawCode: string): string | null {
  const code = rawCode.trim();
  if (!code || code.length > MAX_CODE_LENGTH) return null;
  const hexLength = HEX_CODE_LENGTH[type];
  if (hexLength !== undefined) {
    const lowered = code.toLowerCase();
    return new RegExp(`^[a-f0-9]{${hexLength}}$`).test(lowered) ? lowered : null;
  }
  const lowered = code.toLowerCase();
  return RESERVED_CODE_PATTERN.test(lowered) ? lowered : null;
}

export function buildSolapathInviteUrl(type: SolapathInviteType, code: string): string {
  const base = getInviteBaseUrl();
  const prefix = base ? `${base}/invite` : `solapath://invite`;
  return `${prefix}/${type}/${code.trim()}`;
}

export function parseSolapathInviteUrl(rawUrl: string): ParsedSolapathInvite | null {
  const input = rawUrl.trim();
  if (!input || input.length > MAX_URL_LENGTH) return null;

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  let segments: string[];
  if (url.protocol === CUSTOM_SCHEME && url.hostname === CUSTOM_HOST) {
    segments = url.pathname.split('/').filter(Boolean);
  } else if (url.protocol === 'https:') {
    const base = getInviteBaseUrl();
    const location = `${url.origin}${url.pathname}`;
    const prefix = `${base}/invite/`;
    if (!base || !location.startsWith(prefix)) return null;
    segments = location.slice(prefix.length).split('/').filter(Boolean);
  } else {
    return null;
  }

  if (segments.length !== 2) return null;
  const [rawType, rawCode] = segments;
  if (!isInviteType(rawType)) return null;
  let decodedCode: string;
  try {
    decodedCode = decodeURIComponent(rawCode);
  } catch {
    return null;
  }
  const code = normalizeCode(rawType, decodedCode);
  if (!code) return null;
  return { type: rawType, code };
}
