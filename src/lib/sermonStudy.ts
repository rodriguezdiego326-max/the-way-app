import type { SermonInsights } from '@/lib/sermonRecordingStore';

const MAX_THEMES = 5;
const MAX_STUDY_QUESTIONS = 6;
const MAX_PASTOR_QUESTIONS = 3;

export const STUDY_UNCLEAR_MESSAGE = 'The transcript is not clear enough to identify its main points.';

export type OpenBibleHandler = (book: string, chapter: number, verseStart: number | null, verseEnd: number | null) => void;

export interface SermonStudy {
  themes: string[];
  studyQuestions: string[];
  pastorQuestions: string[];
}

function buildStudyQuestions(insights: SermonInsights, themes: string[]): string[] {
  const questions: string[] = [];
  for (const ref of insights.scriptureReferences.slice(0, 3)) {
    questions.push(`What does ${ref.reference} say in its own context?`);
  }
  const firstTheme = themes[0];
  if (firstTheme) {
    questions.push('Was this point stated explicitly in the sermon, or inferred from it?');
    questions.push(`Is there another passage that helps clarify "${firstTheme}"?`);
  }
  questions.push('What part of this should you study again this week?');
  return questions.slice(0, MAX_STUDY_QUESTIONS);
}

function buildPastorQuestions(insights: SermonInsights, themes: string[]): string[] {
  const passage = insights.scriptureReferences[0]?.reference;
  const passageText = passage ? ` in relation to ${passage}` : '';
  return themes.slice(0, MAX_PASTOR_QUESTIONS).map((theme) => `How do you understand "${theme}"${passageText}?`);
}

export function buildSermonStudy(insights: SermonInsights): SermonStudy {
  const themes = insights.mainPoints
    .map((point) => point.title.trim())
    .filter((title) => title.length > 0)
    .slice(0, MAX_THEMES);

  return {
    themes,
    studyQuestions: buildStudyQuestions(insights, themes),
    pastorQuestions: buildPastorQuestions(insights, themes),
  };
}
