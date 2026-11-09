import { retrieveSources } from '@/lib/libraryEngine';
import type { Citation } from '@/lib/libraryTypes';
import type { SermonInsights } from '@/lib/sermonRecordingStore';

const MAX_THEMES = 5;
const MAX_THEME_QUERY_CHARS = 120;
const MAX_STUDY_QUESTIONS = 6;
const MAX_PASTOR_QUESTIONS = 3;

export const STUDY_FAILURE_MESSAGE = "We couldn't complete this sermon study. Your recording, transcript, and insights are safe.";
export const STUDY_UNCLEAR_MESSAGE = 'The transcript is not clear enough to compare this point confidently.';
export const STUDY_NO_SOURCE_MESSAGE = 'No verified source was found for this point.';

export type OpenBibleHandler = (book: string, chapter: number, verseStart: number | null, verseEnd: number | null) => void;

export type StudySourceCategory =
  | 'Scripture'
  | 'Confessional Catechism'
  | 'Historic Christian Teaching'
  | 'Approved Christian Teacher';

export const STUDY_CATEGORY_ORDER: StudySourceCategory[] = [
  'Scripture',
  'Confessional Catechism',
  'Historic Christian Teaching',
  'Approved Christian Teacher',
];

export interface StudySource {
  id: string;
  title: string;
  author: string;
  section: string | null;
  category: StudySourceCategory;
}

export interface StudyTheme {
  title: string;
  sources: StudySource[];
}

export interface SermonStudy {
  themes: StudyTheme[];
  studyQuestions: string[];
  pastorQuestions: string[];
  generatedAt: string;
}

function categorize(citation: Citation): StudySourceCategory | null {
  if (!citation.verified) return null;
  if (citation.authority_level === 1) return 'Scripture';
  if (citation.authority_level > 5) return null;
  if (citation.source_type === 'catechism' || citation.source_type === 'confession') return 'Confessional Catechism';
  if (citation.authority_level === 5) return 'Approved Christian Teacher';
  return 'Historic Christian Teaching';
}

export function themeSearchQuery(title: string): string {
  return title.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_THEME_QUERY_CHARS);
}

async function retrieveThemeSources(title: string): Promise<StudySource[]> {
  const query = themeSearchQuery(title);
  if (query.length < 4) return [];
  const result = await retrieveSources(query, { logRetrieval: false, throwOnError: true });
  const sources: StudySource[] = [];
  for (const citation of result.citations) {
    const category = categorize(citation);
    if (!category) continue;
    sources.push({
      id: citation.source_id,
      title: citation.display_title,
      author: citation.display_author,
      section: citation.chapter_section,
      category,
    });
  }
  return sources.sort((a, b) => STUDY_CATEGORY_ORDER.indexOf(a.category) - STUDY_CATEGORY_ORDER.indexOf(b.category));
}

function buildStudyQuestions(insights: SermonInsights, themes: StudyTheme[]): string[] {
  const questions: string[] = [];
  for (const ref of insights.scriptureReferences.slice(0, 3)) {
    questions.push(`What does ${ref.reference} say in its own context?`);
  }
  const firstTheme = themes[0]?.title;
  if (firstTheme) {
    questions.push('Was this point stated explicitly in the sermon, or inferred from it?');
    questions.push(`Is there another passage that helps clarify "${firstTheme}"?`);
  }
  questions.push('What part of this should you study again this week?');
  return questions.slice(0, MAX_STUDY_QUESTIONS);
}

function buildPastorQuestions(insights: SermonInsights, themes: StudyTheme[]): string[] {
  const passages = insights.scriptureReferences.map((ref) => ref.reference);
  return themes.slice(0, MAX_PASTOR_QUESTIONS).map((theme) => {
    const passageText = passages[0] ? ` in relation to ${passages[0]}` : '';
    return `How do you understand "${theme.title}"${passageText}?`;
  });
}

export async function buildSermonStudy(insights: SermonInsights): Promise<SermonStudy> {
  const themeTitles = insights.mainPoints
    .map((point) => point.title.trim())
    .filter((title) => title.length > 0)
    .slice(0, MAX_THEMES);

  const themes: StudyTheme[] = await Promise.all(
    themeTitles.map(async (title) => ({ title, sources: await retrieveThemeSources(title) })),
  );

  return {
    themes,
    studyQuestions: buildStudyQuestions(insights, themes),
    pastorQuestions: buildPastorQuestions(insights, themes),
    generatedAt: new Date().toISOString(),
  };
}
