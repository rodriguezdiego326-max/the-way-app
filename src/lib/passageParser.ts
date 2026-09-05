import { BIBLE_BOOKS } from './bibleTypes';

export interface ParsedReference {
  book: string;
  chapter: number;
  verseStart: number | null;
  verseEnd: number | null;
}

const SPANISH_TO_ENGLISH: Record<string, string> = {
  'génesis': 'Genesis', 'exodo': 'Exodus', 'éxodo': 'Exodus',
  'levitico': 'Leviticus', 'levítico': 'Leviticus',
  'numeros': 'Numbers', 'números': 'Numbers',
  'deuteronomio': 'Deuteronomy',
  'josue': 'Joshua', 'josué': 'Joshua',
  'jueces': 'Judges', 'rut': 'Ruth',
  '1 samuel': '1 Samuel', '2 samuel': '2 Samuel',
  '1 reyes': '1 Kings', '2 reyes': '2 Kings',
  '1 cronicas': '1 Chronicles', '1 crónicas': '1 Chronicles',
  '2 cronicas': '2 Chronicles', '2 crónicas': '2 Chronicles',
  'esdras': 'Ezra', 'nehemias': 'Nehemiah', 'nehemías': 'Nehemiah',
  'ester': 'Esther',
  'salmos': 'Psalm', 'proverbios': 'Proverbs',
  'eclesiastes': 'Ecclesiastes', 'eclesiastés': 'Ecclesiastes',
  'cantares': 'Song of Solomon', 'cantar': 'Song of Solomon',
  'isaias': 'Isaiah', 'isaías': 'Isaiah',
  'jeremias': 'Jeremiah', 'jeremías': 'Jeremiah',
  'lamentaciones': 'Lamentations',
  'ezequiel': 'Ezekiel', 'daniel': 'Daniel',
  'oseas': 'Hosea', 'joel': 'Joel', 'amos': 'Amos', 'amós': 'Amos',
  'abdias': 'Obadiah', 'abdías': 'Obadiah',
  'jonas': 'Jonah', 'jonás': 'Jonah',
  'miqueas': 'Micah', 'nahum': 'Nahum',
  'habacuc': 'Habakkuk',
  'sofonias': 'Zephaniah', 'sofonías': 'Zephaniah',
  'hageo': 'Haggai', 'zacarias': 'Zechariah', 'zacarías': 'Zechariah',
  'malaquias': 'Malachi', 'malaquías': 'Malachi',
  'mateo': 'Matthew', 'marcos': 'Mark', 'lucas': 'Luke', 'juan': 'John',
  'hechos': 'Acts', 'romanos': 'Romans',
  '1 corintios': '1 Corinthians', '2 corintios': '2 Corinthians',
  'galatas': 'Galatians', 'gálatas': 'Galatians',
  'efesios': 'Ephesians', 'filipenses': 'Philippians',
  'colosenses': 'Colossians',
  '1 tesalonicenses': '1 Thessalonians', '2 tesalonicenses': '2 Thessalonians',
  '1 timoteo': '1 Timothy', '2 timoteo': '2 Timothy',
  'tito': 'Titus', 'filemon': 'Philemon', 'filemón': 'Philemon',
  'hebreos': 'Hebrews', 'santiago': 'James',
  '1 pedro': '1 Peter', '2 pedro': '2 Peter',
  '1 juan': '1 John', '2 juan': '2 John', '3 juan': '3 John',
  'judas': 'Jude', 'apocalipsis': 'Revelation',
};

function resolveBookName(raw: string): string | null {
  const lower = raw.toLowerCase().trim();
  const direct = BIBLE_BOOKS.find((b) => b.name.toLowerCase() === lower);
  if (direct) return direct.name;
  const mapped = SPANISH_TO_ENGLISH[lower];
  if (mapped) return mapped;
  return null;
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

  const canonicalName = resolveBookName(book);
  if (!canonicalName) return null;
  const bookInfo = BIBLE_BOOKS.find((b) => b.name === canonicalName);
  if (!bookInfo) return null;
  if (chapter < 1 || chapter > bookInfo.chapters) return null;

  const verseStart = vsStr ? parseInt(vsStr, 10) : null;
  const verseEnd = veStr ? parseInt(veStr, 10) : (verseStart ?? null);

  return { book: bookInfo.name, chapter, verseStart, verseEnd };
}
