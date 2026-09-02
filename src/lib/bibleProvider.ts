import type { BibleChapter, BibleTranslation, BibleVerse } from './bibleTypes';

export interface BibleProvider {
  getChapter(translation: BibleTranslation, book: string, chapter: number): Promise<BibleChapter>;
  getVerses(
    translation: BibleTranslation,
    book: string,
    chapter: number,
    verseStart: number,
    verseEnd: number,
  ): Promise<BibleVerse[]>;
}
