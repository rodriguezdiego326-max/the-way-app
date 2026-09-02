export type BibleTranslation = 'WEB' | 'RV1909';

export interface BibleTranslationInfo {
  id: BibleTranslation;
  shortName: string;
  fullName: string;
  language: string;
  providerType: 'local' | 'api' | 'licensed-local' | 'unavailable';
  offline: boolean;
  installed: boolean;
  selectable: boolean;
  rightsStatus: string;
  copyrightNotice: string;
}

export const BIBLE_TRANSLATIONS: BibleTranslationInfo[] = [
  {
    id: 'WEB',
    shortName: 'WEB',
    fullName: 'World English Bible',
    language: 'English',
    providerType: 'local',
    offline: true,
    installed: true,
    selectable: true,
    rightsStatus: 'Public Domain',
    copyrightNotice: 'World English Bible — public domain modern English translation.',
  },
  {
    id: 'RV1909',
    shortName: 'RV1909',
    fullName: 'Reina-Valera 1909',
    language: 'Español',
    providerType: 'local',
    offline: true,
    installed: true,
    selectable: true,
    rightsStatus: 'Public Domain (eBible.org)',
    copyrightNotice: 'Reina-Valera 1909 — public domain per eBible.org.',
  },
  {
    id: 'KJV' as BibleTranslation,
    shortName: 'KJV',
    fullName: 'King James Version',
    language: 'English',
    providerType: 'unavailable',
    offline: false,
    installed: false,
    selectable: false,
    rightsStatus: 'Territory review required',
    copyrightNotice: 'KJV is public domain outside the UK but Crown/letters-patent rights apply in the UK.',
  },
  {
    id: 'ESV' as BibleTranslation,
    shortName: 'ESV',
    fullName: 'English Standard Version',
    language: 'English',
    providerType: 'unavailable',
    offline: false,
    installed: false,
    selectable: false,
    rightsStatus: 'License required',
    copyrightNotice: 'ESV requires Crossway permission.',
  },
  {
    id: 'NKJV' as BibleTranslation,
    shortName: 'NKJV',
    fullName: 'New King James Version',
    language: 'English',
    providerType: 'unavailable',
    offline: false,
    installed: false,
    selectable: false,
    rightsStatus: 'License required',
    copyrightNotice: 'NKJV requires publisher permission.',
  },
  {
    id: 'RVR60' as BibleTranslation,
    shortName: 'RVR60',
    fullName: 'Reina-Valera 1960',
    language: 'Español',
    providerType: 'unavailable',
    offline: false,
    installed: false,
    selectable: false,
    rightsStatus: 'License required',
    copyrightNotice: 'RVR60 is copyrighted/rights-managed.',
  },
];

export type NoteType =
  | 'observation'
  | 'interpretation'
  | 'application'
  | 'prayer'
  | 'question'
  | 'word_study'
  | 'cross_reference'
  | 'sermon'
  | 'general';

export type HighlightColor =
  | 'gold' | 'amber' | 'orange' | 'coral'
  | 'red' | 'rose' | 'violet' | 'purple'
  | 'indigo' | 'blue' | 'teal' | 'green' | 'sage';

export type MarkStyle =
  | 'highlight'
  | 'underline'
  | 'double_underline'
  | 'box'
  | 'oval'
  | 'angled_box'
  | 'slash'
  | 'circle'
  | 'symbol'
  | 'symbol_underline'
  | 'symbol_highlight';

export const SYMBOL_LIBRARY: string[] = [
  '✦', '◆', '◇', '●', '○', '■', '□', '▲', '△',
  '+', '×', '!', '?', '→', '↔', '⌂', '∞', '★',
];

export interface SymbolOption {
  id: string;
  label: string;
  char?: string;
  icon?: string;
}

