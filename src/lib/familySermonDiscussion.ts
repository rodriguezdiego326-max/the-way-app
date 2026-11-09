import type { FamilySermonDiscussionDraft } from '@/lib/familySermonDiscussions';
import { DISCUSSION_BODY_MAX } from '@/lib/sermonDiscussion';

export const FAMILY_SCRIPTURE_MAX = 3;
export const FAMILY_TITLE_MAX = 120;
export const FAMILY_MAIN_POINT_MAX = 300;
export const FAMILY_QUESTION_MAX = 500;

export type FamilyQuestionMode = 'none' | 'existing' | 'custom';

export interface FamilySelection {
  includeTitle: boolean;
  mainPoint: string | null;
  scriptures: string[];
  questionMode: FamilyQuestionMode;
  existingQuestion: string | null;
  customQuestion: string;
}

export const EMPTY_FAMILY_SELECTION: FamilySelection = {
  includeTitle: false,
  mainPoint: null,
  scriptures: [],
  questionMode: 'none',
  existingQuestion: null,
  customQuestion: '',
};

export function resolveFamilyQuestion(selection: FamilySelection): string | null {
  if (selection.questionMode === 'existing') return selection.existingQuestion;
  if (selection.questionMode === 'custom') return selection.customQuestion.trim() || null;
  return null;
}

export function buildFamilyStarter(mainPoint: string | null, question: string | null): string {
  const parts: string[] = [];
  if (mainPoint) parts.push(`Main point: ${mainPoint}`);
  if (question) parts.push(`Question: ${question}`);
  return parts.join('\n\n');
}

export function validateFamilyQuestion(selection: FamilySelection): string | null {
  if (selection.questionMode !== 'custom') return null;
  const trimmed = selection.customQuestion.trim();
  if (trimmed.length === 0) return 'Write your question or choose another option.';
  if (trimmed.length > FAMILY_QUESTION_MAX) return `Keep your question to ${FAMILY_QUESTION_MAX} characters or fewer.`;
  return null;
}

export function validateFamilyBody(body: string): string | null {
  const trimmed = body.trim();
  if (trimmed.length === 0) return 'Write a short starter for your family before saving.';
  if (trimmed.length > DISCUSSION_BODY_MAX) return `Keep your starter to ${DISCUSSION_BODY_MAX} characters or fewer.`;
  return null;
}

export function buildFamilyDraft(
  selection: FamilySelection,
  sermonTitle: string | null,
  body: string,
): FamilySermonDiscussionDraft {
  const title = selection.includeTitle ? sermonTitle?.trim() || null : null;
  return {
    sermonTitle: title ? title.slice(0, FAMILY_TITLE_MAX) : null,
    mainPoint: selection.mainPoint ? selection.mainPoint.slice(0, FAMILY_MAIN_POINT_MAX) : null,
    scriptureReferences: selection.scriptures.slice(0, FAMILY_SCRIPTURE_MAX),
    discussionQuestion: resolveFamilyQuestion(selection),
    discussionBody: body.trim(),
  };
}
