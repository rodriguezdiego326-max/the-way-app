import type { CircleSermonDiscussionDraft } from '@/lib/togetherEngine';

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
  const parts: string[] = [];
  if (selection.mainPoint) parts.push(`Main point: ${selection.mainPoint}`);
  if (selection.question) parts.push(`Question: ${selection.question}`);
  return parts.join('\n\n');
}

export function validateDiscussionBody(body: string): string | null {
  const trimmed = body.trim();
  if (trimmed.length === 0) return 'Write a short starter for your Circle before sharing.';
  if (trimmed.length > DISCUSSION_BODY_MAX) return `Keep your starter to ${DISCUSSION_BODY_MAX} characters or fewer.`;
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
