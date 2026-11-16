import type { SermonInsights } from '@/lib/sermonRecordingStore';
import { getStoredAppLanguage } from '@/lib/i18n';

const MAX_THEMES = 5;
const MAX_STUDY_QUESTIONS = 6;
const MAX_PASTOR_QUESTIONS = 3;

export const STUDY_UNCLEAR_MESSAGE = getStoredAppLanguage() === 'es'
  ? 'La transcripción no es lo suficientemente clara para identificar sus puntos principales.'
  : 'The transcript is not clear enough to identify its main points.';

export type OpenBibleHandler = (book: string, chapter: number, verseStart: number | null, verseEnd: number | null) => void;

export interface SermonStudy {
  themes: string[];
  studyQuestions: string[];
  pastorQuestions: string[];
}

function buildStudyQuestions(insights: SermonInsights, themes: string[]): string[] {
  const es = getStoredAppLanguage() === 'es';
  const questions: string[] = [];
  for (const ref of insights.scriptureReferences.slice(0, 3)) {
    questions.push(es
      ? `¿Qué dice ${ref.reference} en su propio contexto?`
      : `What does ${ref.reference} say in its own context?`);
  }
  const firstTheme = themes[0];
  if (firstTheme) {
    questions.push(es
      ? '¿Este punto se afirmó explícitamente en el sermón o se dedujo de él?'
      : 'Was this point stated explicitly in the sermon, or inferred from it?');
    questions.push(es
      ? `¿Hay otro pasaje que ayude a aclarar “${firstTheme}”?`
      : `Is there another passage that helps clarify "${firstTheme}"?`);
  }
  questions.push(es
    ? '¿Qué parte de esto deberías estudiar de nuevo esta semana?'
    : 'What part of this should you study again this week?');
  return questions.slice(0, MAX_STUDY_QUESTIONS);
}

function buildPastorQuestions(insights: SermonInsights, themes: string[]): string[] {
  const es = getStoredAppLanguage() === 'es';
  const passage = insights.scriptureReferences[0]?.reference;
  const passageText = passage
    ? (es ? ` en relación con ${passage}` : ` in relation to ${passage}`)
    : '';
  return themes.slice(0, MAX_PASTOR_QUESTIONS).map((theme) =>
    es
      ? `¿Cómo entiende “${theme}”${passageText}?`
      : `How do you understand "${theme}"${passageText}?`);
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
