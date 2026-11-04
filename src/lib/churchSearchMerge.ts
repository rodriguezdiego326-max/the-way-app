import type { ChurchProfile } from '@/lib/togetherTypes';
import type { AppleChurchResult } from '@/lib/churchSearchNative';

export type ChurchSearchResult =
  | {
      kind: 'solapath';
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

export function mergeChurchSearchResults(
  solapathChurches: Omit<ChurchProfile, 'created_at'>[],
  appleChurches: AppleChurchResult[],
): ChurchSearchResult[] {
  const seen = new Set<string>();
  const merged: ChurchSearchResult[] = [];

  for (const church of solapathChurches) {
    const key = dedupeKey(church.name, church.city);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      kind: 'solapath',
      key,
      churchId: church.id,
      name: church.name,
      city: church.city,
      website: church.website,
    });
  }

  for (const apple of appleChurches) {
    const key = dedupeKey(apple.name, apple.city);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({ kind: 'apple', key, apple });
  }

  return merged;
}