export const SYMBOL_OPTIONS: SymbolOption[] = [
  { id: '✦', label: 'Radiance', char: '✦' },
  { id: '★', label: 'Star', char: '★' },
  { id: '◆', label: 'Diamond', char: '◆' },
  { id: '◇', label: 'Diamond Outline', char: '◇' },
  { id: '●', label: 'Circle', char: '●' },
  { id: '○', label: 'Circle Outline', char: '○' },
  { id: '■', label: 'Square', char: '■' },
  { id: '□', label: 'Square Outline', char: '□' },
  { id: '▲', label: 'Triangle', char: '▲' },
  { id: '△', label: 'Triangle Outline', char: '△' },
  { id: '+', label: 'Cross', char: '+' },
  { id: '×', label: 'Cross Mark', char: '×' },
  { id: '!', label: 'Exclamation', char: '!' },
  { id: '?', label: 'Question', char: '?' },
  { id: '→', label: 'Arrow', char: '→' },
  { id: '↔', label: 'Double Arrow', char: '↔' },
  { id: '⌂', label: 'Home', char: '⌂' },
  { id: '∞', label: 'Infinity', char: '∞' },
  { id: 'icon:clock', label: 'Clock', icon: 'clock' },
  { id: 'icon:map-pin', label: 'Map Pin', icon: 'map-pin' },
  { id: 'icon:flame', label: 'Flame', icon: 'flame' },
  { id: 'icon:crown', label: 'Crown', icon: 'crown' },
  { id: 'icon:heart', label: 'Heart', icon: 'heart' },
  { id: 'icon:eye', label: 'Eye', icon: 'eye' },
  { id: 'icon:book-open', label: 'Book', icon: 'book-open' },
];

export function getSymbolDisplay(sym: string | null): { char?: string; icon?: string } | null {
  if (!sym) return null;
  const opt = SYMBOL_OPTIONS.find((s) => s.id === sym);
  if (opt) return { char: opt.char, icon: opt.icon };
  if (sym.startsWith('icon:')) return { icon: sym.slice(5) };
  return { char: sym };
}

export function isIconSymbol(sym: string | null): boolean {
  if (!sym) return false;
  return sym.startsWith('icon:');
}

// (BibleTranslationInfo and BIBLE_TRANSLATIONS defined above with expanded fields)

export interface BibleVerse {
  verse: number;
  text: string;
}

export interface BibleChapter {
  book: string;
  chapter: number;
  translation: BibleTranslation;
  verses: BibleVerse[];
}

