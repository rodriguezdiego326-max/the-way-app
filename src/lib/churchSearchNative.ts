import { Capacitor, registerPlugin } from '@capacitor/core';

export interface AppleChurchResult {
  name: string;
  city: string | null;
  state: string | null;
  address: string | null;
  website: string | null;
  latitude: number;
  longitude: number;
}

interface ChurchSearchPlugin {
  searchChurches(options: { query: string }): Promise<{ results: unknown[] }>;
}

const ChurchSearch = registerPlugin<ChurchSearchPlugin>('ChurchSearch');

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function toChurchResult(raw: unknown): AppleChurchResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const name = optionalText(item.name);
  const latitude = typeof item.latitude === 'number' ? item.latitude : NaN;
  const longitude = typeof item.longitude === 'number' ? item.longitude : NaN;
  if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    name,
    city: optionalText(item.city),
    state: optionalText(item.state),
    address: optionalText(item.address),
    website: optionalText(item.website),
    latitude,
    longitude,
  };
}

export function isAppleChurchSearchAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

export async function searchChurches({ query }: { query: string }): Promise<AppleChurchResult[]> {
  if (!isAppleChurchSearchAvailable()) return [];
  const response = await ChurchSearch.searchChurches({ query });
  if (!response || !Array.isArray(response.results)) {
    throw new Error('Unexpected church search response');
  }
  return response.results
    .map(toChurchResult)
    .filter((church): church is AppleChurchResult => church !== null);
}
