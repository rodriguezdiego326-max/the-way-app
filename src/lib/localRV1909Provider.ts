import type { BibleProvider } from './bibleProvider';
import type { BibleChapter, BibleTranslation, BibleVerse } from './bibleTypes';

const rv1909Modules = import.meta.glob('../data/bible/rv1909/*.json');

const FILE_MAP: Record<string, string> = {
  'Genesis': 'gen', 'Exodus': 'exo', 'Leviticus': 'lev',
  'Numbers': 'num', 'Deuteronomy': 'deu', 'Joshua': 'jos',
  'Judges': 'jdg', 'Ruth': 'rut', '1 Samuel': '1sa', '2 Samuel': '2sa',
  '1 Kings': '1ki', '2 Kings': '2ki', '1 Chronicles': '1ch',
  '2 Chronicles': '2ch', 'Ezra': 'ezr', 'Nehemiah': 'neh', 'Esther': 'est',
  'Job': 'job', 'Psalm': 'psa', 'Psalms': 'psa', 'Proverbs': 'pro',
  'Ecclesiastes': 'ecc', 'Song of Solomon': 'sng', 'Isaiah': 'isa',
  'Jeremiah': 'jer', 'Lamentations': 'lam', 'Ezekiel': 'ezk',
  'Daniel': 'dan', 'Hosea': 'hos', 'Joel': 'jol', 'Amos': 'amo',
  'Obadiah': 'oba', 'Jonah': 'jon', 'Micah': 'mic', 'Nahum': 'nam',
  'Habakkuk': 'hab', 'Zephaniah': 'zep', 'Haggai': 'hag',
  'Zechariah': 'zec', 'Malachi': 'mal', 'Matthew': 'mat', 'Mark': 'mrk',
  'Luke': 'luk', 'John': 'jhn', 'Acts': 'act', 'Romans': 'rom',
  '1 Corinthians': '1co', '2 Corinthians': '2co', 'Galatians': 'gal',
  'Ephesians': 'eph', 'Philippians': 'php', 'Colossians': 'col',
  '1 Thessalonians': '1th', '2 Thessalonians': '2th',
  '1 Timothy': '1ti', '2 Timothy': '2ti', 'Titus': 'tit',
  'Philemon': 'phm', 'Hebrews': 'heb', 'James': 'jas',
  '1 Peter': '1pe', '2 Peter': '2pe', '1 John': '1jn',
  '2 John': '2jn', '3 John': '3jn', 'Jude': 'jud', 'Revelation': 'rev',
};

interface RV1909BookData {
  translation: string;
  book: string;
  book_id: string;
  chapters: { chapter: number; verses: BibleVerse[] }[];
}

const bookCache = new Map<string, RV1909BookData>();

async function loadBook(book: string): Promise<RV1909BookData> {
  const cached = bookCache.get(book);
  if (cached) return cached;

  const fileKey = FILE_MAP[book];
  if (!fileKey) throw new Error(`Unknown Bible book: ${book}`);

  const globKey = `../data/bible/rv1909/${fileKey}.json`;
  const loader = rv1909Modules[globKey];
  if (!loader) throw new Error(`RV1909 data not found for: ${book}`);

  const mod = await loader() as Record<string, unknown>;
  const data = (mod.default ?? mod) as unknown as RV1909BookData;
  bookCache.set(book, data);
  return data;
}

export const localRV1909Provider: BibleProvider = {
  async getChapter(_translation: BibleTranslation, book: string, chapter: number): Promise<BibleChapter> {
    const data = await loadBook(book);
    const ch = data.chapters.find((c) => c.chapter === chapter);
    if (!ch) throw new Error(`Chapter ${chapter} not found in ${book} (RV1909)`);
    return { book, chapter, translation: 'RV1909' as BibleTranslation, verses: ch.verses };
  },

  async getVerses(translation: BibleTranslation, book: string, chapter: number, verseStart: number, verseEnd: number): Promise<BibleVerse[]> {
    const ch = await localRV1909Provider.getChapter(translation, book, chapter);
    return ch.verses.filter((v) => v.verse >= verseStart && v.verse <= verseEnd);
  },
};