export interface BibleNote {
  id: string;
  translation: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
  note_type: NoteType;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface BibleHighlight {
  id: string;
  translation: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
  color_key: HighlightColor;
  selected_text: string | null;
  token_start: number | null;
  token_end: number | null;
  start_offset: number | null;
  end_offset: number | null;
  created_at: string;
}

export interface BibleKeyword {
  id: string;
  name: string;
  color_key: HighlightColor;
  mark_style: MarkStyle;
  symbol: string | null;
  description: string | null;
  created_at: string;
}

export interface BibleKeywordMark {
  id: string;
  keyword_id: string;
  translation: string;
  book: string;
  chapter: number;
  verse: number;
  start_offset: number | null;
  end_offset: number | null;
  selected_text: string | null;
  token_start: number | null;
  token_end: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface MarkStyleClass {
  className: string;
  badge?: string;
  badgeIcon?: string;
}

export interface MarkingColorClasses {
  underline: string;
  bg: string;
  border: string;
  text: string;
  dot: string;
  chip: string;
}

export const MARKING_COLORS: Record<HighlightColor, MarkingColorClasses> = {
  gold:    { underline: 'decoration-gold-400',    bg: 'bg-gold-500/30',    border: 'border-gold-400/60',    text: 'text-gold-300',    dot: 'bg-gold-400',    chip: 'bg-gold-500/20 border-gold-500/40' },
  amber:   { underline: 'decoration-amber-400',   bg: 'bg-amber-500/30',   border: 'border-amber-400/60',   text: 'text-amber-300',   dot: 'bg-amber-400',   chip: 'bg-amber-500/20 border-amber-500/40' },
  orange:  { underline: 'decoration-orange-400',  bg: 'bg-orange-500/30',  border: 'border-orange-400/60',  text: 'text-orange-300',  dot: 'bg-orange-400',  chip: 'bg-orange-500/20 border-orange-500/40' },
  coral:   { underline: 'decoration-coral-400',   bg: 'bg-coral-500/30',   border: 'border-coral-400/60',   text: 'text-coral-300',   dot: 'bg-coral-400',   chip: 'bg-coral-500/20 border-coral-500/40' },
  red:     { underline: 'decoration-red-400',     bg: 'bg-red-500/30',     border: 'border-red-400/60',     text: 'text-red-300',     dot: 'bg-red-400',     chip: 'bg-red-500/20 border-red-500/40' },
  rose:    { underline: 'decoration-rose-400',    bg: 'bg-rose-500/30',    border: 'border-rose-400/60',    text: 'text-rose-300',    dot: 'bg-rose-400',    chip: 'bg-rose-500/20 border-rose-500/40' },
  violet:  { underline: 'decoration-violet-400',  bg: 'bg-violet-500/30',  border: 'border-violet-400/60',  text: 'text-violet-300',  dot: 'bg-violet-400',  chip: 'bg-violet-500/20 border-violet-500/40' },
  purple:  { underline: 'decoration-purple-400',  bg: 'bg-purple-500/30',  border: 'border-purple-400/60',  text: 'text-purple-300',  dot: 'bg-purple-400',  chip: 'bg-purple-500/20 border-purple-500/40' },
  indigo:  { underline: 'decoration-indigo-400',  bg: 'bg-indigo-500/30',  border: 'border-indigo-400/60',  text: 'text-indigo-300',  dot: 'bg-indigo-400',  chip: 'bg-indigo-500/20 border-indigo-500/40' },
  blue:    { underline: 'decoration-blue-400',    bg: 'bg-blue-500/30',    border: 'border-blue-400/60',    text: 'text-blue-300',    dot: 'bg-blue-400',    chip: 'bg-blue-500/20 border-blue-500/40' },
  teal:    { underline: 'decoration-teal-400',    bg: 'bg-teal-500/30',    border: 'border-teal-400/60',    text: 'text-teal-300',    dot: 'bg-teal-400',    chip: 'bg-teal-500/20 border-teal-500/40' },
  green:   { underline: 'decoration-green-400',   bg: 'bg-green-500/30',   border: 'border-green-400/60',   text: 'text-green-300',   dot: 'bg-green-400',   chip: 'bg-green-500/20 border-green-500/40' },
  sage:    { underline: 'decoration-sage-400',    bg: 'bg-sage-500/30',    border: 'border-sage-400/60',    text: 'text-sage-300',    dot: 'bg-sage-400',    chip: 'bg-sage-500/20 border-sage-500/40' },
};

export function getMarkingColor(key: HighlightColor): MarkingColorClasses {
  return MARKING_COLORS[key] ?? MARKING_COLORS.gold;
}

export function getMarkStyleClasses(style: MarkStyle, colorKey: HighlightColor, symbol: string | null): MarkStyleClass {
  const c = getMarkingColor(colorKey);
  const sym = symbol ?? '★';
  const isIcon = symbol?.startsWith('icon:');

  switch (style) {
    case 'underline':
      return { className: `underline decoration-4 underline-offset-2 ${c.underline}` };
    case 'double_underline':
      return { className: `border-b-[3px] border-double ${c.border}` };
    case 'box':
      return { className: `border-2 ${c.border} rounded-sm px-0.5` };
    case 'oval':
      return { className: `border-2 ${c.border} rounded-full px-1.5` };
    case 'angled_box':
      return { className: `border-2 ${c.border} rounded-sm px-0.5 [transform:skewX(-6deg)] inline-block` };
    case 'slash':
      return { className: `line-through decoration-2 decoration-solid ${c.underline}` };
    case 'highlight':
      return { className: `${c.bg} rounded-sm px-0.5` };
    case 'symbol':
      return isIcon ? { className: '', badgeIcon: symbol } : { className: '', badge: sym };
    case 'symbol_underline':
      return isIcon
        ? { className: `underline decoration-4 underline-offset-2 ${c.underline}`, badgeIcon: symbol }
        : { className: `underline decoration-4 underline-offset-2 ${c.underline}`, badge: sym };
    case 'symbol_highlight':
      return isIcon
        ? { className: `${c.bg} rounded-sm px-0.5`, badgeIcon: symbol }
        : { className: `${c.bg} rounded-sm px-0.5`, badge: sym };
    case 'circle':
    default:
      return { className: `underline decoration-4 underline-offset-2 ${c.underline}` };
  }
}

const SINGLE_WORD_STYLES: MarkStyle[] = ['oval', 'angled_box', 'box'];

export function isSingleWordStyle(style: MarkStyle): boolean {
  return SINGLE_WORD_STYLES.includes(style);
}

export function getPhraseSafeStyle(style: MarkStyle): MarkStyle {
  if (SINGLE_WORD_STYLES.includes(style)) return 'underline';
  return style;
}

export function getStyleDescription(style: MarkStyle): string {
  switch (style) {
    case 'oval': return 'Best for single words. Phrases use underline automatically.';
    case 'angled_box': return 'Best for single words. Phrases use box automatically.';
    case 'slash': return 'Line-through emphasis for contrast or opposition.';
    case 'box': return 'Rounded rectangular outline around the word.';
    case 'double_underline': return 'Two visible underlines for strong emphasis.';
    case 'symbol_underline': return 'Underline plus a small symbol accent.';
    case 'symbol_highlight': return 'Highlight plus a small symbol accent.';
    case 'symbol': return 'Symbol accent only, no line or fill.';
    case 'highlight': return 'Translucent background fill behind the word.';
    case 'underline': return 'Single colored underline beneath the word.';
    default: return '';
  }
}

export interface BibleChapterNote {
  id: string;
  translation: string;
  book: string;
  chapter: number;
  theme: string | null;
  key_people: string | null;
  repeated_words: string | null;
  commands: string | null;
  promises: string | null;
  questions: string | null;
  observations: string | null;
  application: string | null;
  created_at: string;
  updated_at: string;
}

export interface BibleBookmark {
  id: string;
  translation: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
  label: string | null;
  created_at: string;
}

export interface BibleReadingHistory {
  id: string;
  translation: string;
  book: string;
  chapter: number;
  verse: number | null;
  scroll_position: number;
  updated_at: string;
}

export interface VerseSelection {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
}

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  observation: 'Observation',
  interpretation: 'Interpretation',
  application: 'Application',
  prayer: 'Prayer',
  question: 'Question',
  word_study: 'Word Study',
  cross_reference: 'Cross Reference',
  sermon: 'Sermon Note',
  general: 'General',
};

export const HIGHLIGHT_COLORS: { key: HighlightColor; label: string; class: string; dot: string }[] = [
  { key: 'gold',    label: 'Gold',    class: 'bg-gold-500/20 border-gold-500/40',    dot: 'bg-gold-400' },
  { key: 'amber',   label: 'Amber',   class: 'bg-amber-500/20 border-amber-500/40',   dot: 'bg-amber-400' },
  { key: 'orange',  label: 'Orange',  class: 'bg-orange-500/20 border-orange-500/40',  dot: 'bg-orange-400' },
  { key: 'coral',   label: 'Coral',   class: 'bg-coral-500/20 border-coral-500/40',   dot: 'bg-coral-400' },
  { key: 'red',     label: 'Red',     class: 'bg-red-500/20 border-red-500/40',       dot: 'bg-red-400' },
  { key: 'rose',    label: 'Rose',    class: 'bg-rose-500/20 border-rose-500/40',    dot: 'bg-rose-400' },
  { key: 'violet',  label: 'Violet',  class: 'bg-violet-500/20 border-violet-500/40',  dot: 'bg-violet-400' },
  { key: 'purple',  label: 'Purple',  class: 'bg-purple-500/20 border-purple-500/40',  dot: 'bg-purple-400' },
  { key: 'indigo',  label: 'Indigo',  class: 'bg-indigo-500/20 border-indigo-500/40',  dot: 'bg-indigo-400' },
  { key: 'blue',    label: 'Blue',    class: 'bg-blue-500/20 border-blue-500/40',    dot: 'bg-blue-400' },
  { key: 'teal',    label: 'Teal',    class: 'bg-teal-500/20 border-teal-500/40',    dot: 'bg-teal-400' },
  { key: 'green',   label: 'Green',   class: 'bg-green-500/20 border-green-500/40',   dot: 'bg-green-400' },
  { key: 'sage',    label: 'Sage',    class: 'bg-sage-500/20 border-sage-500/40',    dot: 'bg-sage-400' },
];

export const MARK_STYLES: { key: MarkStyle; label: string }[] = [
  { key: 'underline', label: 'Underline' },
  { key: 'double_underline', label: 'Double Underline' },
  { key: 'highlight', label: 'Highlight' },
  { key: 'box', label: 'Box' },
  { key: 'oval', label: 'Oval' },
  { key: 'angled_box', label: 'Angled Box' },
  { key: 'slash', label: 'Slash' },
  { key: 'symbol', label: 'Symbol' },
  { key: 'symbol_underline', label: 'Symbol + Underline' },
  { key: 'symbol_highlight', label: 'Symbol + Highlight' },
];

export interface BibleBook {
  name: string;
  testament: 'OT' | 'NT';
  chapters: number;
}

export const BIBLE_BOOKS: BibleBook[] = [
  { name: 'Genesis', testament: 'OT', chapters: 50 },
  { name: 'Exodus', testament: 'OT', chapters: 40 },
  { name: 'Leviticus', testament: 'OT', chapters: 27 },
  { name: 'Numbers', testament: 'OT', chapters: 36 },
  { name: 'Deuteronomy', testament: 'OT', chapters: 34 },
  { name: 'Joshua', testament: 'OT', chapters: 24 },
  { name: 'Judges', testament: 'OT', chapters: 21 },
  { name: 'Ruth', testament: 'OT', chapters: 4 },
  { name: '1 Samuel', testament: 'OT', chapters: 31 },
  { name: '2 Samuel', testament: 'OT', chapters: 24 },
  { name: '1 Kings', testament: 'OT', chapters: 22 },
  { name: '2 Kings', testament: 'OT', chapters: 25 },
  { name: '1 Chronicles', testament: 'OT', chapters: 29 },
  { name: '2 Chronicles', testament: 'OT', chapters: 36 },
  { name: 'Ezra', testament: 'OT', chapters: 10 },
  { name: 'Nehemiah', testament: 'OT', chapters: 13 },
  { name: 'Esther', testament: 'OT', chapters: 10 },
  { name: 'Job', testament: 'OT', chapters: 42 },
  { name: 'Psalm', testament: 'OT', chapters: 150 },
  { name: 'Proverbs', testament: 'OT', chapters: 31 },
  { name: 'Ecclesiastes', testament: 'OT', chapters: 12 },
  { name: 'Song of Solomon', testament: 'OT', chapters: 8 },
  { name: 'Isaiah', testament: 'OT', chapters: 66 },
  { name: 'Jeremiah', testament: 'OT', chapters: 52 },
  { name: 'Lamentations', testament: 'OT', chapters: 5 },
  { name: 'Ezekiel', testament: 'OT', chapters: 48 },
  { name: 'Daniel', testament: 'OT', chapters: 12 },
  { name: 'Hosea', testament: 'OT', chapters: 14 },
  { name: 'Joel', testament: 'OT', chapters: 3 },
  { name: 'Amos', testament: 'OT', chapters: 9 },
  { name: 'Obadiah', testament: 'OT', chapters: 1 },
  { name: 'Jonah', testament: 'OT', chapters: 4 },
  { name: 'Micah', testament: 'OT', chapters: 7 },
  { name: 'Nahum', testament: 'OT', chapters: 3 },
  { name: 'Habakkuk', testament: 'OT', chapters: 3 },
  { name: 'Zephaniah', testament: 'OT', chapters: 3 },
  { name: 'Haggai', testament: 'OT', chapters: 2 },
  { name: 'Zechariah', testament: 'OT', chapters: 14 },
  { name: 'Malachi', testament: 'OT', chapters: 4 },
  { name: 'Matthew', testament: 'NT', chapters: 28 },
  { name: 'Mark', testament: 'NT', chapters: 16 },
  { name: 'Luke', testament: 'NT', chapters: 24 },
  { name: 'John', testament: 'NT', chapters: 21 },
  { name: 'Acts', testament: 'NT', chapters: 28 },
  { name: 'Romans', testament: 'NT', chapters: 16 },
  { name: '1 Corinthians', testament: 'NT', chapters: 16 },
  { name: '2 Corinthians', testament: 'NT', chapters: 13 },
  { name: 'Galatians', testament: 'NT', chapters: 6 },
  { name: 'Ephesians', testament: 'NT', chapters: 6 },
  { name: 'Philippians', testament: 'NT', chapters: 4 },
  { name: 'Colossians', testament: 'NT', chapters: 4 },
  { name: '1 Thessalonians', testament: 'NT', chapters: 5 },
  { name: '2 Thessalonians', testament: 'NT', chapters: 3 },
  { name: '1 Timothy', testament: 'NT', chapters: 6 },
  { name: '2 Timothy', testament: 'NT', chapters: 4 },
  { name: 'Titus', testament: 'NT', chapters: 3 },
  { name: 'Philemon', testament: 'NT', chapters: 1 },
  { name: 'Hebrews', testament: 'NT', chapters: 13 },
  { name: 'James', testament: 'NT', chapters: 5 },
  { name: '1 Peter', testament: 'NT', chapters: 5 },
  { name: '2 Peter', testament: 'NT', chapters: 3 },
  { name: '1 John', testament: 'NT', chapters: 5 },
  { name: '2 John', testament: 'NT', chapters: 1 },
  { name: '3 John', testament: 'NT', chapters: 1 },
  { name: 'Jude', testament: 'NT', chapters: 1 },
  { name: 'Revelation', testament: 'NT', chapters: 22 },
];

export function getBook(name: string): BibleBook | undefined {
  return BIBLE_BOOKS.find((b) => b.name === name);
}

const SPANISH_BOOK_NAMES: Record<string, string> = {
  'Genesis': 'Génesis',
  'Exodus': 'Éxodo',
  'Leviticus': 'Levítico',
  'Numbers': 'Números',
  'Deuteronomy': 'Deuteronomio',
  'Joshua': 'Josué',
  'Judges': 'Jueces',
  'Ruth': 'Rut',
  '1 Samuel': '1 Samuel',
  '2 Samuel': '2 Samuel',
  '1 Kings': '1 Reyes',
  '2 Kings': '2 Reyes',
  '1 Chronicles': '1 Crónicas',
  '2 Chronicles': '2 Crónicas',
  'Ezra': 'Esdras',
  'Nehemiah': 'Nehemías',
  'Esther': 'Ester',
  'Job': 'Job',
  'Psalm': 'Salmos',
  'Proverbs': 'Proverbios',
  'Ecclesiastes': 'Eclesiastés',
  'Song of Solomon': 'Cantares',
  'Isaiah': 'Isaías',
  'Jeremiah': 'Jeremías',
  'Lamentations': 'Lamentaciones',
  'Ezekiel': 'Ezequiel',
  'Daniel': 'Daniel',
  'Hosea': 'Oseas',
  'Joel': 'Joel',
  'Amos': 'Amós',
  'Obadiah': 'Abdías',
  'Jonah': 'Jonás',
  'Micah': 'Miqueas',
  'Nahum': 'Nahúm',
  'Habakkuk': 'Habacuc',
  'Zephaniah': 'Sofonías',
  'Haggai': 'Hageo',
  'Zechariah': 'Zacarías',
  'Malachi': 'Malaquías',
  'Matthew': 'Mateo',
  'Mark': 'Marcos',
  'Luke': 'Lucas',
  'John': 'Juan',
  'Acts': 'Hechos',
  'Romans': 'Romanos',
  '1 Corinthians': '1 Corintios',
  '2 Corinthians': '2 Corintios',
  'Galatians': 'Gálatas',
  'Ephesians': 'Efesios',
  'Philippians': 'Filipenses',
  'Colossians': 'Colosenses',
  '1 Thessalonians': '1 Tesalonicenses',
  '2 Thessalonians': '2 Tesalonicenses',
  '1 Timothy': '1 Timoteo',
  '2 Timothy': '2 Timoteo',
  'Titus': 'Tito',
  'Philemon': 'Filemón',
  'Hebrews': 'Hebreos',
  'James': 'Santiago',
  '1 Peter': '1 Pedro',
  '2 Peter': '2 Pedro',
  '1 John': '1 Juan',
  '2 John': '2 Juan',
  '3 John': '3 Juan',
  'Jude': 'Judas',
  'Revelation': 'Apocalipsis',
};

export function getBookDisplayName(bookName: string, translation: string): string {
  if (translation === 'RV1909') {
    return SPANISH_BOOK_NAMES[bookName] || bookName;
  }
  return bookName;
}

export function formatReference(sel: VerseSelection, translation?: string): string {
  const displayName = translation ? getBookDisplayName(sel.book, translation) : sel.book;
  if (sel.verseStart === sel.verseEnd) {
    return `${displayName} ${sel.chapter}:${sel.verseStart}`;
  }
  return `${displayName} ${sel.chapter}:${sel.verseStart}\u2013${sel.verseEnd}`;
}
