/*
 * SOLAPATH Cross-Reference Engine
 *
 * Cross-reference relationship data derived from OpenBible.info,
 * licensed under Creative Commons Attribution. The dataset
 * derives primarily from public-domain Treasury of Scripture Knowledge.
 *
 * Attribution: Cross-reference data derived from OpenBible.info,
 * licensed under Creative Commons Attribution.
 *
 * Only the reference relationship data is used here. All Scripture
 * text displayed in SOLAPATH comes from the locally bundled Bible
 * translations (WEB, RV1909).
 */

export interface CrossReference {
  target: string;
  rank: number;
}

const crossRefModules = import.meta.glob('../data/crossrefs/*.json');
const crossRefCache = new Map<string, CrossReference[]>();
const bookChunkCache = new Map<string, Record<string, CrossReference[]>>();

// SOLAPATH book name -> canonical ID (for file lookup)
const BOOK_NAME_TO_FILE: Record<string, string> = {
  'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM',
  'Deuteronomy': 'DEU', 'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT',
  '1 Samuel': '1SA', '2 Samuel': '2SA', '1 Kings': '1KI', '2 Kings': '2KI',
  '1 Chronicles': '1CH', '2 Chronicles': '2CH', 'Ezra': 'EZR',
  'Nehemiah': 'NEH', 'Esther': 'EST', 'Job': 'JOB', 'Psalm': 'PSA',
  'Psalms': 'PSA', 'Proverbs': 'PRO', 'Ecclesiastes': 'ECC',
  'Song of Solomon': 'SNG', 'Isaiah': 'ISA', 'Jeremiah': 'JER',
  'Lamentations': 'LAM', 'Ezekiel': 'EZK', 'Daniel': 'DAN', 'Hosea': 'HOS',
  'Joel': 'JOL', 'Amos': 'AMO', 'Obadiah': 'OBA', 'Jonah': 'JON',
  'Micah': 'MIC', 'Nahum': 'NAM', 'Habakkuk': 'HAB', 'Zephaniah': 'ZEP',
  'Haggai': 'HAG', 'Zechariah': 'ZEC', 'Malachi': 'MAL',
  'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN',
  'Acts': 'ACT', 'Romans': 'ROM', '1 Corinthians': '1CO',
  '2 Corinthians': '2CO', 'Galatians': 'GAL', 'Ephesians': 'EPH',
  'Philippians': 'PHP', 'Colossians': 'COL', '1 Thessalonians': '1TH',
  '2 Thessalonians': '2TH', '1 Timothy': '1TI', '2 Timothy': '2TI',
  'Titus': 'TIT', 'Philemon': 'PHM', 'Hebrews': 'HEB', 'James': 'JAS',
  '1 Peter': '1PE', '2 Peter': '2PE', '1 John': '1JN', '2 John': '2JN',
  '3 John': '3JN', 'Jude': 'JUD', 'Revelation': 'REV',
};

function refKey(book: string, chapter: number, verse: number): string {
  return `${book}|${chapter}|${verse}`;
}

async function loadBookChunk(book: string): Promise<Record<string, CrossReference[]>> {
  const fileId = BOOK_NAME_TO_FILE[book];
  if (!fileId) return {};

  const cached = bookChunkCache.get(fileId);
  if (cached) return cached;

  const globKey = `../data/crossrefs/${fileId}.json`;
  const loader = crossRefModules[globKey];
  if (!loader) {
    bookChunkCache.set(fileId, {});
    return {};
  }

  const mod = await loader() as Record<string, unknown>;
  const data = (mod.default ?? mod) as unknown as Record<string, CrossReference[]>;
  bookChunkCache.set(fileId, data);
  return data;
}

export async function getCrossReferences(book: string, chapter: number, verse: number): Promise<CrossReference[]> {
  const key = refKey(book, chapter, verse);
  if (crossRefCache.has(key)) return crossRefCache.get(key)!;

  const chunk = await loadBookChunk(book);
  const verseKey = `${chapter}.${verse}`;
  const refs = chunk[verseKey];
  if (Array.isArray(refs)) {
    crossRefCache.set(key, refs);
    return refs;
  }
  crossRefCache.set(key, []);
  return [];
}

export function parseReference(ref: string): { book: string; chapter: number; verse: number } | null {
  const match = ref.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) return null;
  return { book: match[1], chapter: parseInt(match[2], 10), verse: parseInt(match[3], 10) };
}

export const CROSS_REF_ATTRIBUTION =
  'Cross-reference data derived from OpenBible.info, licensed under Creative Commons Attribution.';
