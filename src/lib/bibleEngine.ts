import { supabase } from './supabase';
import type {
  BibleChapter,
  BibleTranslation,
  BibleVerse,
  BibleNote,
  BibleHighlight,
  BibleKeyword,
  BibleKeywordMark,
  BibleChapterNote,
  BibleBookmark,
  BibleReadingHistory,
  NoteType,
  HighlightColor,
  MarkStyle,
  VerseSelection,
} from './bibleTypes';
import { getBook } from './bibleTypes';

// ============================================================
// Scripture Text Provider — World English Bible (WEB)
// Bundled locally via localWEBProvider — no network calls
// ============================================================

import { localWEBProvider } from './localWEBProvider';
import { localRV1909Provider } from './localRV1909Provider';

const chapterCache = new Map<string, BibleChapter>();

function getProvider(translation: BibleTranslation) {
  switch (translation) {
    case 'RV1909':
      return localRV1909Provider;
    case 'WEB':
    default:
      return localWEBProvider;
  }
}

export async function fetchChapter(
  book: string,
  chapter: number,
  translation: BibleTranslation = 'WEB',
): Promise<BibleChapter> {
  const cacheKey = `${translation}:${book}:${chapter}`;
  const cached = chapterCache.get(cacheKey);
  if (cached) return cached;

  const provider = getProvider(translation);
  const result = await provider.getChapter(translation, book, chapter);
  chapterCache.set(cacheKey, result);
  return result;
}

export async function fetchVerses(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd: number,
  translation: BibleTranslation = 'WEB',
): Promise<{ verses: BibleVerse[]; reference: string }> {
  const fullChapter = await fetchChapter(book, chapter, translation);
  const selected = fullChapter.verses.filter(
    (v) => v.verse >= verseStart && v.verse <= verseEnd,
  );
  const reference =
    verseStart === verseEnd
      ? `${book} ${chapter}:${verseStart}`
      : `${book} ${chapter}:${verseStart}\u2013${verseEnd}`;
  return { verses: selected, reference };
}

// ============================================================
// Reading History
// ============================================================

export async function getReadingHistory(): Promise<BibleReadingHistory | null> {
  const { data, error } = await supabase
    .from('bible_reading_history')
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('[Bible] getReadingHistory error:', error);
    return null;
  }
  return data as BibleReadingHistory | null;
}

