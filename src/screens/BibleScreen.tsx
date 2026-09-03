import { useState, useRef, useEffect, useCallback } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Copy,
  Share,
  Bookmark,
  Highlighter,
  StickyNote,
  Send,
  Search,
  Library,
  Tag,
  Trash2,
  Type,
  Check,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Plus,
  Sparkles,
  Pencil,
  XCircle,
  Zap,
  Link2,
  Clock,
  MapPin,
  Flame,
  Crown,
  Heart,
  Eye,
  BookOpen as BookOpenIcon,
  MoreHorizontal,
  History,
  Info,
  type LucideIcon,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { vibrate } from '@/lib/utils';
import type { Walk } from '@/lib/types';
import {
  BIBLE_BOOKS,
  BIBLE_TRANSLATIONS,
  HIGHLIGHT_COLORS,
  MARKING_COLORS,
  MARK_STYLES,
  SYMBOL_LIBRARY,
  SYMBOL_OPTIONS,
  NOTE_TYPE_LABELS,
  getBook,
  formatReference,
  getMarkStyleClasses,
  getMarkingColor,
  getPhraseSafeStyle,
  getStyleDescription,
  isSingleWordStyle,
  isIconSymbol,
  type BibleBook,
  type BibleVerse,
  type BibleTranslation,
  type BibleTranslationInfo,
  type NoteType,
  type HighlightColor,
  type MarkStyle,
  type VerseSelection,
  type BibleNote,
  type BibleHighlight,
  type BibleBookmark,
  type BibleKeyword,
  type BibleKeywordMark,
  type BibleChapterNote,
  type SymbolOption,
  getBookDisplayName,
} from '@/lib/bibleTypes';
import {
  fetchChapter,
  getReadingHistory,
  saveReadingLocation,
  getHighlights,
  saveHighlight,
  removeHighlight,
  getNotes,
  saveNote,
  deleteNote,
  searchNotes,
  getChapterNote,
  saveChapterNote,
  getBookmarks,
  saveBookmark,
  removeBookmark,
  getKeywords,
  saveKeyword,
  deleteKeyword,
  updateKeyword,
  getKeywordMarks,
  saveKeywordMark,
  removeKeywordMark,
  updateKeywordMarkKey,
  fetchVerses,
  updateHighlightColor,
  getNextChapter,
  getPrevChapter,
} from '@/lib/bibleEngine';
import ScriptureVerseText from '@/components/ScriptureVerseText';
import SymbolPicker from '@/components/SymbolPicker';
import { tokenizeVerse, getSelectedText, rangesOverlap } from '@/lib/scriptureTokenizer';
import { getCrossReferences, parseReference, CROSS_REF_ATTRIBUTION } from '@/lib/crossRefEngine';

type TextScale = 'small' | 'default' | 'large' | 'extra_large';
const TEXT_SIZES: Record<TextScale, string> = {
  small: 'text-[16px] leading-[1.65]',
  default: 'text-[18px] leading-[1.7]',
  large: 'text-[20px] leading-[1.75]',
  extra_large: 'text-[22px] leading-[1.8]',
};

type View = 'reader' | 'books' | 'chapters' | 'notes' | 'bookmarks' | 'keywords' | 'marking_key' | 'reading_history' | 'chapter_notes' | 'note_editor' | 'passage_study';

interface BibleScreenProps {
  onStartWalk: (walk: Walk) => void;
  onAskScripture?: (book: string, chapter: number, verseStart: number, verseEnd: number) => void;
  initialReference?: { book: string; chapter: number; verseStart: number | null; verseEnd: number | null } | null;
  onBack?: () => void;
}

