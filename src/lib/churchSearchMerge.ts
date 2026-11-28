import type { ChurchProfile } from '@/lib/togetherTypes';
import type { AppleChurchResult } from '@/lib/churchSearchNative';

export type ChurchSearchResult =
  | {
      kind: 'solapath';
      source?: string;
      isMine?: boolean;
      key: string;
      churchId: string;
      name: string;
      city: string | null;
      website: string | null;
    }
  | {
      kind: 'apple';
      key: string;
      apple: AppleChurchResult;
    };

function normalizeText(value: string | null): string {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function dedupeKey(name: string, city: string | null): string {
  return `${normalizeText(name)}|${normalizeText(city)}`;
}

export function sameChurch(a: { name: string; city: string | null; website: string | null }, b: { name: string; city: string | null; website: string | null }): boolean {
  const city = normalizeText(a.city);
  if (!city || city !== normalizeText(b.city)) return false;
  if (normalizeText(a.name) === normalizeText(b.name)) return true;
  const site = (value: string | null) => (value || '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
  return !!site(a.website) && site(a.website) === site(b.website);
}

export function mergeChurchSearchResults(
  solapathChurches: Omit<ChurchProfile, 'created_at'>[],
  appleChurches: AppleChurchResult[],
): ChurchSearchResult[] {
  const seen = new Set<string>();
  const merged: ChurchSearchResult[] = [];

  for (const church of solapathChurches) {
    const key = dedupeKey(church.name, church.city);
    if (church.source !== 'apple_maps' && appleChurches.some(apple => sameChurch(church, apple))) continue;
    if (church.source === 'apple_maps') seen.add(key);
    merged.push({
      kind: 'solapath',
      key: church.id,
      source: church.source,
      isMine: church.is_mine,
      churchId: church.id,
      name: church.name,
      city: church.city,
      website: church.website,
    });
  }

  for (const apple of appleChurches) {
    if (solapathChurches.some(c => c.source === 'apple_maps' && sameChurch(c, apple))) continue;
    const key = dedupeKey(apple.name, apple.city);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({ kind: 'apple', key, apple });
  }

  return merged;
}
