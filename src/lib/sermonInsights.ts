import { supabase } from '@/lib/supabase';
import type { SermonInsights } from '@/lib/sermonRecordingStore';

const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY;
const REQUEST_TIMEOUT_MS = 100_000;
const CONSENT_VERSION = '1';

export const SERMON_INSIGHTS_FAILURE_MESSAGE = "We couldn't create sermon insights. Your transcript and recording are safe on this device.";
const SIGN_IN_MESSAGE = 'Please sign in again to create sermon insights.';

export class SermonInsightsError extends Error {}

function consentKey(profileId: string): string {
  return `solapath.sermonInsightsConsent.v${CONSENT_VERSION}.${profileId}`;
}

export function hasSermonInsightsConsent(profileId: string): boolean {
  try {
    return window.localStorage.getItem(consentKey(profileId)) === 'granted';
  } catch {
    return false;
  }
}

export function grantSermonInsightsConsent(profileId: string): void {
  window.localStorage.setItem(consentKey(profileId), 'granted');
}

export async function transcriptFingerprint(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export interface SermonInsightsInput {
  transcript: string;
  title: string | null;
  preacher: string | null;
  serviceName: string | null;
}

function isInsightsShape(value: unknown): value is SermonInsights {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return typeof data.summary === 'string'
    && Array.isArray(data.mainPoints)
    && Array.isArray(data.scriptureReferences)
    && Array.isArray(data.applicationTakeaways)
    && Array.isArray(data.reflectionQuestions)
    && Array.isArray(data.limitations)
    && typeof data.generatedAt === 'string'
    && typeof data.modelVersion === 'string';
}

export async function requestSermonInsights(input: SermonInsightsInput): Promise<SermonInsights> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new SermonInsightsError(SIGN_IN_MESSAGE);

  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}/functions/v1/generate-sermon-insights`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new SermonInsightsError(SERMON_INSIGHTS_FAILURE_MESSAGE);
  }

  if (response.status === 401) throw new SermonInsightsError(SIGN_IN_MESSAGE);
  if (!response.ok) throw new SermonInsightsError(SERMON_INSIGHTS_FAILURE_MESSAGE);

  const payload = await response.json().catch(() => null) as { insights?: unknown } | null;
  if (!isInsightsShape(payload?.insights)) throw new SermonInsightsError(SERMON_INSIGHTS_FAILURE_MESSAGE);
  return payload.insights;
}

export function formatSermonInsightsText(insights: SermonInsights, title: string): string {
  const lines: string[] = [title, '', 'Summary', insights.summary, ''];
  if (insights.mainPoints.length) {
    lines.push('Main Points');
    insights.mainPoints.forEach((point, index) => lines.push(`${index + 1}. ${point.title}: ${point.summary}`));
    lines.push('');
  }
  if (insights.scriptureReferences.length) {
    lines.push('Scriptures Mentioned');
    insights.scriptureReferences.forEach((ref) => {
      const label = ref.confidence === 'explicit' ? 'Mentioned in sermon' : 'Likely reference';
      lines.push(`- ${ref.reference} (${label}): ${ref.context}`);
    });
    lines.push('');
  }
  if (insights.applicationTakeaways.length) {
    lines.push('Application');
    insights.applicationTakeaways.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  }
  if (insights.reflectionQuestions.length) {
    lines.push('Reflect');
    insights.reflectionQuestions.forEach((question) => lines.push(`- ${question}`));
    lines.push('');
  }
  if (insights.limitations.length) {
    lines.push('Limitations');
    insights.limitations.forEach((item) => lines.push(`- ${item}`));
  }
  return lines.join('\n').trim();
}