export default function BibleScreen({ onStartWalk, onAskScripture, initialReference, onBack }: BibleScreenProps) {
  const [view, setView] = useState<View>('reader');
  const [translation, setTranslation] = useState<BibleTranslation>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('solapath_translation') : null;
    return (saved as BibleTranslation) || 'WEB';
  });
  const [highlightMode, setHighlightMode] = useState<'word' | 'verse'>('word');
  const [highlightWordSel, setHighlightWordSel] = useState<number | null>(null);
  const [highlightWordEnd, setHighlightWordEnd] = useState<number | null>(null);
  const [highlightWordPhase, setHighlightWordPhase] = useState<'idle' | 'awaiting_end' | 'ready'>('idle');
  const [book, setBook] = useState('John');
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<VerseSelection | null>(null);
  const [highlights, setHighlights] = useState<BibleHighlight[]>([]);
  const [notes, setNotes] = useState<BibleNote[]>([]);
  const [bookmarks, setBookmarks] = useState<BibleBookmark[]>([]);
  const [keywords, setKeywords] = useState<BibleKeyword[]>([]);
  const [keywordMarks, setKeywordMarks] = useState<BibleKeywordMark[]>([]);
  const [chapterNote, setChapterNote] = useState<BibleChapterNote | null>(null);
  const [textScale, setTextScale] = useState<TextScale>('default');
  const [showTextSize, setShowTextSize] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showKeywordPicker, setShowKeywordPicker] = useState(false);
  const [markingMode, setMarkingMode] = useState(false);
  const [markingVerse, setMarkingVerse] = useState<number | null>(null);
  const [tokenSelStart, setTokenSelStart] = useState<number | null>(null);
  const [tokenSelEnd, setTokenSelEnd] = useState<number | null>(null);
  const [adjustMode, setAdjustMode] = useState(false);
  const [markPhase, setMarkPhase] = useState<'idle' | 'awaiting_start' | 'awaiting_end' | 'range_selected' | 'choosing_key' | 'saving'>('idle');
  const [pendingKey, setPendingKey] = useState<BibleKeyword | null>(null);
  const [showSetupSheet, setShowSetupSheet] = useState(false);
  const [showInlineKeyCreator, setShowInlineKeyCreator] = useState(false);
  const [inlineKeyName, setInlineKeyName] = useState('');
  const [inlineKeyColor, setInlineKeyColor] = useState<HighlightColor>('gold');
  const [inlineKeyStyle, setInlineKeyStyle] = useState<MarkStyle>('underline');
  const [inlineKeySymbol, setInlineKeySymbol] = useState('');
  const [inlineKeySaving, setInlineKeySaving] = useState(false);
  const [markRemoveId, setMarkRemoveId] = useState<string | null>(null);
  const [highlightActionId, setHighlightActionId] = useState<string | null>(null);
  const [highlightOverlapId, setHighlightOverlapId] = useState<string | null>(null);
  const [markSaveError, setMarkSaveError] = useState(false);
  const [chapterMarkingMode, setChapterMarkingMode] = useState(false);
  const [activeKeyId, setActiveKeyId] = useState<string | null>(null);
  const [markDetailId, setMarkDetailId] = useState<string | null>(null);
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);
  const [rapidMode, setRapidMode] = useState(true);
  const [undoToast, setUndoToast] = useState<{ markId: string; keyName: string } | null>(null);
  const [changeKeyMode, setChangeKeyMode] = useState(false);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showVersionSheet, setShowVersionSheet] = useState(false);
  const [showStudyMenu, setShowStudyMenu] = useState(false);
  const [showCrossRefs, setShowCrossRefs] = useState(false);
  const [crossRefData, setCrossRefData] = useState<{ target: string; rank: number }[]>([]);
  const [crossRefLoading, setCrossRefLoading] = useState(false);
  const [crossRefPreviews, setCrossRefPreviews] = useState<Record<string, string>>({});
  const [crossRefLimit, setCrossRefLimit] = useState(8);
  const [crossRefNavStack, setCrossRefNavStack] = useState<{ book: string; chapter: number; verse: number; scrollY: number }[]>([]);
  const [highlightSaveError, setHighlightSaveError] = useState(false);
  const [highlightRemoveError, setHighlightRemoveError] = useState(false);
  const [bookmarkSaveError, setBookmarkSaveError] = useState(false);
  const [noteSaveError, setNoteSaveError] = useState(false);
  const [studySaving, setStudySaving] = useState(false);
  const loadRequestId = useRef(0);
  const [history, setHistory] = useState<{ book: string; chapter: number } | null>(null);
  const [noteEditorState, setNoteEditorState] = useState<{ sel: VerseSelection; existing?: BibleNote } | null>(null);
  const [studySel, setStudySel] = useState<VerseSelection | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BibleNote[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const verseRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [passageEmphasis, setPassageEmphasis] = useState<{ verseStart: number; verseEnd: number } | null>(null);
  const initialReferenceProcessed = useRef(false);

  // Load chapter — uses request guard to prevent stale data overwrites
  const loadChapter = useCallback(async (b: string, c: number) => {
    const reqId = ++loadRequestId.current;
    setLoading(true);
    setError(null);
    setSelection(null);
    setShowActions(false);
    setMarkingMode(false);
    setMarkingVerse(null);
    setTokenSelStart(null);
    setTokenSelEnd(null);
    setAdjustMode(false);
    setMarkPhase('idle');
    setPendingKey(null);
    setShowSetupSheet(false);
    setShowInlineKeyCreator(false);
    setInlineKeyName('');
    setInlineKeySymbol('');
    setInlineKeySaving(false);
    setMarkRemoveId(null);
    setHighlightActionId(null);
    setHighlightOverlapId(null);
    setMarkSaveError(false);
    setChapterMarkingMode(false);
    setActiveKeyId(null);
    setMarkDetailId(null);
    setShowSymbolPicker(false);
    setRapidMode(true);
    setUndoToast(null);
    setChangeKeyMode(false);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setHighlightSaveError(false);
    setBookmarkSaveError(false);
    setNoteSaveError(false);
    try {
      const data = await fetchChapter(b, c, translation);
      if (reqId !== loadRequestId.current) return;
      setVerses(data.verses);
      setBook(b);
      setChapter(c);
      saveReadingLocation(b, c, translation);
      const [hs, ns, kms, cn] = await Promise.all([
        getHighlights(b, c),
        getNotes(b, c),
        getKeywordMarks(b, c),
        getChapterNote(b, c),
      ]);
      if (reqId !== loadRequestId.current) return;
      setHighlights(hs);
      setNotes(ns);
      setKeywordMarks(kms);
      setChapterNote(cn);
    } catch (err) {
      if (reqId !== loadRequestId.current) return;
      setError(err instanceof Error ? err.message : 'Could not load this chapter.');
      setVerses([]);
    }
    if (reqId === loadRequestId.current) setLoading(false);
  }, [translation]);

  // Initial load — check reading history or initialReference
  useEffect(() => {
    (async () => {
      if (initialReference && !initialReferenceProcessed.current) {
        initialReferenceProcessed.current = true;
        setHistory({ book: initialReference.book, chapter: initialReference.chapter });
        const vs = initialReference.verseStart;
        const ve = initialReference.verseEnd;
        if (vs !== null && ve !== null) {
          setPassageEmphasis({ verseStart: vs, verseEnd: ve });
        }
        await loadChapter(initialReference.book, initialReference.chapter);
      } else {
        const h = await getReadingHistory();
        if (h) {
          setHistory({ book: h.book, chapter: h.chapter });
          loadChapter(h.book, h.chapter);
        } else {
          loadChapter('John', 1);
        }
      }
      const [bms, kws] = await Promise.all([getBookmarks(), getKeywords()]);
      setBookmarks(bms);
      setKeywords(kws);
    })();
  }, [loadChapter, initialReference]);

  // Scroll to target verse after chapter loads when coming from Read in App
  useEffect(() => {
    if (!passageEmphasis || verses.length === 0 || loading) return;
    const targetVerse = passageEmphasis.verseStart;
    const verseEl = verseRefs.current.get(targetVerse);
    if (verseEl) {
      verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const timer = setTimeout(() => setPassageEmphasis(null), 2000);
    return () => clearTimeout(timer);
  }, [passageEmphasis, verses, loading]);

  // Verse selection
  function handleVerseTap(verseNum: number) {
    vibrate(5);
    if (!selection || selection.book !== book || selection.chapter !== chapter) {
      const sel: VerseSelection = { book, chapter, verseStart: verseNum, verseEnd: verseNum };
      setSelection(sel);
      setShowActions(true);
      return;
    }
    if (selection.verseStart === verseNum && selection.verseEnd === verseNum) {
      setSelection(null);
      setShowActions(false);
      return;
    }
    if (verseNum === selection.verseStart - 1) {
      setSelection({ ...selection, verseStart: verseNum });
    } else if (verseNum === selection.verseEnd + 1) {
      setSelection({ ...selection, verseEnd: verseNum });
    } else if (verseNum >= selection.verseStart && verseNum <= selection.verseEnd) {
      setSelection(null);
      setShowActions(false);
    } else {
      setSelection({ book, chapter, verseStart: verseNum, verseEnd: verseNum });
    }
  }

  function isVerseSelected(v: number): boolean {
    return !!selection && v >= selection.verseStart && v <= selection.verseEnd;
  }

  function getWholeVerseHighlight(v: number): BibleHighlight | null {
    return highlights.find((h) => v >= h.verse_start && v <= h.verse_end && h.token_start === null && h.token_end === null) || null;
  }

  function getTokenHighlightsForVerse(v: number): BibleHighlight[] {
    return highlights.filter((h) => h.verse_start === v && h.token_start !== null && h.token_end !== null);
  }

  function getNoteCountForVerse(v: number): number {
    return notes.filter((n) => v >= n.verse_start && v <= n.verse_end).length;
  }

  function getKeywordMarkForVerse(v: number): BibleKeywordMark | null {
    return keywordMarks.find((km) => km.verse === v) || null;
  }

  const activeKey = keywords.find((k) => k.id === activeKeyId) || null;

  async function performRapidMark(verseNum: number, startTok: number, endTok: number): Promise<BibleKeywordMark | null> {
    if (!activeKey) return null;
    setMarkSaveError(false);
    const verseData = verses.find((v) => v.verse === verseNum);
    if (!verseData) return null;
    const tokens = tokenizeVerse(verseData.text);
    const sTok = Math.min(startTok, endTok);
    const eTok = Math.max(startTok, endTok);
    const selText = getSelectedText(tokens, sTok, eTok);
    const startOff = tokens[sTok].startOffset;
    const endOff = tokens[eTok].endOffset;

    const existingWordMarks = keywordMarks.filter(
      (km) => km.verse === verseNum && km.token_start !== null && km.token_end !== null,
    );
    const hasOverlap = existingWordMarks.some((km) =>
      rangesOverlap(sTok, eTok, km.token_start!, km.token_end!),
    );
    if (hasOverlap) {
      setMarkSaveError(true);
      return null;
    }

    const mark = await saveKeywordMark(
      activeKey.id,
      book,
      chapter,
      verseNum,
      translation,
      {
        selectedText: selText,
        tokenStart: sTok,
        tokenEnd: eTok,
        startOffset: startOff,
        endOffset: endOff,
      },
    );
    if (mark) {
      setKeywordMarks((prev) => [...prev, mark]);
      setTokenSelStart(null);
      setTokenSelEnd(null);
      setMarkPhase('idle');
      if (undoTimer.current) clearTimeout(undoTimer.current);
      setUndoToast({ markId: mark.id, keyName: activeKey.name });
      undoTimer.current = setTimeout(() => setUndoToast(null), 3500);
    } else {
      setMarkSaveError(true);
    }
    return mark;
  }

  async function undoLastMark(markId: string) {
    vibrate(8);
    const ok = await removeKeywordMark(markId);
    if (ok) {
      setKeywordMarks((prev) => prev.filter((m) => m.id !== markId));
    }
    setUndoToast(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }

  // Actions
  async function handleHighlight(color: HighlightColor) {
    if (!selection) return;
    vibrate(8);
    setHighlightSaveError(false);

    if (highlightMode === 'word' && highlightWordSel !== null) {
      const endTokRaw = highlightWordEnd !== null ? highlightWordEnd : highlightWordSel;
      const vd = verses.find((v) => v.verse === selection.verseStart);
      if (!vd) return;
      const tokens = tokenizeVerse(vd.text);
      const startTok = Math.min(highlightWordSel, endTokRaw);
      const endTok = Math.max(highlightWordSel, endTokRaw);
      const selText = getSelectedText(tokens, startTok, endTok);
      const overlapping = highlights.find(
        (h) => h.verse_start === selection.verseStart && h.token_start !== null && h.token_end !== null &&
          rangesOverlap(startTok, endTok, h.token_start!, h.token_end!),
      );
      if (overlapping) {
        setHighlightOverlapId(overlapping.id);
        return;
      }
      const saved = await saveHighlight(selection, color, translation, {
        selectedText: selText,
        tokenStart: startTok,
        tokenEnd: endTok,
        startOffset: tokens[startTok].startOffset,
        endOffset: tokens[endTok].endOffset,
      });
      if (saved) {
        setHighlights((prev) => [...prev, saved]);
      } else {
        setHighlightSaveError(true);
        return;
      }
    } else {
      const existing = highlights.find(
        (h) => h.verse_start === selection.verseStart && h.verse_end === selection.verseEnd && h.token_start === null,
      );
      if (existing) {
        const ok = await updateHighlightColor(existing.id, color);
        if (ok) {
          setHighlights((prev) => prev.map((h) => h.id === existing.id ? { ...h, color_key: color } : h));
        } else {
          setHighlightSaveError(true);
          return;
        }
      } else {
        const saved = await saveHighlight(selection, color, translation);
        if (saved) {
          setHighlights((prev) => [...prev, saved]);
        } else {
          setHighlightSaveError(true);
          return;
        }
      }
    }
    setShowHighlightPicker(false);
    setHighlightWordSel(null);
    setHighlightWordEnd(null);
    setHighlightWordPhase('idle');
  }

  async function handleBookmark() {
    if (!selection) return;
    vibrate(8);
    setBookmarkSaveError(false);
    const existing = bookmarks.find(
      (bm) => bm.book === selection.book && bm.chapter === selection.chapter &&
        bm.verse_start === selection.verseStart && bm.verse_end === selection.verseEnd,
    );
    if (existing) {
      const ok = await removeBookmark(existing.id);
      if (ok) {
        setBookmarks((prev) => prev.filter((bm) => bm.id !== existing.id));
      } else {
        setBookmarkSaveError(true);
        return;
      }
    } else {
      const saved = await saveBookmark(selection, null, translation);
      if (saved) {
        setBookmarks((prev) => [saved, ...prev]);
      } else {
        setBookmarkSaveError(true);
        return;
      }
    }
    setShowActions(false);
    setSelection(null);
  }

  function handleCopy() {
    if (!selection) return;
    vibrate(6);
    const selectedVerses = verses.filter((v) => v.verse >= selection.verseStart && v.verse <= selection.verseEnd);
    const ref = formatReference(selection, translation);
    const text = `${ref} (${translation})\n\n${selectedVerses.map((v) => `${v.verse} ${v.text}`).join('\n')}`;
    navigator.clipboard.writeText(text).then(() => {
      setShowActions(false);
    });
  }

  function handleShare() {
    if (!selection) return;
    vibrate(6);
    const selectedVerses = verses.filter((v) => v.verse >= selection.verseStart && v.verse <= selection.verseEnd);
    const ref = formatReference(selection, translation);
    const text = `${ref} (${translation})\n\n${selectedVerses.map((v) => `${v.verse} ${v.text}`).join('\n')}`;
    if (navigator.share) {
      navigator.share({ title: ref, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
    }
    setShowActions(false);
  }

  function handleAsk() {
    if (!selection) return;
    vibrate(10);
    if (onAskScripture) {
      onAskScripture(selection.book, selection.chapter, selection.verseStart, selection.verseEnd);
    } else {
      onStartWalk({
        id: 'temp-bible-' + Date.now(),
        passage_reference: formatReference(selection, translation),
        reading_objective: 'Read slowly. Notice what the text actually says.',
        observation_prompt: 'What word or phrase stands out to you?',
        estimated_minutes: 7,
        status: 'pending',
        started_at: null,
        finished_at: null,
        created_at: new Date().toISOString(),
      });
    }
    setShowActions(false);
    setSelection(null);
  }

  function handleStudy() {
    if (!selection) return;
    vibrate(10);
    setStudySel(selection);
    setView('passage_study');
    setShowActions(false);
    setSelection(null);
  }

  function handleNote() {
    if (!selection) return;
    vibrate(8);
    const existing = notes.find(
      (n) => n.verse_start === selection.verseStart && n.verse_end === selection.verseEnd,
    );
    setNoteEditorState({ sel: selection, existing });
    setView('note_editor');
    setShowActions(false);
    setSelection(null);
  }

  // Navigation
  function goToChapter(b: string, c: number) {
    setView('reader');
    loadChapter(b, c);
  }

  function handlePrevChapter() {
    const prev = getPrevChapter(book, chapter);
    if (prev) {
      vibrate(6);
      loadChapter(prev.book, prev.chapter);
      scrollRef.current?.scrollTo({ top: 0 });
    }
  }

  function handleNextChapter() {
    const next = getNextChapter(book, chapter);
    if (next) {
      vibrate(6);
      loadChapter(next.book, next.chapter);
      scrollRef.current?.scrollTo({ top: 0 });
    }
  }

  // Search
  async function handleSearch() {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const results = await searchNotes(searchQuery.trim());
    setSearchResults(results);
  }

  const textSizeClass = TEXT_SIZES[textScale];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={`app-container bg-ink-950 bg-parchment min-h-screen ${chapterMarkingMode ? 'pb-72' : 'pb-28'}`}>
      {/* HEADER */}
      <header className="px-6 pt-14 safe-top sticky top-0 z-20 bg-ink-950/95 backdrop-blur-md border-b border-ink-700/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="w-9 h-9 rounded-full bg-ink-800/50 border border-ink-600/30 flex items-center justify-center text-ivory-400 hover:text-ivory-100 transition-colors no-tap-highlight"
                aria-label="Back"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <p className="ui-label">Bible</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowTextSize(!showTextSize); }}
              className="w-9 h-9 rounded-full bg-ink-800/50 border border-ink-600/30 flex items-center justify-center text-ivory-400 hover:text-ivory-100 transition-colors no-tap-highlight"
              aria-label="Text size"
            >
              <Type size={16} />
            </button>
          </div>
        </div>

        {showTextSize && (
          <div className="flex gap-2 mt-3 animate-fade-in">
            {(['small', 'default', 'large', 'extra_large'] as TextScale[]).map((s) => (
              <button
                key={s}
                onClick={() => { vibrate(4); setTextScale(s); setShowTextSize(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all no-tap-highlight ${
                  textScale === s ? 'bg-gold-500/20 border-gold-500/40 text-gold-300' : 'bg-ink-800/40 border-ink-600/30 text-ivory-400'
                }`}
              >
                {s === 'extra_large' ? 'XL' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        )}

        {view === 'reader' && (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handlePrevChapter}
              disabled={!getPrevChapter(book, chapter)}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-ink-800/40 border border-ink-600/30 text-ivory-300 hover:border-gold-500/30 transition-all no-tap-highlight disabled:opacity-30"
              aria-label="Previous chapter"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setView('books')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ink-800/40 border border-ink-600/30 text-ivory-200 text-sm font-medium hover:border-gold-500/30 transition-all no-tap-highlight"
            >
              {getBookDisplayName(book, translation)} <ChevronDown size={14} className="text-ivory-500" />
            </button>
            <button
              onClick={() => setView('chapters')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ink-800/40 border border-ink-600/30 text-ivory-200 text-sm font-medium hover:border-gold-500/30 transition-all no-tap-highlight"
            >
              {chapter} <ChevronDown size={14} className="text-ivory-500" />
            </button>
            <button
              onClick={handleNextChapter}
              disabled={!getNextChapter(book, chapter)}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-ink-800/40 border border-ink-600/30 text-ivory-300 hover:border-gold-500/30 transition-all no-tap-highlight disabled:opacity-30"
              aria-label="Next chapter"
            >
              <ChevronRight size={18} />
            </button>
            <div className="flex-1" />
            <button
              onClick={() => { vibrate(5); setShowVersionSheet(true); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-ink-800/40 border border-ink-600/30 text-ivory-300 text-xs font-medium hover:border-gold-500/30 transition-all no-tap-highlight"
            >
              {translation} <ChevronDown size={12} className="text-ivory-500" />
            </button>
            <button
              onClick={() => { vibrate(5); setShowStudyMenu(!showStudyMenu); }}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-ink-800/40 border border-ink-600/30 text-ivory-400 hover:text-ivory-100 hover:border-gold-500/30 transition-all no-tap-highlight"
              aria-label="Study menu"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        )}

        {showStudyMenu && view === 'reader' && !chapterMarkingMode && (
          <div className="mt-2 rounded-xl bg-ink-800/90 border border-ink-600/40 p-2 animate-fade-in">
            <button
              onClick={() => { vibrate(5); setShowStudyMenu(false); setView('bookmarks'); }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-ivory-300 text-sm hover:bg-ink-700/40 no-tap-highlight transition-colors"
            >
              <Bookmark size={15} /> Bookmarks
            </button>
            <button
              onClick={() => { vibrate(5); setShowStudyMenu(false); setView('notes'); }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-ivory-300 text-sm hover:bg-ink-700/40 no-tap-highlight transition-colors"
            >
              <Library size={15} /> Notes
            </button>
            <button
              onClick={() => { vibrate(5); setShowStudyMenu(false); setView('keywords'); }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-ivory-300 text-sm hover:bg-ink-700/40 no-tap-highlight transition-colors"
            >
              <Tag size={15} /> Marking Key
            </button>
            <button
              onClick={() => { vibrate(5); setShowStudyMenu(false); setShowTextSize(!showTextSize); }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-ivory-300 text-sm hover:bg-ink-700/40 no-tap-highlight transition-colors"
            >
              <Type size={15} /> Text Size
            </button>
            <button
              onClick={() => { vibrate(5); setShowStudyMenu(false); setShowVersionSheet(true); }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-ivory-300 text-sm hover:bg-ink-700/40 no-tap-highlight transition-colors"
            >
              <Info size={15} /> Translation Info
            </button>
            <button
              onClick={() => {
                vibrate(8);
                setShowStudyMenu(false);
                if (keywords.length === 0) {
                  setMarkingMode(true);
                  setMarkingVerse(null);
                  setMarkPhase('idle');
                  setShowSetupSheet(true);
                  setChapterMarkingMode(false);
                } else {
                  setChapterMarkingMode(true);
                  setActiveKeyId(keywords[0].id);
                  setMarkingMode(false);
                  setMarkingVerse(null);
                  setTokenSelStart(null);
                  setTokenSelEnd(null);
                  setMarkPhase('idle');
                  setShowActions(false);
                  setSelection(null);
                }
              }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-ivory-300 text-sm hover:bg-ink-700/40 no-tap-highlight transition-colors"
            >
              <Tag size={15} /> Chapter Marking
            </button>
          </div>
        )}
      </header>

      {error && view === 'reader' && !loading && (
        <div className="mx-6 mt-4 px-4 py-4 rounded-xl bg-error/10 border border-error/30 text-center">
          <p className="text-error text-sm mb-3">{error}</p>
          <button
            onClick={() => loadChapter(book, chapter)}
            className="btn-primary text-sm"
          >
            <RotateCw size={14} /> Try Again
          </button>
        </div>
      )}
      {error && view !== 'reader' && (
        <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-error/10 border border-error/30">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      {/* READER VIEW */}
      {view === 'reader' && (
        <div ref={scrollRef} className="px-6 mt-6">
          {loading ? (
            <div className="flex items-center gap-2.5 py-8">
              <div className="w-1.5 h-1.5 rounded-full bg-gold-400/60 animate-breathe" />
              <p className="text-ivory-500 text-sm italic">Loading Scripture...</p>
            </div>
          ) : verses.length === 0 ? (
            <p className="text-ivory-500 text-sm py-8">No verses found for this chapter.</p>
          ) : (
            <>
              <h2 className="font-serif text-2xl text-gold-300 mb-5 tracking-tight">
                {getBookDisplayName(book, translation)} {chapter}
              </h2>
              <div className="space-y-1">
                {verses.map((v) => {
                  const selected = isVerseSelected(v.verse);
                  const hl = getWholeVerseHighlight(v.verse);
                  const noteCount = getNoteCountForVerse(v.verse);
                  const km = getKeywordMarkForVerse(v.verse);
                  const hlColor = hl ? HIGHLIGHT_COLORS.find((c) => c.key === hl.color_key) : null;
                  const tokenHls = getTokenHighlightsForVerse(v.verse);

                  return (
                    <div
                      key={v.verse}
                      ref={(el) => {
                        if (el) verseRefs.current.set(v.verse, el);
                        else verseRefs.current.delete(v.verse);
                      }}
                      onClick={() => handleVerseTap(v.verse)}
                      className={`flex gap-2.5 rounded-lg px-2 -mx-2 py-1 cursor-pointer transition-all no-tap-highlight ${
                        selected ? 'bg-gold-500/10 ring-1 ring-gold-500/30' : ''
                      } ${passageEmphasis && v.verse >= passageEmphasis.verseStart && v.verse <= passageEmphasis.verseEnd && !selected ? 'bg-gold-500/5 ring-1 ring-gold-500/20' : ''} ${hlColor ? hlColor.class : ''} ${!selected && !hlColor && !(passageEmphasis && v.verse >= passageEmphasis.verseStart && v.verse <= passageEmphasis.verseEnd) ? 'hover:bg-ink-800/20' : ''}`}
                    >
                      <div className="flex flex-col items-center pt-0.5 shrink-0 w-7">
                        <span className={`text-[11px] font-medium ${selected ? 'text-gold-300' : 'text-ivory-600'}`}>
                          {v.verse}
                        </span>
                        {noteCount > 0 && (
                          <button
                            className="text-[9px] mt-0.5 no-tap-highlight"
                            title={`${noteCount} note(s)`}
                            onClick={(e) => {
                              e.stopPropagation();
                              vibrate(5);
                              const existingNote = notes.find(
                                (n) => v.verse >= n.verse_start && v.verse <= n.verse_end,
                              );
                              const sel: VerseSelection = { book, chapter, verseStart: v.verse, verseEnd: v.verse };
                              setNoteEditorState({ sel, existing: existingNote });
                              setView('note_editor');
                            }}
                          >
                            <StickyNote size={10} className="text-gold-400/70" />
                          </button>
                        )}
                        {km && (
                          <span className="text-[9px] mt-0.5" title="Keyword marked">
                            <Tag size={9} className="text-blue-400/70" />
                          </span>
                        )}
                      </div>
                      <ScriptureVerseText
                        verseNumber={v.verse}
                        text={v.text}
                        textSizeClass={textSizeClass}
                        marks={keywordMarks.filter((km) => km.verse === v.verse)}
                        keywords={keywords}
                        markingMode={chapterMarkingMode || (markingMode && markingVerse === v.verse)}
                        highlightWordMode={showHighlightPicker && highlightMode === 'word' && selection !== null && selection.verseStart === v.verse}
                        highlightWordSelToken={highlightWordSel}
                        highlightWordEndToken={highlightWordEnd}
                        tokenHighlights={tokenHls}
                        selectionStartToken={
                          chapterMarkingMode
                            ? tokenSelStart
                            : markingVerse === v.verse ? tokenSelStart : null
                        }
                        selectionEndToken={
                          chapterMarkingMode
                            ? tokenSelEnd
                            : markingVerse === v.verse ? tokenSelEnd : null
                        }
                        adjustMode={adjustMode}
                        onTokenTap={(verse, tokenIndex) => {
                          vibrate(5);
                          if (showHighlightPicker && highlightMode === 'word' && selection && selection.verseStart === verse) {
                            if (highlightWordPhase === 'idle' || highlightWordPhase === 'ready') {
                              setHighlightWordSel(tokenIndex);
                              setHighlightWordEnd(null);
                              setHighlightWordPhase('awaiting_end');
                            } else if (highlightWordPhase === 'awaiting_end') {
                              if (highlightWordSel === tokenIndex) {
                                setHighlightWordEnd(tokenIndex);
                                setHighlightWordPhase('ready');
                              } else {
                                setHighlightWordEnd(tokenIndex);
                                setHighlightWordPhase('ready');
                              }
                            }
                            return;
                          }
                          if (chapterMarkingMode) {
                            if (adjustMode) {
                              if (markPhase === 'awaiting_start') {
                                setMarkingVerse(verse);
                                setTokenSelStart(tokenIndex);
                                setTokenSelEnd(null);
                                setMarkPhase('awaiting_end');
                              } else if (markPhase === 'awaiting_end') {
                                if (markingVerse !== null && verse !== markingVerse) {
                                  setMarkingVerse(verse);
                                  setTokenSelStart(tokenIndex);
                                  setTokenSelEnd(null);
                                  setMarkPhase('awaiting_end');
                                } else {
                                  setTokenSelEnd(tokenIndex);
                                  setMarkPhase('range_selected');
                                  setAdjustMode(false);
                                }
                              }
                              return;
                            }
                            if (rapidMode && activeKey) {
                              performRapidMark(verse, tokenIndex, tokenIndex);
                              return;
                            }
                            if (activeKey) {
                              if (tokenSelStart === null) {
                                setMarkingVerse(verse);
                                setTokenSelStart(tokenIndex);
                                setTokenSelEnd(null);
                                setMarkPhase('awaiting_end');
                              } else if (tokenSelEnd === null) {
                                if (markingVerse !== null && verse !== markingVerse) {
                                  setMarkingVerse(verse);
                                  setTokenSelStart(tokenIndex);
                                  setTokenSelEnd(null);
                                  setMarkPhase('awaiting_end');
                                } else {
                                  setTokenSelEnd(tokenIndex);
                                  setMarkPhase('range_selected');
                                }
                              } else {
                                setMarkingVerse(verse);
                                setTokenSelStart(tokenIndex);
                                setTokenSelEnd(null);
                                setMarkPhase('awaiting_end');
                              }
                            } else {
                              setMarkSaveError(true);
                            }
                            return;
                          }
                          if (adjustMode) {
                            if (markPhase === 'awaiting_start') {
                              setMarkingVerse(verse);
                              setTokenSelStart(tokenIndex);
                              setTokenSelEnd(null);
                              setMarkPhase('awaiting_end');
                            } else if (markPhase === 'awaiting_end') {
                              if (markingVerse !== null && verse !== markingVerse) {
                                setMarkingVerse(verse);
                                setTokenSelStart(tokenIndex);
                                setTokenSelEnd(null);
                                setMarkPhase('awaiting_end');
                              } else {
                                setTokenSelEnd(tokenIndex);
                                setMarkPhase('range_selected');
                                setAdjustMode(false);
                              }
                            }
                            return;
                          }
                          if (tokenSelStart === null) {
                            setMarkingVerse(verse);
                            setTokenSelStart(tokenIndex);
                            setTokenSelEnd(null);
                            setMarkPhase('awaiting_end');
                          } else if (tokenSelEnd === null) {
                            if (markingVerse !== null && verse !== markingVerse) {
                              setMarkingVerse(verse);
                              setTokenSelStart(tokenIndex);
                              setTokenSelEnd(null);
                              setMarkPhase('awaiting_end');
                            } else {
                              setTokenSelEnd(tokenIndex);
                              setMarkPhase('range_selected');
                            }
                          } else {
                            setMarkingVerse(verse);
                            setTokenSelStart(tokenIndex);
                            setTokenSelEnd(null);
                            setMarkPhase('awaiting_end');
                          }
                        }}
                        onMarkedTokenTap={(markId) => {
                          vibrate(5);
                          if (chapterMarkingMode) {
                            setMarkDetailId(markId);
                          } else {
                            setMarkRemoveId(markId);
                          }
                        }}
                        onHighlightTokenTap={(highlightId) => {
                          vibrate(5);
                          setHighlightActionId(highlightId);
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Prev/Next */}
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-ink-700/20">
                <button
                  onClick={handlePrevChapter}
                  disabled={!getPrevChapter(book, chapter)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-ink-800/40 border border-ink-600/30 text-ivory-300 text-sm hover:border-gold-500/30 transition-all no-tap-highlight disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                  {getPrevChapter(book, chapter) ? `${getBookDisplayName(getPrevChapter(book, chapter)!.book, translation)} ${getPrevChapter(book, chapter)!.chapter}` : 'Previous'}
                </button>
                <button
                  onClick={handleNextChapter}
                  disabled={!getNextChapter(book, chapter)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-ink-800/40 border border-ink-600/30 text-ivory-300 text-sm hover:border-gold-500/30 transition-all no-tap-highlight disabled:opacity-30"
                >
                  {getNextChapter(book, chapter) ? `${getBookDisplayName(getNextChapter(book, chapter)!.book, translation)} ${getNextChapter(book, chapter)!.chapter}` : 'Next'}
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Chapter note shortcut */}
              <button
                onClick={() => setView('chapter_notes')}
                className="mt-4 w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-ink-800/30 border border-ink-600/20 text-ivory-400 text-sm hover:border-gold-500/30 transition-all no-tap-highlight"
              >
                <StickyNote size={15} className="text-gold-400/60" />
                {chapterNote ? 'Edit Chapter Notes' : '+ Chapter Notes'}
              </button>
            </>
          )}

          {/* Verse action bar — rendered above BottomNav and safe area */}
          {showActions && selection && (
            <div className="fixed left-0 right-0 z-[60] flex justify-center px-4 animate-fade-in-up" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}>
              <div className="w-full max-w-lg bg-ink-800/95 backdrop-blur-md border border-ink-600/40 rounded-2xl p-3 shadow-xl shadow-ink-950/50">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-gold-300 text-sm font-medium font-serif">
                    {formatReference(selection, translation)}
                  </p>
                  <button onClick={() => { setShowActions(false); setSelection(null); }} className="text-ivory-500">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowKeywordPicker(false); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-300 text-xs font-medium hover:border-gold-500/30 transition-all no-tap-highlight">
                    <Highlighter size={13} /> Highlight
                  </button>
                  <button onClick={handleNote} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-300 text-xs font-medium hover:border-gold-500/30 transition-all no-tap-highlight">
                    <StickyNote size={13} /> Note
                  </button>
                  <button onClick={handleStudy} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-300 text-xs font-medium hover:border-gold-500/30 transition-all no-tap-highlight">
                    <BookOpen size={13} /> Study
                  </button>
                  <button onClick={handleAsk} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-300 text-xs font-medium hover:border-gold-500/30 transition-all no-tap-highlight">
                    <Send size={13} /> Ask
                  </button>
                  <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-300 text-xs font-medium hover:border-gold-500/30 transition-all no-tap-highlight">
                    <Copy size={13} /> Copy
                  </button>
                  <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-300 text-xs font-medium hover:border-gold-500/30 transition-all no-tap-highlight">
                    <Share size={13} /> Share
                  </button>
                  <button
                    onClick={handleBookmark}
                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all no-tap-highlight min-h-[44px] ${
                      bookmarks.some((bm) => bm.book === selection.book && bm.chapter === selection.chapter && bm.verse_start === selection.verseStart && bm.verse_end === selection.verseEnd)
                        ? 'bg-gold-500/20 border-gold-500/40 text-gold-200'
                        : 'bg-ink-700/40 border-ink-600/30 text-ivory-300 hover:border-gold-500/30'
                    }`}
                  >
                    {bookmarks.some((bm) => bm.book === selection.book && bm.chapter === selection.chapter && bm.verse_start === selection.verseStart && bm.verse_end === selection.verseEnd)
                      ? <><Bookmark size={14} className="fill-gold-300" /> Bookmarked</>
                      : <><Bookmark size={14} /> Bookmark</>}
                  </button>
                  <button
                    onClick={async () => {
                      if (!selection) return;
                      vibrate(5);
                      setCrossRefLoading(true);
                      setShowCrossRefs(true);
                      setCrossRefLimit(8);
                      setCrossRefPreviews({});
                      const refs = await getCrossReferences(selection.book, selection.chapter, selection.verseStart);
                      setCrossRefData(refs);
                      setCrossRefLoading(false);
                      const previews: Record<string, string> = {};
                      const top = refs.slice(0, 8);
                      await Promise.all(top.map(async (r) => {
                        const parsed = parseReference(r.target);
                        if (parsed) {
                          const result = await fetchVerses(parsed.book, parsed.chapter, parsed.verse, parsed.verse, translation);
                          previews[r.target] = result.verses[0]?.text || '';
                        }
                      }));
                      setCrossRefPreviews(previews);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-300 text-xs font-medium hover:border-gold-500/30 transition-all no-tap-highlight min-h-[44px]"
                  >
                    <Link2 size={14} /> Cross Refs
                  </button>
                  <button onClick={() => {
                    if (!selection) return;
                    vibrate(8);
                    setMarkingMode(true);
                    setMarkingVerse(selection.verseStart);
                    setTokenSelStart(null);
                    setTokenSelEnd(null);
                    setAdjustMode(false);
                    setMarkPhase('awaiting_start');
                    setPendingKey(null);
                    setShowSetupSheet(false);
                    setShowInlineKeyCreator(false);
                    setShowKeywordPicker(false);
                    setShowHighlightPicker(false);
                  }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-300 text-xs font-medium hover:border-gold-500/30 transition-all no-tap-highlight">
                    <Tag size={13} /> Mark
                  </button>
                </div>

                {/* Highlight picker — Word/Phrase + Whole Verse modes */}
                {showHighlightPicker && (
                  <div className="mt-3 pt-3 border-t border-ink-700/30 animate-fade-in">
                    <div className="flex items-center gap-1 bg-ink-800/60 rounded-lg p-0.5 mb-2">
                      <button onClick={() => { setHighlightMode('word'); setHighlightWordSel(null); setHighlightWordEnd(null); setHighlightWordPhase('idle'); }} className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium no-tap-highlight transition-all ${highlightMode === 'word' ? 'bg-gold-500/20 text-gold-200' : 'text-ivory-500'}`}>Word / Phrase</button>
                      <button onClick={() => { setHighlightMode('verse'); setHighlightWordSel(null); setHighlightWordEnd(null); setHighlightWordPhase('idle'); }} className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium no-tap-highlight transition-all ${highlightMode === 'verse' ? 'bg-gold-500/20 text-gold-200' : 'text-ivory-500'}`}>Whole Verse</button>
                    </div>
                    {highlightMode === 'word' && highlightWordPhase === 'idle' && (
                      <p className="text-ivory-500 text-xs mb-2">Tap the first word to highlight</p>
                    )}
                    {highlightMode === 'word' && highlightWordPhase === 'awaiting_end' && highlightWordSel !== null && (
                      <div className="mb-2">
                        <p className="text-gold-200 text-xs font-serif italic mb-1">Selected: &ldquo;{(() => { const vd = verses.find(v => v.verse === selection?.verseStart); if (!vd || highlightWordSel === null) return ''; const t = tokenizeVerse(vd.text); return t[highlightWordSel]?.text || ''; })()}&rdquo;</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { vibrate(5); setHighlightWordSel(null); setHighlightWordEnd(null); setHighlightWordPhase('idle'); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-300 text-xs no-tap-highlight hover:border-gold-500/30 transition-all min-h-[36px]">
                            <X size={12} /> Cancel Selection
                          </button>
                          <button onClick={() => { vibrate(5); setHighlightWordEnd(highlightWordSel); setHighlightWordPhase('ready'); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold-500/20 border border-gold-500/40 text-gold-200 text-xs font-medium no-tap-highlight hover:bg-gold-500/30 transition-all min-h-[36px]">
                            <Check size={12} /> Highlight This Word
                          </button>
                        </div>
                      </div>
                    )}
                    {highlightMode === 'word' && highlightWordPhase === 'ready' && highlightWordSel !== null && (
                      <div className="mb-2">
                        <p className="text-gold-200 text-xs font-serif italic mb-1">&ldquo;{(() => { const vd = verses.find(v => v.verse === selection?.verseStart); if (!vd || highlightWordSel === null) return ''; const t = tokenizeVerse(vd.text); const endT = highlightWordEnd !== null ? highlightWordEnd : highlightWordSel; return getSelectedText(t, Math.min(highlightWordSel, endT), Math.max(highlightWordSel, endT)).trim(); })()}&rdquo;</p>
                        <button onClick={() => { vibrate(5); setHighlightWordSel(null); setHighlightWordEnd(null); setHighlightWordPhase('idle'); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-300 text-xs no-tap-highlight hover:border-gold-500/30 transition-all min-h-[36px]">
                          <X size={12} /> Clear Selection
                        </button>
                      </div>
                    )}
                    {((highlightMode === 'word' && highlightWordPhase === 'ready') || highlightMode === 'verse') && (() => {
                      const existingVerseHl = highlights.find(h => h.verse_start === selection!.verseStart && h.verse_end === selection!.verseEnd && h.token_start === null);
                      const existing = existingVerseHl;
                      return (
                      <div className="flex items-center gap-2 flex-wrap">
                        {HIGHLIGHT_COLORS.map((c) => (
                          <button key={c.key} onClick={() => handleHighlight(c.key)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${c.class} text-xs font-medium no-tap-highlight transition-all min-h-[36px]`}>
                            <div className={`w-3 h-3 rounded-full ${c.dot}`} />
                            {existing && existing.color_key === c.key ? '✓ ' : ''}{c.label}
                          </button>
                        ))}
                        {existing && (
                        <button onClick={async () => {
                          if (!selection) return;
                          vibrate(8);
                          setHighlightRemoveError(false);
                          const ok = await removeHighlight(existing.id);
                          if (ok) {
                            setHighlights(prev => prev.filter(h => h.id !== existing.id));
                            setShowHighlightPicker(false);
                            setHighlightWordSel(null);
                            setHighlightWordEnd(null);
                            setHighlightWordPhase('idle');
                          } else {
                            setHighlightRemoveError(true);
                          }
                        }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-error/30 bg-error/10 text-error text-xs font-medium no-tap-highlight transition-all min-h-[36px]">
                          <Trash2 size={12} /> Remove Highlight
                        </button>
                        )}
                      </div>
                      );
                    })()}
                  </div>
                )}

                {/* Save error inline */}
                {(highlightSaveError || highlightRemoveError || bookmarkSaveError) && (
                  <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-error/10 border border-error/30">
                    <AlertCircle size={14} className="text-error shrink-0" />
                    <p className="text-error text-xs">{highlightRemoveError ? 'Unable to remove highlight. Try Again.' : 'Could not save. Please try again.'}</p>
                  </div>
                )}

                {/* Scripture Marking mode UI */}
                {markingMode && markingVerse !== null && !showInlineKeyCreator && (
                  <div className="mt-3 pt-3 border-t border-ink-700/30 animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gold-300 text-xs font-medium">
                        {markPhase === 'awaiting_start' && (adjustMode ? 'Tap a new first word' : 'Tap the first word')}
                        {markPhase === 'awaiting_end' && (adjustMode ? 'Tap a new last word' : 'Now tap the last word')}
                        {markPhase === 'range_selected' && 'Selection ready'}
                        {markPhase === 'choosing_key' && 'Confirm your mark'}
                        {markPhase === 'saving' && 'Saving...'}
                        {markPhase === 'idle' && 'Tap the first word'}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            vibrate(5);
                            if (markPhase === 'awaiting_end' && tokenSelStart !== null && tokenSelEnd === null) {
                              setTokenSelStart(null);
                              setMarkPhase('idle');
                            } else if (markPhase === 'range_selected') {
                              if (tokenSelEnd !== null) {
                                setTokenSelEnd(null);
                                setMarkPhase('awaiting_end');
                              } else {
                                setTokenSelStart(null);
                                setMarkPhase('idle');
                              }
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-300 text-xs no-tap-highlight hover:border-gold-500/30 transition-all min-h-[36px]"
                        >
                          <RotateCw size={12} /> Undo
                        </button>
                        {(markPhase === 'range_selected' || (markPhase === 'awaiting_end' && tokenSelStart !== null)) && (
                          <button
                            onClick={() => {
                              vibrate(5);
                              setTokenSelStart(null);
                              setTokenSelEnd(null);
                              setMarkPhase('idle');
                              setAdjustMode(false);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-300 text-xs no-tap-highlight hover:border-gold-500/30 transition-all min-h-[36px]"
                          >
                            <X size={12} /> Clear
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setMarkingMode(false);
                            setMarkingVerse(null);
                            setTokenSelStart(null);
                            setTokenSelEnd(null);
                            setAdjustMode(false);
                            setMarkPhase('idle');
                            setPendingKey(null);
                            setShowSetupSheet(false);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-500 text-xs no-tap-highlight hover:border-gold-500/30 transition-all min-h-[36px]"
                        >
                          <X size={12} /> Cancel
                        </button>
                      </div>
                    </div>

                    {/* Single word or phrase selected — show confirmation bar */}
                    {markPhase === 'range_selected' && markingVerse !== null && (
                      <div className="rounded-lg bg-gold-500/10 border border-gold-500/30 p-3 mb-2">
                        <p className="text-ivory-500 text-[10px] uppercase tracking-wider mb-1">Selected</p>
                        <p className="text-gold-100 text-sm font-serif italic mb-3">
                          &ldquo;{(() => {
                            const vd = verses.find((v) => v.verse === markingVerse);
                            if (!vd || tokenSelStart === null || tokenSelEnd === null) return '';
                            return getSelectedText(tokenizeVerse(vd.text), tokenSelStart, tokenSelEnd).trim();
                          })()}&rdquo;
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              vibrate(5);
                              setAdjustMode(true);
                              setMarkPhase('awaiting_start');
                              setTokenSelStart(null);
                              setTokenSelEnd(null);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-300 text-xs no-tap-highlight hover:border-gold-500/30 transition-all"
                          >
                            <RotateCw size={12} /> Adjust
                          </button>
                          <button
                            onClick={() => {
                              vibrate(5);
                              if (keywords.length === 0) {
                                setShowSetupSheet(true);
                              } else {
                                setMarkPhase('choosing_key');
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-500/20 border border-gold-500/40 text-gold-200 text-xs font-medium no-tap-highlight hover:bg-gold-500/30 transition-all"
                          >
                            <Check size={12} /> Continue
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Single word — show Mark This Word option */}
                    {markPhase === 'awaiting_end' && tokenSelStart !== null && tokenSelEnd === null && markingVerse !== null && !adjustMode && (
                      <div className="rounded-lg bg-gold-500/10 border border-gold-500/30 p-3 mb-2">
                        <p className="text-ivory-500 text-[10px] uppercase tracking-wider mb-1">Selected</p>
                        <p className="text-gold-100 text-sm font-serif italic mb-1">
                          &ldquo;{(() => {
                            const vd = verses.find((v) => v.verse === markingVerse);
                            if (!vd || tokenSelStart === null) return '';
                            const tokens = tokenizeVerse(vd.text);
                            return tokens[tokenSelStart]?.text || '';
                          })()}&rdquo;
                        </p>
                        <p className="text-ivory-500 text-[11px] mb-3">Tap another word to extend the selection.</p>
                        <button
                          onClick={() => {
                            vibrate(5);
                            setTokenSelEnd(tokenSelStart);
                            setMarkPhase('range_selected');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-500/20 border border-gold-500/40 text-gold-200 text-xs font-medium no-tap-highlight hover:bg-gold-500/30 transition-all"
                        >
                          <Check size={12} /> Mark This Word
                        </button>
                      </div>
                    )}

                    {/* Setup sheet for first-time users */}
                    {showSetupSheet && (
                      <div className="rounded-lg bg-ink-700/40 border border-ink-600/30 p-3 mb-2 animate-fade-in">
                        <p className="text-gold-300 text-sm font-medium font-serif mb-1">Set Up Your Marking Key</p>
                        <p className="text-ivory-400 text-xs mb-3 leading-relaxed">
                          Create a simple marking key so you can visually identify important words and ideas as you study Scripture.
                        </p>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={async () => {
                              vibrate(8);
                              const starterDefs: { name: string; color: HighlightColor; style: MarkStyle; symbol: string | null }[] = [
                                { name: 'God', color: 'gold', style: 'oval', symbol: '✦' },
                                { name: 'Jesus Christ', color: 'red', style: 'double_underline', symbol: '+' },
                                { name: 'Holy Spirit', color: 'teal', style: 'symbol_underline', symbol: 'icon:flame' },
                                { name: 'Commands', color: 'amber', style: 'box', symbol: '!' },
                                { name: 'Time', color: 'blue', style: 'oval', symbol: 'icon:clock' },
                                { name: 'Places', color: 'green', style: 'double_underline', symbol: 'icon:map-pin' },
                                { name: 'Key / Repeated Words', color: 'gold', style: 'highlight', symbol: '★' },
                                { name: 'Contrast / Conclusion', color: 'violet', style: 'slash', symbol: '→' },
                              ];
                              const created: BibleKeyword[] = [];
                              for (const def of starterDefs) {
                                const kw = await saveKeyword(def.name, def.color, def.style, def.symbol, null);
                                if (kw) created.push(kw);
                              }
                              if (created.length > 0) {
                                setKeywords((prev) => [...prev, ...created]);
                                setShowSetupSheet(false);
                                setMarkPhase('choosing_key');
                              }
                            }}
                            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gold-500/20 border border-gold-500/40 text-gold-200 text-xs font-medium no-tap-highlight hover:bg-gold-500/30 transition-all"
                          >
                            <Check size={13} /> Use SOLAPATH Starter Key
                          </button>
                          <button
                            onClick={() => {
                              vibrate(5);
                              setShowSetupSheet(false);
                              setShowInlineKeyCreator(true);
                              setInlineKeyName('');
                              setInlineKeyColor('gold');
                              setInlineKeyStyle('underline');
                              setInlineKeySymbol('');
                            }}
                            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-300 text-xs no-tap-highlight hover:border-gold-500/30 transition-all"
                          >
                            <Type size={13} /> Create My Own
                          </button>
                          <button
                            onClick={() => {
                              setShowSetupSheet(false);
                            }}
                            className="text-ivory-500 text-xs py-1 no-tap-highlight"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Choosing key phase */}
                    {markPhase === 'choosing_key' && !showSetupSheet && (
                      <div>
                        <p className="text-ivory-500 text-[10px] uppercase tracking-wider mb-1">Mark</p>
                        <p className="text-gold-100 text-sm font-serif italic mb-2">
                          &ldquo;{(() => {
                            const vd = verses.find((v) => v.verse === markingVerse);
                            if (!vd || tokenSelStart === null || tokenSelEnd === null) return '';
                            return getSelectedText(tokenizeVerse(vd.text), tokenSelStart, tokenSelEnd).trim();
                          })()}&rdquo;
                        </p>
                        <p className="text-ivory-500 text-xs mb-2">Choose a Marking Key:</p>
                        <div className="flex flex-wrap gap-2">
                          {keywords.map((kw) => (
                            <button
                              key={kw.id}
                              onClick={() => {
                                vibrate(5);
                                setPendingKey(kw);
                                setMarkPhase('saving');
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs no-tap-highlight transition-all ${
                                pendingKey?.id === kw.id
                                  ? 'bg-gold-500/30 border-gold-500/50 text-gold-100'
                                  : 'bg-ink-700/40 border-ink-600/30 text-ivory-300 hover:border-gold-500/30'
                              }`}
                            >
                              <div className={`w-2.5 h-2.5 rounded-full ${HIGHLIGHT_COLORS.find((c) => c.key === kw.color_key)?.dot || 'bg-gold-400'}`} />
                              {kw.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Final save confirmation */}
                    {markPhase === 'saving' && pendingKey && markingVerse !== null && (
                      <div className="rounded-lg bg-gold-500/10 border border-gold-500/30 p-3 mb-2">
                        <p className="text-gold-100 text-sm font-serif italic mb-2">
                          &ldquo;{(() => {
                            const vd = verses.find((v) => v.verse === markingVerse);
                            if (!vd || tokenSelStart === null || tokenSelEnd === null) return '';
                            return getSelectedText(tokenizeVerse(vd.text), tokenSelStart, tokenSelEnd).trim();
                          })()}&rdquo;
                        </p>
                        <p className="text-ivory-500 text-[10px] uppercase tracking-wider mb-1">Marking Key</p>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-3 h-3 rounded-full ${HIGHLIGHT_COLORS.find((c) => c.key === pendingKey.color_key)?.dot || 'bg-gold-400'}`} />
                          <span className="text-ivory-200 text-sm">{pendingKey.name}</span>
                          {pendingKey.symbol && <span className="text-gold-400 text-sm">{pendingKey.symbol}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              if (!selection || markingVerse === null || tokenSelStart === null || tokenSelEnd === null) return;
                              vibrate(8);
                              setMarkSaveError(false);

                              const verseData = verses.find((v) => v.verse === markingVerse);
                              if (!verseData) return;
                              const tokens = tokenizeVerse(verseData.text);
                              const selText = getSelectedText(tokens, tokenSelStart, tokenSelEnd);
                              const startTok = Math.min(tokenSelStart, tokenSelEnd);
                              const endTok = Math.max(tokenSelStart, tokenSelEnd);
                              const startOff = tokens[startTok].startOffset;
                              const endOff = tokens[endTok].endOffset;

                              const existingWordMarks = keywordMarks.filter(
                                (km) => km.verse === markingVerse && km.token_start !== null && km.token_end !== null,
                              );
                              const hasOverlap = existingWordMarks.some((km) =>
                                rangesOverlap(startTok, endTok, km.token_start!, km.token_end!),
                              );
                              if (hasOverlap) {
                                setMarkSaveError(true);
                                setMarkPhase('choosing_key');
                                return;
                              }

                              const mark = await saveKeywordMark(
                                pendingKey.id,
                                selection.book,
                                selection.chapter,
                                markingVerse,
                                translation,
                                {
                                  selectedText: selText,
                                  tokenStart: startTok,
                                  tokenEnd: endTok,
                                  startOffset: startOff,
                                  endOffset: endOff,
                                },
                              );
                              if (mark) {
                                setKeywordMarks((prev) => [...prev, mark]);
                                setMarkingMode(false);
                                setMarkingVerse(null);
                                setTokenSelStart(null);
                                setTokenSelEnd(null);
                                setAdjustMode(false);
                                setMarkPhase('idle');
                                setPendingKey(null);
                                setShowActions(false);
                                setSelection(null);
                              } else {
                                setMarkSaveError(true);
                                setMarkPhase('choosing_key');
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-500/30 border border-gold-500/50 text-gold-100 text-xs font-medium no-tap-highlight hover:bg-gold-500/40 transition-all"
                          >
                            <Check size={12} /> Save Mark
                          </button>
                          <button
                            onClick={() => {
                              vibrate(5);
                              setPendingKey(null);
                              setMarkPhase('choosing_key');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-400 text-xs no-tap-highlight"
                          >
                            Back
                          </button>
                        </div>
                      </div>
                    )}

                    {markSaveError && (
                      <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-error/10 border border-error/30">
                        <AlertCircle size={14} className="text-error shrink-0" />
                        <p className="text-error text-xs">
                          {keywordMarks.some((km) => km.verse === markingVerse && km.token_start !== null && km.token_end !== null)
                            ? 'This text already contains a Scripture marking. Remove the existing mark before applying another.'
                            : 'Unable to save Scripture marking. Try Again.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Inline key creator — preserves pending selection */}
                {markingMode && showInlineKeyCreator && !chapterMarkingMode && (
                  <div className="mt-3 pt-3 border-t border-ink-700/30 animate-fade-in">
                    <p className="text-gold-300 text-sm font-medium font-serif mb-2">Create Marking Key</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-ivory-500 text-[10px] uppercase tracking-wider mb-1 block">Name</label>
                        <input
                          type="text"
                          value={inlineKeyName}
                          onChange={(e) => setInlineKeyName(e.target.value)}
                          placeholder="e.g. Grace"
                          className="w-full px-3 py-2 rounded-lg bg-ink-800/60 border border-ink-600/40 text-ivory-100 text-sm placeholder:text-ivory-700 focus:outline-none focus:border-gold-500/40"
                        />
                      </div>
                      <div>
                        <label className="text-ivory-500 text-[10px] uppercase tracking-wider mb-1 block">Color</label>
                        <div className="flex gap-2">
                          {HIGHLIGHT_COLORS.map((c) => (
                            <button
                              key={c.key}
                              onClick={() => setInlineKeyColor(c.key)}
                              className={`w-8 h-8 rounded-full ${c.dot} border-2 transition-all ${inlineKeyColor === c.key ? 'border-ivory-200 scale-110' : 'border-transparent'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-ivory-500 text-[10px] uppercase tracking-wider mb-1 block">Mark Style</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {MARK_STYLES.filter((s) => s.key !== 'circle').map((s) => {
                            const previewCls = getMarkStyleClasses(s.key, inlineKeyColor, inlineKeySymbol || '★');
                            return (
                              <button
                                key={s.key}
                                onClick={() => {
                                  setInlineKeyStyle(s.key);
                                  if (s.key === 'symbol' || s.key === 'symbol_underline' || s.key === 'symbol_highlight') {
                                    setShowSymbolPicker(true);
                                  }
                                }}
                                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs no-tap-highlight transition-all ${inlineKeyStyle === s.key ? 'bg-gold-500/20 border-gold-500/40 text-gold-200' : 'bg-ink-700/40 border-ink-600/30 text-ivory-400'}`}
                              >
                                <span className={`font-serif ${previewCls.className}`}>
                                  Word
                                  {previewCls.badge && <sup className="ml-0.5 text-[0.6em]">{previewCls.badge}</sup>}
                                </span>
                                <span className="text-[10px] text-ivory-600">{s.label}</span>
                              </button>
                            );
                          })}
                        </div>
                        {isSingleWordStyle(inlineKeyStyle) && (
                          <p className="text-ivory-600 text-[10px] mt-1">{getStyleDescription(inlineKeyStyle)}</p>
                        )}
                      </div>
                      {(inlineKeyStyle === 'symbol' || inlineKeyStyle === 'symbol_underline' || inlineKeyStyle === 'symbol_highlight') && (
                        <div>
                          <label className="text-ivory-500 text-[10px] uppercase tracking-wider mb-1 block">Symbol</label>
                          <SymbolPicker
                            selectedSymbol={inlineKeySymbol}
                            onSelect={(sym) => { setInlineKeySymbol(sym); setShowSymbolPicker(false); }}
                          />
                        </div>
                      )}
                      {/* Large live Scripture preview */}
                      <div className="rounded-xl bg-ink-900/60 border border-ink-700/30 p-3">
                        <p className="text-ivory-600 text-[10px] uppercase tracking-wider mb-2">Live Preview</p>
                        <p className="font-serif text-[18px] leading-[1.7] text-ivory-100">
                          the Word was{' '}
                          <span className={getMarkStyleClasses(inlineKeyStyle, inlineKeyColor, inlineKeySymbol || '★').className}>
                            God
                            {getMarkStyleClasses(inlineKeyStyle, inlineKeyColor, inlineKeySymbol || '★').badge && (
                              <sup className="ml-0.5 text-[0.7em] font-bold">{inlineKeySymbol || '★'}</sup>
                            )}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            if (!inlineKeyName.trim()) return;
                            vibrate(8);
                            setInlineKeySaving(true);
                            const sym = (inlineKeyStyle === 'symbol' || inlineKeyStyle === 'symbol_underline' || inlineKeyStyle === 'symbol_highlight')
                              ? (inlineKeySymbol.trim() || '★')
                              : null;
                            const saved = await saveKeyword(
                              inlineKeyName.trim(),
                              inlineKeyColor,
                              inlineKeyStyle,
                              sym,
                              null,
                            );
                            if (saved) {
                              setKeywords((prev) => [...prev, saved]);
                              setShowInlineKeyCreator(false);
                              setInlineKeyName('');
                              setInlineKeySymbol('');
                              setInlineKeySaving(false);
                              setMarkPhase('choosing_key');
                            } else {
                              setInlineKeySaving(false);
                            }
                          }}
                          disabled={!inlineKeyName.trim() || inlineKeySaving}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold-500/20 border border-gold-500/40 text-gold-200 text-xs font-medium no-tap-highlight hover:bg-gold-500/30 transition-all disabled:opacity-40"
                        >
                          <Check size={13} /> {inlineKeySaving ? 'Saving...' : 'Save Key'}
                        </button>
                        <button
                          onClick={() => {
                            setShowInlineKeyCreator(false);
                            setInlineKeyName('');
                            setInlineKeySymbol('');
                          }}
                          className="px-3 py-2 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-400 text-xs no-tap-highlight"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mark removal prompt */}
                {markRemoveId && (
                  <div className="mt-3 pt-3 border-t border-ink-700/30 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <p className="text-ivory-400 text-xs">Remove this Scripture marking?</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            vibrate(8);
                            const ok = await removeKeywordMark(markRemoveId);
                            if (ok) {
                              setKeywordMarks((prev) => prev.filter((km) => km.id !== markRemoveId));
                            }
                            setMarkRemoveId(null);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error/20 border border-error/40 text-error text-xs font-medium no-tap-highlight"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                        <button
                          onClick={() => setMarkRemoveId(null)}
                          className="px-3 py-1.5 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-400 text-xs no-tap-highlight"
                        >
                          Keep
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Token highlight action sheet (tap saved word/phrase highlight) */}
                {highlightOverlapId && (() => {
                  const hl = highlights.find((h) => h.id === highlightOverlapId);
                  if (!hl) return null;
                  return (
                    <div className="mt-3 pt-3 border-t border-ink-700/30 animate-fade-in">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-ivory-500 text-[10px] uppercase tracking-wider">Already Highlighted</p>
                          <p className="text-gold-100 text-sm font-serif italic">&ldquo;{hl.selected_text || 'text'}&rdquo;</p>
                        </div>
                        <button onClick={() => setHighlightOverlapId(null)} className="text-ivory-500">
                          <X size={16} />
                        </button>
                      </div>
                      <p className="text-ivory-400 text-xs mb-2">This text overlaps an existing highlight.</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            vibrate(5);
                            setHighlightOverlapId(null);
                            setHighlightActionId(hl.id);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-medium no-tap-highlight transition-all min-h-[36px]"
                        >
                          <Pencil size={12} /> Edit Existing Highlight
                        </button>
                        <button
                          onClick={() => {
                            vibrate(5);
                            setHighlightOverlapId(null);
                            setHighlightWordSel(null);
                            setHighlightWordEnd(null);
                            setHighlightWordPhase('idle');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-300 text-xs font-medium no-tap-highlight transition-all min-h-[36px]"
                        >
                          Choose Different Text
                        </button>
                        <button
                          onClick={() => setHighlightOverlapId(null)}
                          className="px-3 py-1.5 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-400 text-xs no-tap-highlight min-h-[36px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Keyword picker (legacy verse-level) */}
                {showKeywordPicker && !markingMode && (
                  <div className="mt-3 pt-3 border-t border-ink-700/30 animate-fade-in">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-ivory-500 text-xs">Mark keyword:</p>
                    </div>
                    {keywords.length === 0 ? (
                      <p className="text-ivory-600 text-xs">No keywords yet. Create keywords from the Keywords view.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {keywords.map((kw) => (
                          <button
                            key={kw.id}
                            onClick={async () => {
                              if (!selection) return;
                              vibrate(6);
                              const mark = await saveKeywordMark(kw.id, selection.book, selection.chapter, selection.verseStart, translation);
                              if (mark) {
                                setKeywordMarks((prev) => [...prev, mark]);
                              }
                              setShowKeywordPicker(false);
                              setShowActions(false);
                              setSelection(null);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-700/40 border border-ink-600/30 text-xs no-tap-highlight"
                          >
                            <div className={`w-2.5 h-2.5 rounded-full ${HIGHLIGHT_COLORS.find((c) => c.key === kw.color_key)?.dot || 'bg-gold-400'}`} />
                            {kw.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Standalone highlight action sheet — renders on direct token tap without verse preselection */}
      {highlightActionId && !showActions && (() => {
        const hl = highlights.find((h) => h.id === highlightActionId);
        if (!hl) return null;
        return (
          <div className="fixed left-0 right-0 z-[60] flex justify-center px-4 animate-fade-in-up" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}>
            <div className="w-full max-w-lg bg-ink-800/95 backdrop-blur-md border border-ink-600/40 rounded-2xl p-3 shadow-xl shadow-ink-950/50">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-ivory-500 text-[10px] uppercase tracking-wider">Highlighted</p>
                  <p className="text-gold-100 text-sm font-serif italic">
                    &ldquo;{hl.selected_text || 'word'}&rdquo;
                  </p>
                </div>
                <button onClick={() => setHighlightActionId(null)} className="text-ivory-500">
                  <X size={16} />
                </button>
              </div>
              <p className="text-ivory-500 text-[10px] uppercase tracking-wider mb-1.5">Change Color</p>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.key}
                    onClick={async () => {
                      if (c.key === hl.color_key) return;
                      vibrate(5);
                      setHighlightSaveError(false);
                      const ok = await updateHighlightColor(hl.id, c.key);
                      if (ok) {
                        setHighlights((prev) => prev.map((h) => h.id === hl.id ? { ...h, color_key: c.key } : h));
                        setHighlightActionId(null);
                      } else {
                        setHighlightSaveError(true);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${c.class} text-xs font-medium no-tap-highlight transition-all min-h-[36px]`}
                  >
                    <div className={`w-3 h-3 rounded-full ${c.dot}`} />
                    {hl.color_key === c.key ? '✓ ' : ''}{c.label}
                  </button>
                ))}
              </div>
              <button
                onClick={async () => {
                  vibrate(8);
                  setHighlightRemoveError(false);
                  const ok = await removeHighlight(hl.id);
                  if (ok) {
                    setHighlights((prev) => prev.filter((h) => h.id !== hl.id));
                    setHighlightActionId(null);
                  } else {
                    setHighlightRemoveError(true);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-error/30 bg-error/10 text-error text-xs font-medium no-tap-highlight transition-all min-h-[36px]"
              >
                <Trash2 size={12} /> Remove Highlight
              </button>
              {(highlightSaveError || highlightRemoveError) && (
                <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-error/10 border border-error/30">
                  <AlertCircle size={14} className="text-error shrink-0" />
                  <p className="text-error text-xs">{highlightRemoveError ? 'Unable to remove highlight. Try Again.' : 'Unable to update highlight. Try Again.'}</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* CHAPTER MARKING MODE — reserved layout header + sticky palette */}
      {chapterMarkingMode && view === 'reader' && (
        <>
          {/* Persistent marking dock — fixed above bottom nav */}
          <div className="fixed left-0 right-0 z-[54] animate-fade-in-up" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)' }}>
            <div className="max-w-lg mx-auto bg-ink-900/95 backdrop-blur-md border border-gold-500/20 rounded-t-2xl px-4 py-2.5 shadow-xl shadow-ink-950/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-gold-400" />
                  <p className="text-gold-300 text-xs font-medium">Scripture Marking</p>
                </div>
                <button
                  onClick={() => {
                    vibrate(8);
                    setChapterMarkingMode(false);
                    setActiveKeyId(null);
                    setTokenSelStart(null);
                    setTokenSelEnd(null);
                    setMarkPhase('idle');
                    setAdjustMode(false);
                    setMarkSaveError(false);
                    setUndoToast(null);
                    if (undoTimer.current) clearTimeout(undoTimer.current);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold-500/20 border border-gold-500/50 text-gold-100 text-sm font-semibold no-tap-highlight hover:bg-gold-500/30 transition-all min-h-[44px] min-w-[44px]"
                >
                  <XCircle size={16} /> Done
                </button>
              </div>
              {/* Rapid / Phrase segmented control */}
              <div className="flex items-center gap-1 bg-ink-800/60 rounded-lg p-0.5 mb-1.5">
                <button
                  onClick={() => { vibrate(5); setRapidMode(true); setTokenSelStart(null); setTokenSelEnd(null); setMarkPhase('idle'); setAdjustMode(false); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium no-tap-highlight transition-all ${rapidMode ? 'bg-gold-500/20 text-gold-200' : 'text-ivory-500'}`}
                >
                  <Zap size={12} /> Rapid
                </button>
                <button
                  onClick={() => { vibrate(5); setRapidMode(false); setTokenSelStart(null); setTokenSelEnd(null); setMarkPhase('idle'); setAdjustMode(false); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium no-tap-highlight transition-all ${!rapidMode ? 'bg-gold-500/20 text-gold-200' : 'text-ivory-500'}`}
                >
                  <Type size={12} /> Phrase
                </button>
              </div>
              {/* Active key display */}
              {activeKey && (
                <div className="flex items-center gap-2 px-1">
                  <span className="text-ivory-600 text-[10px] uppercase tracking-wider">Active</span>
                  <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gold-500/15 border border-gold-500/30`}>
                    {activeKey.symbol ? (
                      <span className="text-gold-300 text-sm">{activeKey.symbol}</span>
                    ) : (
                      <div className={`w-2.5 h-2.5 rounded-full ${HIGHLIGHT_COLORS.find((c) => c.key === activeKey.color_key)?.dot || 'bg-gold-400'}`} />
                    )}
                    <span className="text-gold-200 text-xs font-medium">{activeKey.name}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Undo toast */}
          {undoToast && (
            <div className="fixed left-0 right-0 z-[60] px-4 animate-fade-in-up" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 140px)' }}>
              <div className="max-w-lg mx-auto flex items-center justify-between bg-ink-800/95 backdrop-blur-md border border-gold-500/30 rounded-xl px-3 py-2 shadow-xl shadow-ink-950/50">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-gold-400 shrink-0" />
                  <p className="text-ivory-300 text-xs">Marked as <span className="text-gold-200 font-medium">{undoToast.keyName}</span></p>
                </div>
                <button
                  onClick={() => undoLastMark(undoToast.markId)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-error/15 border border-error/30 text-error text-xs font-medium no-tap-highlight"
                >
                  <RotateCw size={11} /> Undo
                </button>
              </div>
            </div>
          )}

          {/* Phrase mode selection panel */}
          {!rapidMode && tokenSelStart !== null && (
            <div className="fixed left-0 right-0 z-[56] px-4 animate-fade-in-up" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 140px)' }}>
              <div className="max-w-lg mx-auto bg-ink-800/95 backdrop-blur-md border border-gold-500/30 rounded-2xl p-3 shadow-xl shadow-ink-950/50">
                {markPhase === 'awaiting_end' && tokenSelEnd === null && !adjustMode && (
                  <>
                    <p className="text-ivory-500 text-[10px] uppercase tracking-wider mb-1">Selected</p>
                    <p className="text-gold-100 text-sm font-serif italic mb-2">
                      &ldquo;{(() => {
                        const vd = verses.find((v) => v.verse === (markingVerse ?? verses[0]?.verse));
                        if (!vd || tokenSelStart === null) return '';
                        const tokens = tokenizeVerse(vd.text);
                        return tokens[tokenSelStart]?.text || '';
                      })()}&rdquo;
                    </p>
                    <p className="text-ivory-500 text-[11px] mb-2">Tap the last word</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setTokenSelStart(null);
                          setTokenSelEnd(null);
                          setMarkPhase('idle');
                        }}
                        className="text-ivory-500 text-xs px-2 py-1 no-tap-highlight"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
                {markPhase === 'range_selected' && (
                  <>
                    <p className="text-ivory-500 text-[10px] uppercase tracking-wider mb-1">Selected</p>
                    <p className="text-gold-100 text-sm font-serif italic mb-2">
                      &ldquo;{(() => {
                        const vd = verses.find((v) => v.verse === (markingVerse ?? verses[0]?.verse));
                        if (!vd || tokenSelStart === null || tokenSelEnd === null) return '';
                        return getSelectedText(tokenizeVerse(vd.text), tokenSelStart, tokenSelEnd).trim();
                      })()}&rdquo;
                    </p>
                    <div className="flex items-center gap-2">
                      {activeKey && (
                        <button
                          onClick={() => {
                            vibrate(6);
                            performRapidMark(markingVerse ?? verses[0]?.verse ?? 0, tokenSelStart!, tokenSelEnd!);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-500/20 border border-gold-500/40 text-gold-200 text-xs font-medium no-tap-highlight hover:bg-gold-500/30 transition-all"
                        >
                          <Check size={12} /> Apply
                        </button>
                      )}
                      <button
                        onClick={() => {
                          vibrate(5);
                          setAdjustMode(true);
                          setMarkPhase('awaiting_start');
                          setTokenSelStart(null);
                          setTokenSelEnd(null);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-300 text-xs no-tap-highlight hover:border-gold-500/30 transition-all"
                      >
                        <RotateCw size={12} /> Adjust
                      </button>
                      <button
                        onClick={() => {
                          setTokenSelStart(null);
                          setTokenSelEnd(null);
                          setMarkPhase('idle');
                        }}
                        className="text-ivory-500 text-xs px-2 py-1 no-tap-highlight"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
                {markPhase === 'awaiting_start' && adjustMode && (
                  <p className="text-gold-300 text-xs font-medium">Tap a new first word</p>
                )}
                {markPhase === 'awaiting_end' && adjustMode && (
                  <p className="text-gold-300 text-xs font-medium">Tap a new last word</p>
                )}
                {markSaveError && (
                  <div className="flex items-center gap-2 mt-2 px-2 py-1.5 rounded-lg bg-error/10 border border-error/30">
                    <AlertCircle size={12} className="text-error shrink-0" />
                    <p className="text-error text-[11px]">
                      {keywordMarks.some((km) => km.token_start !== null && km.token_end !== null)
                        ? 'This text already has a mark. Remove it first.'
                        : 'Unable to save. Try again.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rapid mode no-key warning */}
          {rapidMode && !activeKey && (
            <div className="fixed left-0 right-0 z-[56] px-4 animate-fade-in" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 140px)' }}>
              <div className="max-w-lg mx-auto flex items-center gap-2 bg-error/10 border border-error/30 rounded-xl px-3 py-2">
                <AlertCircle size={14} className="text-error shrink-0" />
                <p className="text-error text-xs">Choose a Marking Key first</p>
              </div>
            </div>
          )}

          {/* Mark detail panel (tap existing mark in chapter mode) */}
          {markDetailId && !changeKeyMode && (
            <div className="fixed left-0 right-0 z-[56] px-4 animate-fade-in-up" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 140px)' }}>
              <div className="max-w-lg mx-auto bg-ink-800/95 backdrop-blur-md border border-ink-600/40 rounded-2xl p-3 shadow-xl shadow-ink-950/50">
                {(() => {
                  const km = keywordMarks.find((m) => m.id === markDetailId);
                  if (!km) return null;
                  const kw = keywords.find((k) => k.id === km.keyword_id);
                  if (!kw) return null;
                  return (
                    <>
                      <p className="text-ivory-500 text-[10px] uppercase tracking-wider mb-1">Selected</p>
                      <p className="text-gold-100 text-sm font-serif italic mb-2">
                        &ldquo;{km.selected_text || ''}&rdquo;
                      </p>
                      <p className="text-ivory-500 text-[10px] uppercase tracking-wider mb-1">Marking Key</p>
                      <div className="flex items-center gap-2 mb-3">
                        {kw.symbol ? (
                          <span className="text-gold-400 text-base">{kw.symbol}</span>
                        ) : (
                          <div className={`w-3 h-3 rounded-full ${HIGHLIGHT_COLORS.find((c) => c.key === kw.color_key)?.dot || 'bg-gold-400'}`} />
                        )}
                        <span className="text-ivory-200 text-sm">{kw.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            vibrate(5);
                            setChangeKeyMode(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-medium no-tap-highlight"
                        >
                          <Tag size={12} /> Change Key
                        </button>
                        <button
                          onClick={async () => {
                            vibrate(8);
                            const ok = await removeKeywordMark(markDetailId);
                            if (ok) {
                              setKeywordMarks((prev) => prev.filter((m) => m.id !== markDetailId));
                            }
                            setMarkDetailId(null);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error/20 border border-error/40 text-error text-xs font-medium no-tap-highlight"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                        <button
                          onClick={() => { vibrate(5); setMarkDetailId(null); }}
                          className="px-3 py-1.5 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-400 text-xs no-tap-highlight"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Change key picker */}
          {markDetailId && changeKeyMode && (
            <div className="fixed left-0 right-0 z-[57] px-4 animate-fade-in-up" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 140px)' }}>
              <div className="max-w-lg mx-auto bg-ink-800/95 backdrop-blur-md border border-blue-500/30 rounded-2xl p-3 shadow-xl shadow-ink-950/50">
                <p className="text-blue-300 text-xs font-medium mb-2">Change Marking Key</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {keywords.map((kw) => (
                    <button
                      key={kw.id}
                      onClick={async () => {
                        vibrate(6);
                        const updated = await updateKeywordMarkKey(markDetailId!, kw.id);
                        if (updated) {
                          setKeywordMarks((prev) => prev.map((m) => m.id === markDetailId ? updated : m));
                        }
                        setChangeKeyMode(false);
                        setMarkDetailId(null);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-300 text-xs no-tap-highlight hover:border-blue-500/30 transition-all"
                    >
                      {kw.symbol ? (
                        <span className="text-sm">{kw.symbol}</span>
                      ) : (
                        <div className={`w-2.5 h-2.5 rounded-full ${HIGHLIGHT_COLORS.find((c) => c.key === kw.color_key)?.dot || 'bg-gold-400'}`} />
                      )}
                      {kw.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => { vibrate(5); setChangeKeyMode(false); }}
                  className="text-ivory-500 text-xs px-2 py-1 no-tap-highlight"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Inline key creator during chapter mode */}
          {showInlineKeyCreator && (
            <div className="fixed left-0 right-0 z-[57] px-4 animate-fade-in-up" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 140px)' }}>
              <div className="max-w-lg mx-auto bg-ink-800/95 backdrop-blur-md border border-gold-500/30 rounded-2xl p-3 shadow-xl shadow-ink-950/50 max-h-[70vh] overflow-y-auto">
                <p className="text-gold-300 text-sm font-medium font-serif mb-3">Create Marking Key</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-ivory-500 text-[10px] uppercase tracking-wider mb-1 block">Name</label>
                    <input
                      type="text"
                      value={inlineKeyName}
                      onChange={(e) => setInlineKeyName(e.target.value)}
                      placeholder="e.g. Grace"
                      className="w-full px-3 py-2 rounded-lg bg-ink-800/60 border border-ink-600/40 text-ivory-100 text-sm placeholder:text-ivory-700 focus:outline-none focus:border-gold-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-ivory-500 text-[10px] uppercase tracking-wider mb-1 block">Color</label>
                    <div className="flex gap-2">
                      {HIGHLIGHT_COLORS.map((c) => (
                        <button
                          key={c.key}
                          onClick={() => setInlineKeyColor(c.key)}
                          className={`w-8 h-8 rounded-full ${c.dot} border-2 transition-all ${inlineKeyColor === c.key ? 'border-ivory-200 scale-110' : 'border-transparent'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-ivory-500 text-[10px] uppercase tracking-wider mb-1 block">Mark Style</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {MARK_STYLES.filter((s) => s.key !== 'circle').map((s) => {
                        const previewCls = getMarkStyleClasses(s.key, inlineKeyColor, inlineKeySymbol || '★');
                        return (
                          <button
                            key={s.key}
                            onClick={() => {
                              setInlineKeyStyle(s.key);
                              if (s.key === 'symbol' || s.key === 'symbol_underline' || s.key === 'symbol_highlight') {
                                setShowSymbolPicker(true);
                              }
                            }}
                            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs no-tap-highlight transition-all ${inlineKeyStyle === s.key ? 'bg-gold-500/20 border-gold-500/40 text-gold-200' : 'bg-ink-700/40 border-ink-600/30 text-ivory-400'}`}
                          >
                            <span className={`font-serif ${previewCls.className}`}>
                              Word
                              {previewCls.badge && <sup className="ml-0.5 text-[0.6em]">{previewCls.badge}</sup>}
                            </span>
                            <span className="text-[10px] text-ivory-600">{s.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {isSingleWordStyle(inlineKeyStyle) && (
                      <p className="text-ivory-600 text-[10px] mt-1">{getStyleDescription(inlineKeyStyle)}</p>
                    )}
                  </div>
                  {(inlineKeyStyle === 'symbol' || inlineKeyStyle === 'symbol_underline' || inlineKeyStyle === 'symbol_highlight') && (
                    <div>
                      <label className="text-ivory-500 text-[10px] uppercase tracking-wider mb-1 block">Symbol</label>
                      <SymbolPicker
                        selectedSymbol={inlineKeySymbol}
                        onSelect={(sym) => { setInlineKeySymbol(sym); setShowSymbolPicker(false); }}
                      />
                    </div>
                  )}
                  {/* Large live Scripture preview */}
                  <div className="rounded-xl bg-ink-900/60 border border-ink-700/30 p-3">
                    <p className="text-ivory-600 text-[10px] uppercase tracking-wider mb-2">Live Preview</p>
                    <p className="font-serif text-[18px] leading-[1.7] text-ivory-100">
                      the Word was{' '}
                      <span className={getMarkStyleClasses(inlineKeyStyle, inlineKeyColor, inlineKeySymbol || '★').className}>
                        God
                        {getMarkStyleClasses(inlineKeyStyle, inlineKeyColor, inlineKeySymbol || '★').badge && (
                          <sup className="ml-0.5 text-[0.7em] font-bold">{inlineKeySymbol || '★'}</sup>
                        )}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        if (!inlineKeyName.trim()) return;
                        vibrate(8);
                        setInlineKeySaving(true);
                        const sym = (inlineKeyStyle === 'symbol' || inlineKeyStyle === 'symbol_underline' || inlineKeyStyle === 'symbol_highlight')
                          ? (inlineKeySymbol.trim() || '★')
                          : null;
                        const saved = await saveKeyword(inlineKeyName.trim(), inlineKeyColor, inlineKeyStyle, sym, null);
                        if (saved) {
                          setKeywords((prev) => [...prev, saved]);
                          setActiveKeyId(saved.id);
                          setShowInlineKeyCreator(false);
                          setInlineKeyName('');
                          setInlineKeySymbol('');
                          setInlineKeySaving(false);
                        } else {
                          setInlineKeySaving(false);
                        }
                      }}
                      disabled={!inlineKeyName.trim() || inlineKeySaving}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold-500/20 border border-gold-500/40 text-gold-200 text-xs font-medium no-tap-highlight hover:bg-gold-500/30 transition-all disabled:opacity-40"
                    >
                      <Check size={13} /> {inlineKeySaving ? 'Saving...' : 'Save Key'}
                    </button>
                    <button
                      onClick={() => {
                        setShowInlineKeyCreator(false);
                        setInlineKeyName('');
                        setInlineKeySymbol('');
                      }}
                      className="px-3 py-2 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-400 text-xs no-tap-highlight"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Marking Key palette */}
          <div className="fixed left-0 right-0 z-[54] px-2 animate-fade-in-up" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0px)' }}>
            <div className="max-w-lg mx-auto bg-ink-900/95 backdrop-blur-md border border-ink-600/40 rounded-t-2xl p-2 shadow-xl shadow-ink-950/50">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {keywords.map((kw) => {
                  const isActive = activeKeyId === kw.id;
                  return (
                    <button
                      key={kw.id}
                      onClick={() => {
                        vibrate(5);
                        if (tokenSelStart !== null) {
                          setTokenSelStart(null);
                          setTokenSelEnd(null);
                          setMarkPhase('idle');
                        }
                        setActiveKeyId(kw.id);
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap no-tap-highlight transition-all ${
                        isActive
                          ? 'bg-gold-500/20 border-gold-500/50 text-gold-200 scale-105 shadow-sm shadow-gold-500/20'
                          : 'bg-ink-700/40 border-ink-600/30 text-ivory-400 hover:border-gold-500/30'
                      }`}
                    >
                      {kw.symbol ? (
                        <span className={`text-sm ${isActive ? 'text-gold-300' : 'text-ivory-500'}`}>{kw.symbol}</span>
                      ) : (
                        <div className={`w-2.5 h-2.5 rounded-full ${HIGHLIGHT_COLORS.find((c) => c.key === kw.color_key)?.dot || 'bg-gold-400'}`} />
                      )}
                      {kw.name}
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    vibrate(5);
                    setShowInlineKeyCreator(true);
                    setInlineKeyName('');
                    setInlineKeyColor('gold');
                    setInlineKeyStyle('underline');
                    setInlineKeySymbol('');
                  }}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-400 hover:border-gold-500/30 hover:text-gold-300 no-tap-highlight transition-all shrink-0"
                  aria-label="Create new marking key"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Setup sheet when no keywords and user tapped Mark Chapter */}
      {markingMode && showSetupSheet && !chapterMarkingMode && markingVerse === null && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center px-4 animate-fade-in" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => { setShowSetupSheet(false); setMarkingMode(false); }} />
          <div className="relative w-full max-w-lg bg-ink-800/95 backdrop-blur-md border border-ink-600/40 rounded-2xl p-4 shadow-xl shadow-ink-950/50 animate-fade-in-up">
            <p className="text-gold-300 text-base font-medium font-serif mb-1">Set Up Your Marking Key</p>
            <p className="text-ivory-400 text-sm mb-4 leading-relaxed">
              Create a simple marking key so you can visually identify important words and ideas as you study Scripture.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={async () => {
                  vibrate(8);
                  const starterDefs: { name: string; color: HighlightColor; style: MarkStyle; symbol: string | null }[] = [
                    { name: 'God', color: 'gold', style: 'oval', symbol: '✦' },
                    { name: 'Jesus Christ', color: 'red', style: 'double_underline', symbol: '+' },
                    { name: 'Holy Spirit', color: 'green', style: 'symbol_underline', symbol: '◇' },
                    { name: 'Commands', color: 'red', style: 'box', symbol: '!' },
                    { name: 'Time', color: 'blue', style: 'oval', symbol: '∞' },
                    { name: 'Places', color: 'green', style: 'double_underline', symbol: '◆' },
                    { name: 'Key / Repeated Words', color: 'gold', style: 'highlight', symbol: '★' },
                    { name: 'Contrast / Conclusion', color: 'purple', style: 'slash', symbol: '→' },
                  ];
                  const created: BibleKeyword[] = [];
                  for (const def of starterDefs) {
                    const kw = await saveKeyword(def.name, def.color, def.style, def.symbol, null);
                    if (kw) created.push(kw);
                  }
                  if (created.length > 0) {
                    setKeywords((prev) => [...prev, ...created]);
                    setShowSetupSheet(false);
                    setMarkingMode(false);
                    setChapterMarkingMode(true);
                    setActiveKeyId(created[0].id);
                  }
                }}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-gold-500/20 border border-gold-500/40 text-gold-200 text-sm font-medium no-tap-highlight hover:bg-gold-500/30 transition-all"
              >
                <Check size={15} /> Use SOLAPATH Starter Key
              </button>
              <button
                onClick={() => {
                  vibrate(5);
                  setShowSetupSheet(false);
                  setShowInlineKeyCreator(true);
                  setInlineKeyName('');
                  setInlineKeyColor('gold');
                  setInlineKeyStyle('underline');
                  setInlineKeySymbol('');
                  setChapterMarkingMode(true);
                }}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-ink-700/40 border border-ink-600/30 text-ivory-300 text-sm no-tap-highlight hover:border-gold-500/30 transition-all"
              >
                <Type size={15} /> Create My Own
              </button>
              <button
                onClick={() => {
                  setShowSetupSheet(false);
                  setMarkingMode(false);
                }}
                className="text-ivory-500 text-sm py-1 no-tap-highlight"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      {/* VERSION SELECTOR SHEET */}
      {showVersionSheet && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center px-4 animate-fade-in" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => setShowVersionSheet(false)} />
          <div className="relative w-full max-w-lg bg-ink-800/95 backdrop-blur-md border border-ink-600/40 rounded-2xl p-4 shadow-xl shadow-ink-950/50 animate-fade-in-up">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gold-300 text-base font-medium font-serif">Bible Version</p>
              <button onClick={() => setShowVersionSheet(false)} className="text-ivory-500"><X size={18} /></button>
            </div>
            <p className="text-ivory-500 text-[10px] uppercase tracking-wider mb-2">Installed</p>
            {BIBLE_TRANSLATIONS.filter((t) => t.installed && t.selectable).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  if (t.id !== translation) {
                    vibrate(5);
                    setTranslation(t.id);
                    localStorage.setItem('solapath_translation', t.id);
                    loadChapter(book, chapter);
                  }
                  setShowVersionSheet(false);
                }}
                className="flex items-center justify-between w-full p-3 rounded-xl bg-ink-700/30 border border-ink-600/20 mb-2 hover:border-gold-500/30 transition-all no-tap-highlight text-left"
              >
                <div>
                  <p className="text-ivory-100 text-sm font-medium">{t.fullName}</p>
                  <p className="text-ivory-500 text-xs">{t.shortName} &middot; {t.language} &middot; Offline</p>
                </div>
                {translation === t.id && (
                  <span className="flex items-center gap-1 text-gold-300 text-xs font-medium shrink-0">
                    <Check size={14} /> Selected
                  </span>
                )}
              </button>
            ))}
            <p className="text-ivory-500 text-[10px] uppercase tracking-wider mt-3 mb-2">Other Translations</p>
            {BIBLE_TRANSLATIONS.filter((t) => !t.installed || !t.selectable).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-ink-800/20 border border-ink-700/20 mb-2 opacity-60">
                <div>
                  <p className="text-ivory-300 text-sm font-medium">{t.fullName}</p>
                  <p className="text-ivory-600 text-xs">{t.shortName} &middot; {t.rightsStatus}</p>
                </div>
              </div>
            ))}
            <p className="text-ivory-600 text-[10px] mt-2 leading-relaxed">
              SOLAPATH uses the World English Bible (public domain). Additional translations may be added when properly licensed.
            </p>
          </div>
        </div>
      )}

      {/* CROSS REFERENCE SHEET */}
      {showCrossRefs && selection && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center px-4 animate-fade-in" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => { setShowCrossRefs(false); setCrossRefNavStack([]); }} />
          <div className="relative w-full max-w-lg bg-ink-800/95 backdrop-blur-md border border-ink-600/40 rounded-2xl p-4 shadow-xl shadow-ink-950/50 animate-fade-in-up max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sticky top-0 bg-ink-800/95 pb-2 -mx-4 px-4 border-b border-ink-700/30">
              <div>
                <p className="text-gold-300 text-base font-medium font-serif">Cross References</p>
                <p className="text-ivory-500 text-xs">{getBookDisplayName(selection.book, translation)} {selection.chapter}:{selection.verseStart}</p>
              </div>
              <div className="flex items-center gap-2">
                {crossRefNavStack.length > 0 && (
                  <button
                    onClick={() => {
                      const prev = crossRefNavStack[crossRefNavStack.length - 1];
                      setCrossRefNavStack((s) => s.slice(0, -1));
                      loadChapter(prev.book, prev.chapter);
                      setTimeout(() => {
                        const el = verseRefs.current.get(prev.verse);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 300);
                      setShowCrossRefs(false);
                    }}
                    className="flex items-center gap-1 text-gold-300 text-xs font-medium"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                )}
                <button onClick={() => { setShowCrossRefs(false); setCrossRefNavStack([]); }} className="text-ivory-500"><X size={18} /></button>
              </div>
            </div>
            {crossRefLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-ivory-500 text-sm">Loading cross references...</p>
              </div>
            ) : crossRefData.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-ivory-500 text-sm">No cross references available for this verse.</p>
              </div>
            ) : (
              <>
                {crossRefData.slice(0, crossRefLimit).map((ref) => (
                  <button
                    key={ref.target}
                    onClick={async () => {
                      const parsed = parseReference(ref.target);
                      if (!parsed) return;
                      vibrate(5);
                      const scrollY = scrollRef.current?.scrollTop ?? 0;
                      setCrossRefNavStack((s) => [...s, { book: selection.book, chapter: selection.chapter, verse: selection.verseStart, scrollY }]);
                      setShowCrossRefs(false);
                      await loadChapter(parsed.book, parsed.chapter);
                      setTimeout(() => {
                        const el = verseRefs.current.get(parsed.verse);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 300);
                    }}
                    className="block w-full text-left p-3 rounded-xl bg-ink-700/30 border border-ink-600/20 mb-2 hover:border-gold-500/30 transition-all no-tap-highlight"
                  >
                    <p className="text-gold-200 text-sm font-medium mb-1">{(() => { const p = parseReference(ref.target); return p ? `${getBookDisplayName(p.book, translation)} ${p.chapter}:${p.verse}` : ref.target; })()}</p>
                    {crossRefPreviews[ref.target] ? (
                      <p className="text-ivory-400 text-xs font-serif italic leading-relaxed">{crossRefPreviews[ref.target]}</p>
                    ) : (
                      <p className="text-ivory-600 text-xs italic">Loading preview...</p>
                    )}
                  </button>
                ))}
                {crossRefData.length > crossRefLimit && (
                  <button
                    onClick={async () => {
                      const newLimit = crossRefLimit + 8;
                      setCrossRefLimit(newLimit);
                      const newRefs = crossRefData.slice(crossRefLimit, newLimit);
                      const previews = { ...crossRefPreviews };
                      await Promise.all(newRefs.map(async (r) => {
                        if (!previews[r.target]) {
                          const parsed = parseReference(r.target);
                          if (parsed) {
                            const result = await fetchVerses(parsed.book, parsed.chapter, parsed.verse, parsed.verse, translation);
                            previews[r.target] = result.verses[0]?.text || '';
                          }
                        }
                      }));
                      setCrossRefPreviews(previews);
                    }}
                    className="w-full py-2.5 rounded-lg bg-gold-500/15 border border-gold-500/25 text-gold-300 text-xs font-medium no-tap-highlight"
                  >
                    See More ({crossRefData.length - crossRefLimit} remaining)
                  </button>
                )}
                <p className="text-ivory-600 text-[10px] mt-3 leading-relaxed">{CROSS_REF_ATTRIBUTION}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* BOOK SELECTOR */}
      {view === 'books' && (
        <BookSelector
          onSelect={(b) => { setBook(b); setChapter(1); setView('chapters'); }}
          onBack={() => setView('reader')}
          translation={translation}
        />
      )}

      {/* CHAPTER SELECTOR */}
      {view === 'chapters' && (
        <ChapterSelector
          book={book}
          onSelect={(c) => goToChapter(book, c)}
          onBack={() => setView('books')}
          translation={translation}
        />
      )}

      {/* NOTES LIBRARY */}
      {view === 'notes' && (
        <NotesLibrary
          notes={notes}
          searchQuery={searchQuery}
          searchResults={searchResults}
          onSearchChange={setSearchQuery}
          onSearch={handleSearch}
          onNoteTap={(n) => { 
            setView('reader');
            loadChapter(n.book, n.chapter);
            setTimeout(() => {
              setPassageEmphasis({ verseStart: n.verse_start, verseEnd: n.verse_end });
            }, 350);
          }}
          onDelete={async (id) => {
            vibrate(8);
            const ok = await deleteNote(id);
            if (ok) {
              setNotes((prev) => prev.filter((n) => n.id !== id));
              setSearchResults((prev) => prev.filter((n) => n.id !== id));
            }
          }}
          onBack={() => setView('reader')}
          loadAllNotes={async () => {
            const all = await getNotes();
            setNotes(all);
          }}
        />
      )}

      {/* BOOKMARKS */}
      {view === 'bookmarks' && (
        <BookmarksView
          bookmarks={bookmarks}
          translation={translation}
          onTap={async (bm) => {
            vibrate(5);
            setView('reader');
            await loadChapter(bm.book, bm.chapter);
            setTimeout(() => {
              setPassageEmphasis({ verseStart: bm.verse_start, verseEnd: bm.verse_end });
            }, 350);
          }}
          onDelete={async (id) => {
            vibrate(8);
            const ok = await removeBookmark(id);
            if (ok) setBookmarks((prev) => prev.filter((b) => b.id !== id));
          }}
          onBack={() => setView('reader')}
        />
      )}

      {/* KEYWORDS */}
      {view === 'keywords' && (
        <KeywordsView
          keywords={keywords}
          onSave={async (name, color, style, symbol, desc) => {
            vibrate(6);
            const saved = await saveKeyword(name, color, style, symbol, desc);
            if (saved) {
              setKeywords((prev) => [...prev, saved]);
              return true;
            }
            return false;
          }}
          onEdit={async (id, name, color, style, symbol, desc) => {
            vibrate(6);
            const updated = await updateKeyword(id, name, color, style, symbol, desc);
            if (updated) {
              setKeywords((prev) => prev.map((k) => k.id === id ? updated : k));
              return true;
            }
            return false;
          }}
          onDelete={async (id) => {
            vibrate(8);
            const ok = await deleteKeyword(id);
            if (ok) setKeywords((prev) => prev.filter((k) => k.id !== id));
          }}
          onBack={() => setView('reader')}
        />
      )}

      {/* CHAPTER NOTES */}
      {view === 'chapter_notes' && (
        <ChapterNoteEditor
          book={book}
          chapter={chapter}
          existing={chapterNote}
          onSave={async (fields) => {
            vibrate(8);
            const saved = await saveChapterNote(book, chapter, fields, translation);
            if (saved) {
              setChapterNote(saved);
              setView('reader');
            } else {
              setError('Could not save chapter notes.');
            }
          }}
          onBack={() => setView('reader')}
        />
      )}

      {/* NOTE EDITOR */}
      {view === 'note_editor' && noteEditorState && (
        <NoteEditor
          sel={noteEditorState.sel}
          existing={noteEditorState.existing}
          onSave={async (noteType, content, title) => {
            vibrate(8);
            setNoteSaveError(false);
            const saved = await saveNote(noteEditorState.sel, noteType, content, title, translation, noteEditorState.existing?.id);
            if (saved) {
              setNotes((prev) => [saved, ...prev.filter((n) => n.id !== saved.id)]);
              setNoteEditorState(null);
              setView('reader');
            } else {
              setNoteSaveError(true);
            }
          }}
          onCancel={() => { setNoteEditorState(null); setView('reader'); }}
          saveError={noteSaveError}
        />
      )}

      {/* PASSAGE STUDY */}
      {view === 'passage_study' && studySel && (
        <PassageStudy
          sel={studySel}
          verses={verses.filter((v) => v.verse >= studySel.verseStart && v.verse <= studySel.verseEnd)}
          onAsk={handleAsk}
          onBack={() => { setStudySel(null); setView('reader'); }}
        />
      )}
    </div>
  );
}

// ============================================================
// BookSelector
// ============================================================

function BookSelector({ onSelect, onBack, translation }: { onSelect: (book: string) => void; onBack: () => void; translation: string }) {
  const otBooks = BIBLE_BOOKS.filter((b) => b.testament === 'OT');
  const ntBooks = BIBLE_BOOKS.filter((b) => b.testament === 'NT');

  return (
    <div className="px-6 mt-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="btn-ghost"><ChevronLeft size={20} /></button>
        <p className="ui-label">Select Book</p>
      </div>
      <p className="text-gold-400/70 text-[10px] uppercase tracking-[0.2em] font-medium mb-3">Old Testament</p>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {otBooks.map((b) => (
          <button
            key={b.name}
            onClick={() => { vibrate(5); onSelect(b.name); }}
            className="text-left px-4 py-3 rounded-xl bg-ink-800/30 border border-ink-600/20 text-ivory-200 text-sm hover:border-gold-500/30 transition-all no-tap-highlight"
          >
            {getBookDisplayName(b.name, translation)}
          </button>
        ))}
      </div>
      <p className="text-gold-400/70 text-[10px] uppercase tracking-[0.2em] font-medium mb-3">New Testament</p>
      <div className="grid grid-cols-2 gap-2">
        {ntBooks.map((b) => (
          <button
            key={b.name}
            onClick={() => { vibrate(5); onSelect(b.name); }}
            className="text-left px-4 py-3 rounded-xl bg-ink-800/30 border border-ink-600/20 text-ivory-200 text-sm hover:border-gold-500/30 transition-all no-tap-highlight"
          >
            {getBookDisplayName(b.name, translation)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ChapterSelector
// ============================================================

function ChapterSelector({ book, onSelect, onBack, translation }: { book: string; onSelect: (c: number) => void; onBack: () => void; translation: string }) {
  const bookInfo = getBook(book);
  const count = bookInfo?.chapters || 1;
  const chapters = Array.from({ length: count }, (_, i) => i + 1);

  return (
    <div className="px-6 mt-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="btn-ghost"><ChevronLeft size={20} /></button>
        <p className="ui-label">{getBookDisplayName(book, translation)} — Chapters</p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {chapters.map((c) => (
          <button
            key={c}
            onClick={() => { vibrate(5); onSelect(c); }}
            className="aspect-square flex items-center justify-center rounded-xl bg-ink-800/30 border border-ink-600/20 text-ivory-200 text-sm font-medium hover:border-gold-500/30 hover:text-gold-300 transition-all no-tap-highlight"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// NotesLibrary
// ============================================================

function NotesLibrary({
  notes, searchQuery, searchResults, onSearchChange, onSearch, onNoteTap, onDelete, onBack, loadAllNotes,
}: {
  notes: BibleNote[];
  searchQuery: string;
  searchResults: BibleNote[];
  onSearchChange: (q: string) => void;
  onSearch: () => void;
  onNoteTap: (n: BibleNote) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  loadAllNotes: () => void;
}) {
  const [showSearch, setShowSearch] = useState(false);
  const display = searchQuery.trim() ? searchResults : notes;

  useEffect(() => {
    loadAllNotes();
  }, []);

  return (
    <div className="px-6 mt-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => { loadAllNotes(); onBack(); }} className="btn-ghost"><ChevronLeft size={20} /></button>
        <p className="ui-label">My Bible Notes</p>
        <div className="flex-1" />
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="w-9 h-9 rounded-full bg-ink-800/40 border border-ink-600/30 flex items-center justify-center text-ivory-400 hover:text-ivory-100 transition-colors no-tap-highlight"
          aria-label="Search notes"
        >
          <Search size={16} />
        </button>
      </div>

      {showSearch && (
        <div className="flex gap-2 mb-4 animate-fade-in">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="Search notes..."
            className="input-field flex-1"
            autoFocus
          />
          <button onClick={onSearch} className="btn-primary px-4">
            <Search size={16} />
          </button>
        </div>
      )}

      {display.length === 0 ? (
        <p className="text-ivory-500 text-sm py-8">
          {searchQuery.trim() ? 'No notes found for your search.' : 'No notes yet. Select verses and tap Note to start studying.'}
        </p>
      ) : (
        <div className="space-y-3">
          {display.map((n) => (
            <div
              key={n.id}
              className="premium-card p-4 no-tap-highlight hover:border-gold-500/20 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <button onClick={() => onNoteTap(n)} className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-gold-300 font-serif text-sm font-medium">
                      {n.book} {n.chapter}:{n.verse_start === n.verse_end ? n.verse_start : `${n.verse_start}\u2013${n.verse_end}`}
                    </p>
                    <span className="text-[10px] uppercase tracking-wider text-ivory-600 px-1.5 py-0.5 rounded bg-ink-700/30">
                      {NOTE_TYPE_LABELS[n.note_type]}
                    </span>
                  </div>
                  {n.title && <p className="text-ivory-200 text-sm font-medium mb-1">{n.title}</p>}
                  <p className="text-ivory-400 text-xs leading-relaxed line-clamp-3">{n.content}</p>
                  <p className="text-ivory-600 text-[10px] mt-2">
                    {new Date(n.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </button>
                <button
                  onClick={() => onDelete(n.id)}
                  className="text-ivory-600 hover:text-error transition-colors shrink-0 mt-1"
                  aria-label="Delete note"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// BookmarksView
// ============================================================

function BookmarksView({
  bookmarks, onTap, onDelete, onBack, translation,
}: {
  bookmarks: BibleBookmark[];
  onTap: (bm: BibleBookmark) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  translation: string;
}) {
  return (
    <div className="px-6 mt-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="btn-ghost"><ChevronLeft size={20} /></button>
        <p className="ui-label">Bookmarks</p>
      </div>
      {bookmarks.length === 0 ? (
        <p className="text-ivory-500 text-sm py-8">No bookmarks yet. Select verses and tap Bookmark to save a passage.</p>
      ) : (
        <div className="space-y-2">
          {bookmarks.map((bm) => (
            <div key={bm.id} className="flex items-center justify-between premium-card p-4">
              <button onClick={() => onTap(bm)} className="flex-1 text-left">
                <p className="text-gold-300 font-serif text-sm font-medium">
                  {getBookDisplayName(bm.book, translation)} {bm.chapter}:{bm.verse_start === bm.verse_end ? bm.verse_start : `${bm.verse_start}\u2013${bm.verse_end}`}
                </p>
                {bm.label && <p className="text-ivory-400 text-xs mt-1">{bm.label}</p>}
                <p className="text-ivory-600 text-[10px] mt-1">
                  {new Date(bm.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </p>
              </button>
              <button onClick={() => onDelete(bm.id)} className="text-ivory-600 hover:text-error transition-colors shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// KeywordsView
// ============================================================

function KeywordsView({
  keywords, onSave, onDelete, onEdit, onBack,
}: {
  keywords: BibleKeyword[];
  onSave: (name: string, color: HighlightColor, style: MarkStyle, symbol: string | null, desc: string | null) => Promise<boolean>;
  onDelete: (id: string) => void;
  onEdit: (id: string, name: string, color: HighlightColor, style: MarkStyle, symbol: string | null, desc: string | null) => Promise<boolean>;
  onBack: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState<HighlightColor>('gold');
  const [style, setStyle] = useState<MarkStyle>('highlight');
  const [symbol, setSymbol] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  function startEdit(kw: BibleKeyword) {
    setEditingId(kw.id);
    setName(kw.name);
    setColor(kw.color_key);
    setStyle(kw.style);
    setSymbol(kw.symbol || '');
    setDesc(kw.description || '');
    setShowForm(true);
  }

  function startNew() {
    setEditingId(null);
    setName(''); setSymbol(''); setDesc('');
    setColor('gold'); setStyle('highlight');
    setShowForm(true);
  }

  return (
    <div className="px-6 mt-4 pb-28">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="btn-ghost"><ChevronLeft size={20} /></button>
        <p className="ui-label">Keywords</p>
        <div className="flex-1" />
        <button
          onClick={startNew}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold-500/15 border border-gold-500/25 text-gold-300 text-xs font-medium no-tap-highlight"
        >
          + New
        </button>
      </div>

      {showForm && (
        <div className="premium-card p-4 mb-4 animate-fade-in">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Keyword (e.g. GRACE)"
            className="input-field mb-3"
          />
          <p className="text-ivory-500 text-xs mb-2">Color</p>
          <div className="grid grid-cols-4 gap-2 mb-3 overflow-x-hidden">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.key}
                onClick={() => setColor(c.key)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs transition-all no-tap-highlight ${color === c.key ? `${c.class} text-ivory-100` : 'bg-ink-800/30 border-ink-600/20 text-ivory-500'}`}
              >
                <div className={`w-3 h-3 rounded-full shrink-0 ${c.dot}`} />
                <span className="truncate">{c.label}</span>
              </button>
            ))}
          </div>
          <p className="text-ivory-500 text-xs mb-2">Mark Style</p>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {MARK_STYLES.map((s) => {
              const previewCls = getMarkStyleClasses(s.key, color, symbol || '★');
              return (
                <button
                  key={s.key}
                  onClick={() => setStyle(s.key)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs transition-all no-tap-highlight ${style === s.key ? 'bg-gold-500/20 border-gold-500/40 text-gold-300' : 'bg-ink-800/30 border-ink-600/20 text-ivory-500'}`}
                >
                  <span className={`font-serif ${previewCls.className}`}>
                    Word
                    {previewCls.badge && <sup className="ml-0.5 text-[0.6em]">{previewCls.badge}</sup>}
                  </span>
                  <span className="text-[10px] text-ivory-600">{s.label}</span>
                </button>
              );
            })}
          </div>
          {isSingleWordStyle(style) && (
            <p className="text-ivory-600 text-[10px] mb-3">{getStyleDescription(style)}</p>
          )}
          {(style === 'symbol' || style === 'symbol_underline' || style === 'symbol_highlight') && (
            <>
              <p className="text-ivory-500 text-xs mb-2">Symbol</p>
              <div className="mb-3">
                <SymbolPicker
                  selectedSymbol={symbol}
                  onSelect={(sym) => setSymbol(sym)}
                />
              </div>
            </>
          )}
          <div className="rounded-xl bg-ink-900/60 border border-ink-700/30 p-3 mb-3">
            <p className="text-ivory-600 text-[10px] uppercase tracking-wider mb-2">Live Preview</p>
            <p className="font-serif text-[18px] leading-[1.7] text-ivory-100">
              the Word was{' '}
              <span className={getMarkStyleClasses(style, color, symbol || '★').className}>
                God
                {getMarkStyleClasses(style, color, symbol || '★').badge && (
                  <sup className="ml-0.5 text-[0.7em] font-bold">{symbol || '★'}</sup>
                )}
              </span>
            </p>
          </div>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description (optional)"
            className="input-field mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!name.trim() || saving) return;
                setSaving(true);
                const sym = (style === 'symbol' || style === 'symbol_underline' || style === 'symbol_highlight')
                  ? (symbol.trim() || '★')
                  : null;
                const ok = editingId
                  ? await onEdit(editingId, name.trim().toUpperCase(), color, style, sym, desc.trim() || null)
                  : await onSave(name.trim().toUpperCase(), color, style, sym, desc.trim() || null);
                if (ok) {
                  setName(''); setSymbol(''); setDesc(''); setShowForm(false); setEditingId(null);
                }
                setSaving(false);
              }}
              disabled={!name.trim() || saving}
              className="btn-primary flex-1 disabled:opacity-40"
            >
              {saving ? <span className="text-xs">Saving...</span> : <><Check size={14} /> {editingId ? 'Save Changes' : 'Save Keyword'}</>}
            </button>
            {editingId && (
              <button
                onClick={() => { vibrate(8); onDelete(editingId); setShowForm(false); setEditingId(null); }}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-error/30 bg-error/10 text-error text-xs font-medium no-tap-highlight"
              >
                <Trash2 size={12} /> Delete
              </button>
            )}
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-ghost" disabled={saving}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {keywords.length === 0 && !showForm ? (
        <p className="text-ivory-500 text-sm py-8">No keywords yet. Create keywords to mark recurring words in Scripture.</p>
      ) : (
        <div className="space-y-2">
          {keywords.map((kw) => (
            <div key={kw.id} className="flex items-center justify-between premium-card p-4">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${HIGHLIGHT_COLORS.find((c) => c.key === kw.color_key)?.dot || 'bg-gold-400'}`} />
                <div>
                  <p className="text-ivory-100 text-sm font-medium">{kw.name}</p>
                  {kw.symbol && <p className="text-ivory-500 text-xs">{kw.symbol}</p>}
                  {kw.description && <p className="text-ivory-600 text-xs mt-0.5">{kw.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => startEdit(kw)} className="text-ivory-500 hover:text-gold-300 transition-colors" aria-label="Edit">
                  <Pencil size={14} />
                </button>
                <button onClick={() => onDelete(kw.id)} className="text-ivory-600 hover:text-error transition-colors" aria-label="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// NoteEditor
// ============================================================

function NoteEditor({
  sel, existing, onSave, onCancel, saveError,
}: {
  sel: VerseSelection;
  existing?: BibleNote;
  onSave: (noteType: NoteType, content: string, title: string | null) => void;
  onCancel: () => void;
  saveError: boolean;
}) {
  const [noteType, setNoteType] = useState<NoteType>(existing?.note_type || 'observation');
  const [content, setContent] = useState(existing?.content || '');
  const [title, setTitle] = useState(existing?.title || '');
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = Math.min(ref.current.scrollHeight, 400) + 'px';
    }
  }, [content]);

  return (
    <div className="px-6 mt-4 pb-28">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onCancel} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">
          {existing ? 'Edit Note' : 'New Note'}
        </p>
      </div>

      <p className="font-serif text-xl text-gold-300 mb-4">{formatReference(sel, undefined)}</p>

      <p className="text-ivory-500 text-xs mb-2">Category</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(Object.keys(NOTE_TYPE_LABELS) as NoteType[]).map((t) => (
          <button
            key={t}
            onClick={() => { vibrate(3); setNoteType(t); }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all no-tap-highlight ${
              noteType === t ? 'bg-gold-500/20 border-gold-500/40 text-gold-300' : 'bg-ink-800/30 border-ink-600/20 text-ivory-400'
            }`}
          >
            {NOTE_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="input-field mb-3"
      />

      <textarea
        ref={ref}
        value={content}
        onChange={(e) => { setContent(e.target.value); setSaveError(false); }}
        placeholder="Write your observation, interpretation, or application..."
        className="input-field min-h-[120px] resize-none mb-3"
        style={{ minHeight: '120px' }}
      />

      {saveError && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-error/10 border border-error/30">
          <AlertCircle size={14} className="text-error shrink-0" />
          <p className="text-error text-xs">Unable to save note. Your text is preserved — try again.</p>
        </div>
      )}

      <div className="flex gap-3 sticky bottom-4">
        <button onClick={onCancel} className="btn-ghost flex-1" disabled={saving}>Cancel</button>
        <button
          onClick={async () => {
            if (!content.trim() || saving) return;
            setSaving(true);
            await onSave(noteType, content.trim(), title.trim() || null);
            setSaving(false);
          }}
          disabled={!content.trim() || saving}
          className="btn-primary flex-1 disabled:opacity-40"
        >
          {saving ? <span className="text-xs">Saving...</span> : <><Check size={14} /> Save</>}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// ChapterNoteEditor
// ============================================================

function ChapterNoteEditor({
  book, chapter, existing, onSave, onBack,
}: {
  book: string;
  chapter: number;
  existing: BibleChapterNote | null;
  onSave: (fields: Partial<Pick<BibleChapterNote, 'theme' | 'key_people' | 'repeated_words' | 'commands' | 'promises' | 'questions' | 'observations' | 'application'>>) => void;
  onBack: () => void;
}) {
  const [theme, setTheme] = useState(existing?.theme || '');
  const [keyPeople, setKeyPeople] = useState(existing?.key_people || '');
  const [repeatedWords, setRepeatedWords] = useState(existing?.repeated_words || '');
  const [commands, setCommands] = useState(existing?.commands || '');
  const [promises, setPromises] = useState(existing?.promises || '');
  const [questions, setQuestions] = useState(existing?.questions || '');
  const [observations, setObservations] = useState(existing?.observations || '');
  const [application, setApplication] = useState(existing?.application || '');

  const fields = [
    { label: 'Theme', value: theme, set: setTheme },
    { label: 'Key People', value: keyPeople, set: setKeyPeople },
    { label: 'Repeated Words', value: repeatedWords, set: setRepeatedWords },
    { label: 'Commands', value: commands, set: setCommands },
    { label: 'Promises', value: promises, set: setPromises },
    { label: 'Questions', value: questions, set: setQuestions },
    { label: 'Observations', value: observations, set: setObservations },
    { label: 'Application', value: application, set: setApplication },
  ];

  return (
    <div className="px-6 mt-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">{book} {chapter} — Chapter Notes</p>
      </div>

      <div className="space-y-4">
        {fields.map((f) => (
          <div key={f.label}>
            <p className="text-ivory-500 text-xs mb-1.5">{f.label}</p>
            <textarea
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              placeholder={`${f.label}...`}
              className="input-field min-h-[44px] resize-none text-sm"
              style={{ minHeight: '44px' }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          vibrate(8);
          onSave({
            theme: theme || null,
            key_people: keyPeople || null,
            repeated_words: repeatedWords || null,
            commands: commands || null,
            promises: promises || null,
            questions: questions || null,
            observations: observations || null,
            application: application || null,
          });
        }}
        className="btn-primary w-full mt-5"
      >
        <Check size={14} /> Save Chapter Notes
      </button>
    </div>
  );
}

// ============================================================
// PassageStudy — OIA structured study for selected verses
// ============================================================

function PassageStudy({
  sel, verses, onAsk, onBack,
}: {
  sel: VerseSelection;
  verses: BibleVerse[];
  onAsk: () => void;
  onBack: () => void;
}) {
  const [observation, setObservation] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [application, setApplication] = useState('');
  const [prayer, setPrayer] = useState('');
  const [studySaving, setStudySaving] = useState(false);

  const oiaFields = [
    { label: 'Observation — What does the text say?', placeholder: 'Who is speaking? What happens? What words are repeated?', value: observation, set: setObservation },
    { label: 'Interpretation — What does it mean?', placeholder: 'What does this passage mean in its context?', value: interpretation, set: setInterpretation },
    { label: 'Application — How should this shape my life?', placeholder: 'How should this truth affect belief or behavior?', value: application, set: setApplication },
    { label: 'Prayer', placeholder: 'Write a prayer in response...', value: prayer, set: setPrayer },
  ];

  return (
    <div className="px-6 mt-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="btn-ghost"><X size={20} /></button>
        <p className="ui-label">Passage Study</p>
      </div>

      <p className="font-serif text-xl text-gold-300 mb-4">{formatReference(sel)}</p>

      {/* Scripture text */}
      <div className="premium-card p-4 mb-5">
        <div className="space-y-1.5">
          {verses.map((v) => (
            <p key={v.verse} className="font-serif text-[16px] leading-[1.7] text-ivory-100">
              <span className="text-ivory-600 text-[11px] mr-1.5">{v.verse}</span>
              {v.text}
            </p>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {oiaFields.map((f) => (
          <div key={f.label}>
            <p className="text-gold-400/70 text-[10px] uppercase tracking-[0.15em] font-medium mb-1.5">{f.label}</p>
            <textarea
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              placeholder={f.placeholder}
              className="input-field min-h-[80px] resize-none text-sm"
              style={{ minHeight: '80px' }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={async () => {
          // Save the study as notes
          vibrate(8);
          setStudySaving(true);
          let studyError = false;
          if (observation.trim()) { const r = await saveNote(sel, 'observation', observation.trim(), null); if (!r) studyError = true; }
          if (interpretation.trim()) { const r = await saveNote(sel, 'interpretation', interpretation.trim(), null); if (!r) studyError = true; }
          if (application.trim()) { const r = await saveNote(sel, 'application', application.trim(), null); if (!r) studyError = true; }
          if (prayer.trim()) { const r = await saveNote(sel, 'prayer', prayer.trim(), null); if (!r) studyError = true; }
          setStudySaving(false);
          if (!studyError) onBack();
        }}
        className="btn-primary w-full mt-5"
      >
        <Check size={14} /> {studySaving ? 'Saving...' : 'Save Study'}
      </button>

      <button
        onClick={onAsk}
        className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl bg-ink-800/30 border border-ink-600/20 text-ivory-300 text-sm hover:border-gold-500/30 transition-all no-tap-highlight"
      >
        <Send size={14} className="text-gold-400/70" />
        Ask SOLAPATH about this passage
      </button>
    </div>
  );
}