export async function saveReadingLocation(
  book: string,
  chapter: number,
  translation: string = 'WEB',
  verse?: number,
  scrollPosition?: number,
): Promise<void> {
  const { error } = await supabase
    .from('bible_reading_history')
    .upsert(
      {
        translation,
        book,
        chapter,
        verse: verse ?? null,
        scroll_position: scrollPosition ?? 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (error) {
    console.error('[Bible] saveReadingLocation error:', error);
  }
}

// ============================================================
// Highlights
// ============================================================

export async function getHighlights(
  book: string,
  chapter: number,
): Promise<BibleHighlight[]> {
  const { data, error } = await supabase
    .from('bible_highlights')
    .select('*')
    .eq('book', book)
    .eq('chapter', chapter)
    .order('verse_start');

  if (error) {
    console.error('[Bible] getHighlights error:', error);
    return [];
  }
  return (data || []) as BibleHighlight[];
}

export async function saveHighlight(
  sel: VerseSelection,
  colorKey: HighlightColor,
  translation: string = 'WEB',
  wordLevel?: {
    selectedText: string;
    tokenStart: number;
    tokenEnd: number;
    startOffset: number;
    endOffset: number;
  },
): Promise<BibleHighlight | null> {
  const payload: Record<string, unknown> = {
    translation,
    book: sel.book,
    chapter: sel.chapter,
    verse_start: sel.verseStart,
    verse_end: sel.verseEnd,
    color_key: colorKey,
  };
  if (wordLevel) {
    payload.selected_text = wordLevel.selectedText;
    payload.token_start = wordLevel.tokenStart;
    payload.token_end = wordLevel.tokenEnd;
    payload.start_offset = wordLevel.startOffset;
    payload.end_offset = wordLevel.endOffset;
  }
  const { data, error } = await supabase
    .from('bible_highlights')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    console.error('[Bible] saveHighlight error:', error);
    return null;
  }
  return data as BibleHighlight;
}

export async function removeHighlight(id: string): Promise<boolean> {
  const { error } = await supabase.from('bible_highlights').delete().eq('id', id);
  if (error) {
    console.error('[Bible] removeHighlight error:', error);
    return false;
  }
  return true;
}

export async function updateHighlightColor(
  id: string,
  colorKey: HighlightColor,
): Promise<boolean> {
  const { error } = await supabase
    .from('bible_highlights')
    .update({ color_key: colorKey })
    .eq('id', id);
  if (error) {
    console.error('[Bible] updateHighlightColor error:', error);
    return false;
  }
  return true;
}

// ============================================================
// Notes
// ============================================================

export async function getNotes(
  book?: string,
  chapter?: number,
): Promise<BibleNote[]> {
  let query = supabase.from('bible_notes').select('*').order('created_at', { ascending: false });
  if (book) query = query.eq('book', book);
  if (chapter) query = query.eq('chapter', chapter);
  const { data, error } = await query;
  if (error) {
    console.error('[Bible] getNotes error:', error);
    return [];
  }
  return (data || []) as BibleNote[];
}

export async function searchNotes(searchText: string): Promise<BibleNote[]> {
  const { data, error } = await supabase
    .from('bible_notes')
    .select('*')
    .or(`content.ilike.%${searchText}%,title.ilike.%${searchText}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Bible] searchNotes error:', error);
    return [];
  }
  return (data || []) as BibleNote[];
}

export async function saveNote(
  sel: VerseSelection,
  noteType: NoteType,
  content: string,
  title: string | null,
  translation: string = 'WEB',
  existingId?: string,
): Promise<BibleNote | null> {
  const payload = {
    translation,
    book: sel.book,
    chapter: sel.chapter,
    verse_start: sel.verseStart,
    verse_end: sel.verseEnd,
    note_type: noteType,
    title,
    content,
  };

  let result;
  if (existingId) {
    result = await supabase.from('bible_notes').update(payload).eq('id', existingId).select('*').single();
  } else {
    result = await supabase.from('bible_notes').insert(payload).select('*').single();
  }

  if (result.error) {
    console.error('[Bible] saveNote error:', result.error);
    return null;
  }
  return result.data as BibleNote;
}

export async function deleteNote(id: string): Promise<boolean> {
  const { error } = await supabase.from('bible_notes').delete().eq('id', id);
  if (error) {
    console.error('[Bible] deleteNote error:', error);
    return false;
  }
  return true;
}

// ============================================================
// Chapter Notes
// ============================================================

export async function getChapterNote(
  book: string,
  chapter: number,
): Promise<BibleChapterNote | null> {
  const { data, error } = await supabase
    .from('bible_chapter_notes')
    .select('*')
    .eq('book', book)
    .eq('chapter', chapter)
    .maybeSingle();

  if (error) {
    console.error('[Bible] getChapterNote error:', error);
    return null;
  }
  return data as BibleChapterNote | null;
}

export async function saveChapterNote(
  book: string,
  chapter: number,
  fields: Partial<Pick<BibleChapterNote, 'theme' | 'key_people' | 'repeated_words' | 'commands' | 'promises' | 'questions' | 'observations' | 'application'>>,
  translation: string = 'WEB',
): Promise<BibleChapterNote | null> {
  const { data, error } = await supabase
    .from('bible_chapter_notes')
    .upsert(
      { translation, book, chapter, ...fields },
      { onConflict: 'user_id,translation,book,chapter' },
    )
    .select('*')
    .single();

  if (error) {
    console.error('[Bible] saveChapterNote error:', error);
    return null;
  }
  return data as BibleChapterNote;
}

// ============================================================
// Bookmarks
// ============================================================

export async function getBookmarks(): Promise<BibleBookmark[]> {
  const { data, error } = await supabase
    .from('bible_bookmarks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Bible] getBookmarks error:', error);
    return [];
  }
  return (data || []) as BibleBookmark[];
}

export async function saveBookmark(
  sel: VerseSelection,
  label: string | null,
  translation: string = 'WEB',
): Promise<BibleBookmark | null> {
  const { data, error } = await supabase
    .from('bible_bookmarks')
    .insert({
      translation,
      book: sel.book,
      chapter: sel.chapter,
      verse_start: sel.verseStart,
      verse_end: sel.verseEnd,
      label,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[Bible] saveBookmark error:', error);
    return null;
  }
  return data as BibleBookmark;
}

export async function removeBookmark(id: string): Promise<boolean> {
  const { error } = await supabase.from('bible_bookmarks').delete().eq('id', id);
  if (error) {
    console.error('[Bible] removeBookmark error:', error);
    return false;
  }
  return true;
}

// ============================================================
// Keywords
// ============================================================

export async function getKeywords(): Promise<BibleKeyword[]> {
  const { data, error } = await supabase
    .from('bible_keywords')
    .select('*')
    .order('name');

  if (error) {
    console.error('[Bible] getKeywords error:', error);
    return [];
  }
  return (data || []) as BibleKeyword[];
}

export async function saveKeyword(
  name: string,
  colorKey: HighlightColor,
  markStyle: MarkStyle,
  symbol: string | null,
  description: string | null,
): Promise<BibleKeyword | null> {
  const { data, error } = await supabase
    .from('bible_keywords')
    .insert({ name, color_key: colorKey, mark_style: markStyle, symbol, description })
    .select('*')
    .single();

  if (error) {
    console.error('[Bible] saveKeyword error:', error);
    return null;
  }
  return data as BibleKeyword;
}

export async function deleteKeyword(id: string): Promise<boolean> {
  const { error } = await supabase.from('bible_keywords').delete().eq('id', id);
  if (error) {
    console.error('[Bible] deleteKeyword error:', error);
    return false;
  }
  return true;
}

export async function updateKeyword(
  id: string,
  name: string,
  colorKey: HighlightColor,
  markStyle: MarkStyle,
  symbol: string | null,
  description: string | null,
): Promise<BibleKeyword | null> {
  const { data, error } = await supabase
    .from('bible_keywords')
    .update({ name, color_key: colorKey, mark_style: markStyle, symbol, description, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) {
    console.error('[Bible] updateKeyword error:', error);
    return null;
  }
  return data as BibleKeyword;
}

// ============================================================
// Keyword Marks
// ============================================================

export async function getKeywordMarks(
  book: string,
  chapter: number,
): Promise<BibleKeywordMark[]> {
  const { data, error } = await supabase
    .from('bible_keyword_marks')
    .select('*')
    .eq('book', book)
    .eq('chapter', chapter);

  if (error) {
    console.error('[Bible] getKeywordMarks error:', error);
    return [];
  }
  return (data || []) as BibleKeywordMark[];
}

export async function saveKeywordMark(
  keywordId: string,
  book: string,
  chapter: number,
  verse: number,
  translation: string = 'WEB',
  wordLevel?: {
    selectedText: string;
    tokenStart: number;
    tokenEnd: number;
    startOffset: number;
    endOffset: number;
  },
): Promise<BibleKeywordMark | null> {
  const payload: Record<string, unknown> = {
    keyword_id: keywordId,
    translation,
    book,
    chapter,
    verse,
  };
  if (wordLevel) {
    payload.selected_text = wordLevel.selectedText;
    payload.token_start = wordLevel.tokenStart;
    payload.token_end = wordLevel.tokenEnd;
    payload.start_offset = wordLevel.startOffset;
    payload.end_offset = wordLevel.endOffset;
  }

  const { data, error } = await supabase
    .from('bible_keyword_marks')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    console.error('[Bible] saveKeywordMark error:', error);
    return null;
  }
  return data as BibleKeywordMark;
}

export async function removeKeywordMark(id: string): Promise<boolean> {
  const { error } = await supabase.from('bible_keyword_marks').delete().eq('id', id);
  if (error) {
    console.error('[Bible] removeKeywordMark error:', error);
    return false;
  }
  return true;
}

export async function updateKeywordMarkKey(markId: string, newKeywordId: string): Promise<BibleKeywordMark | null> {
  const { data, error } = await supabase
    .from('bible_keyword_marks')
    .update({ keyword_id: newKeywordId, updated_at: new Date().toISOString() })
    .eq('id', markId)
    .select('*')
    .single();
  if (error) {
    console.error('[Bible] updateKeywordMarkKey error:', error);
    return null;
  }
  return data as BibleKeywordMark;
}

// ============================================================
// Helpers
// ============================================================

export function getNextChapter(book: string, chapter: number): { book: string; chapter: number } | null {
  const bookInfo = getBook(book);
  if (!bookInfo) return null;
  if (chapter < bookInfo.chapters) {
    return { book, chapter: chapter + 1 };
  }
  // Next book
  const bookIndex = getBookIndex(book);
  if (bookIndex < 0 || bookIndex >= BIBLE_BOOKS_LENGTH - 1) return null;
  const nextBook = BIBLE_BOOKS_BY_INDEX[bookIndex + 1];
  return { book: nextBook.name, chapter: 1 };
}

export function getPrevChapter(book: string, chapter: number): { book: string; chapter: number } | null {
  if (chapter > 1) {
    return { book, chapter: chapter - 1 };
  }
  // Previous book, last chapter
  const bookIndex = getBookIndex(book);
  if (bookIndex <= 0) return null;
  const prevBook = BIBLE_BOOKS_BY_INDEX[bookIndex - 1];
  return { book: prevBook.name, chapter: prevBook.chapters };
}

import { BIBLE_BOOKS } from './bibleTypes';

const BIBLE_BOOKS_BY_INDEX = BIBLE_BOOKS;
const BIBLE_BOOKS_LENGTH = BIBLE_BOOKS.length;

function getBookIndex(name: string): number {
  return BIBLE_BOOKS.findIndex((b) => b.name === name);
}
