import { BIBLE_BOOKS } from './bibleTypes';

export interface ParsedReference {
  book: string;
  chapter: number;
  verseStart: number | null;
  verseEnd: number | null;
}

export function parsePassageReference(ref: string): ParsedReference | null {
  if (!ref || typeof ref !== 'string') return null;

  const normalized = ref.trim().replace(/\s+/g, ' ');

  const match = normalized.match(
    /^(.+?)\s+(\d+)(?::(\d+)(?:[\u2013\u2014-](\d+))?)?$/,
  );

  if (!match) return null;

  const [, rawBook, chStr, vsStr, veStr] = match;
  const book = rawBook.trim();
  const chapter = parseInt(chStr, 10);

  const bookInfo = BIBLE_BOOKS.find(
    (b) => b.name.toLowerCase() === book.toLowerCase(),
  );
  if (!bookInfo) return null;
  if (chapter < 1 || chapter > bookInfo.chapters) return null;

  const verseStart = vsStr ? parseInt(vsStr, 10) : null;
  const verseEnd = veStr ? parseInt(veStr, 10) : (verseStart ?? null);

  return { book: bookInfo.name, chapter, verseStart, verseEnd };
}
