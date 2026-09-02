import type { BibleProvider } from './bibleProvider';
import type { BibleChapter, BibleTranslation, BibleVerse } from './bibleTypes';

const webBibleModules = import.meta.glob('../data/bible/web/*.json');

const FILE_MAP: Record<string, string> = {
  'Genesis': 'genesis', 'Exodus': 'exodus', 'Leviticus': 'leviticus',
  'Numbers': 'numbers', 'Deuteronomy': 'deuteronomy', 'Joshua': 'joshua',
  'Judges': 'judges', 'Ruth': 'ruth', '1 Samuel': '1samuel',
  '2 Samuel': '2samuel', '1 Kings': '1kings', '2 Kings': '2kings',
  '1 Chronicles': '1chronicles', '2 Chronicles': '2chronicles',
  'Ezra': 'ezra', 'Nehemiah': 'nehemiah', 'Esther': 'esther',
  'Job': 'job', 'Psalm': 'psalms', 'Proverbs': 'proverbs',
  'Ecclesiastes': 'ecclesiastes', 'Song of Solomon': 'songofsolomon',
  'Isaiah': 'isaiah', 'Jeremiah': 'jeremiah', 'Lamentations': 'lamentations',
  'Ezekiel': 'ezekiel', 'Daniel': 'daniel', 'Hosea': 'hosea',
  'Joel': 'joel', 'Amos': 'amos', 'Obadiah': 'obadiah', 'Jonah': 'jonah',
  'Micah': 'micah', 'Nahum': 'nahum', 'Habakkuk': 'habakkuk',
  'Zephaniah': 'zephaniah', 'Haggai': 'haggai', 'Zechariah': 'zechariah',
  'Malachi': 'malachi', 'Matthew': 'matthew', 'Mark': 'mark',
  'Luke': 'luke', 'John': 'john', 'Acts': 'acts', 'Romans': 'romans',
  '1 Corinthians': '1corinthians', '2 Corinthians': '2corinthians',
  'Galatians': 'galatians', 'Ephesians': 'ephesians',
  'Philippians': 'philippians', 'Colossians': 'colossians',
  '1 Thessalonians': '1thessalonians', '2 Thessalonians': '2thessalonians',
  '1 Timothy': '1timothy', '2 Timothy': '2timothy', 'Titus': 'titus',
  'Philemon': 'philemon', 'Hebrews': 'hebrews', 'James': 'james',
  '1 Peter': '1peter', '2 Peter': '2peter', '1 John': '1john',
  '2 John': '2john', '3 John': '3john', 'Jude': 'jude',
  'Revelation': 'revelation',
};

interface WEBBookData {
  translation: string;
  book: string;
  chapters: { chapter: number; verses: BibleVerse[] }[];
}

const bookCache = new Map<string, WEBBookData>();

async function loadBook(book: string): Promise<WEBBookData> {
  const cached = bookCache.get(book);
  if (cached) return cached;

  const fileKey = FILE_MAP[book];
  if (!fileKey) throw new Error(`Unknown Bible book: ${book}`);

  const globKey = `../data/bible/web/${fileKey}.json`;
  const loader = webBibleModules[globKey];
  if (!loader) throw new Error(`Bible data not found for: ${book}`);

  const mod = await loader() as Record<string, unknown>;
  const data = (mod.default ?? mod) as unknown as WEBBookData;
  bookCache.set(book, data);
  return data;
}

export const localWEBProvider: BibleProvider = {
  async getChapter(translation: BibleTranslation, book: string, chapter: number): Promise<BibleChapter> {
    const data = await loadBook(book);
    const ch = data.chapters.find((c) => c.chapter === chapter);
    if (!ch) throw new Error(`Chapter ${chapter} not found in ${book}`);
    return { book, chapter, translation, verses: ch.verses };
  },

  async getVerses(translation: BibleTranslation, book: string, chapter: number, verseStart: number, verseEnd: number): Promise<BibleVerse[]> {
    const ch = await localWEBProvider.getChapter(translation, book, chapter);
    return ch.verses.filter((v) => v.verse >= verseStart && v.verse <= verseEnd);
  },
};
