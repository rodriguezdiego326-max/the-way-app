import type { CircleSermonDiscussionDraft } from '@/lib/togetherEngine';
import { getStoredAppLanguage } from '@/lib/i18n';

export const DISCUSSION_BODY_MAX = 2000;
export const DISCUSSION_TITLE_MAX = 120;
export const DISCUSSION_SCRIPTURE_MAX = 5;
export const DISCUSSION_REFERENCE_MAX = 120;

export interface DiscussionSelection {
  includeTitle: boolean;
  mainPoint: string | null;
  scriptures: string[];
  question: string | null;
}

export function buildDiscussionStarter(selection: Pick<DiscussionSelection, 'mainPoint' | 'question'>): string {
  const es = getStoredAppLanguage() === 'es';
  const parts: string[] = [];
  if (selection.mainPoint) parts.push(`${es ? 'Punto principal' : 'Main point'}: ${selection.mainPoint}`);
  if (selection.question) parts.push(`${es ? 'Pregunta' : 'Question'}: ${selection.question}`);
  return parts.join('\n\n');
}

export function validateDiscussionBody(body: string): string | null {
  const trimmed = body.trim();
  if (trimmed.length === 0) return getStoredAppLanguage() === 'es'
    ? 'Escribe un inicio breve para tu Círculo antes de compartir.'
    : 'Write a short starter for your Circle before sharing.';
  if (trimmed.length > DISCUSSION_BODY_MAX) return getStoredAppLanguage() === 'es'
    ? `Mantén tu inicio en ${DISCUSSION_BODY_MAX} caracteres o menos.`
    : `Keep your starter to ${DISCUSSION_BODY_MAX} characters or fewer.`;
  return null;
}

export function buildDiscussionDraft(
  selection: DiscussionSelection,
  sermonTitle: string | null,
  body: string,
): CircleSermonDiscussionDraft {
  const title = selection.includeTitle ? sermonTitle?.trim() || null : null;
  return {
    sermonTitle: title ? title.slice(0, DISCUSSION_TITLE_MAX) : null,
    discussionBody: body.trim(),
    scriptureReferences: selection.scriptures.slice(0, DISCUSSION_SCRIPTURE_MAX),
  };
}
