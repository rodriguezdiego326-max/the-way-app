import { useState, useEffect } from 'react';
import { BookOpen, ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react';
import { parsePassageReference } from '@/lib/passageParser';
import { fetchVerses } from '@/lib/bibleEngine';
import { getBookDisplayName, type BibleTranslation } from '@/lib/bibleTypes';
import { vibrate } from '@/lib/utils';

const COLLAPSE_THRESHOLD = 4;

interface ScriptureBlockProps {
  reference: string;
  translation: BibleTranslation;
  onOpenBible: (reference: string) => void;
  onTextStatus?: (reference: string, translation: BibleTranslation, available: boolean) => void;
}

export default function ScriptureBlock({ reference, translation, onOpenBible, onTextStatus }: ScriptureBlockProps) {
  const [verses, setVerses] = useState<{ verse: number; text: string }[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setVerses(null);
    onTextStatus?.(reference, translation, false);
    const parsed = parsePassageReference(reference);
    if (!parsed || parsed.verseStart === null || parsed.verseEnd === null) {
      setFailed(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setExpanded(false);
    fetchVerses(parsed.book, parsed.chapter, parsed.verseStart, parsed.verseEnd, translation)
      .then((result) => {
        if (cancelled) return;
        if (result.verses.length !== parsed.verseEnd! - parsed.verseStart! + 1) {
          setFailed(true);
        } else {
          setVerses(result.verses);
          onTextStatus?.(reference, translation, true);
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [reference, translation, onTextStatus]);

  if (loading) {
    return (
      <div className="my-3 px-4 py-3 rounded-xl bg-ink-800/25 border border-ink-600/15 animate-pulse">
        <p className="text-ivory-600 text-xs italic">Loading Scripture...</p>
      </div>
    );
  }

  if (failed || !verses) return null;

  const displayRef = (() => {
    const parsed = parsePassageReference(reference);
    if (!parsed) return reference;
    const bookName = getBookDisplayName(parsed.book, translation);
    if (parsed.verseStart === parsed.verseEnd) {
      return `${bookName} ${parsed.chapter}:${parsed.verseStart}`;
    }
    return `${bookName} ${parsed.chapter}:${parsed.verseStart}\u2013${parsed.verseEnd}`;
  })();

  const shouldCollapse = verses.length > COLLAPSE_THRESHOLD;
  const visibleVerses = shouldCollapse && !expanded ? verses.slice(0, COLLAPSE_THRESHOLD) : verses;

  return (
    <div className="my-3.5 px-4 py-3.5 rounded-xl bg-ink-800/25 border border-ink-600/15 border-l-2 border-l-gold-500/35">
      <button
        onClick={() => { vibrate(8); onOpenBible(reference); }}
        className="block w-full text-left"
      >
        <div className="flex items-center gap-1.5 mb-2.5">
          <BookOpen size={11} className="text-gold-400/60 shrink-0" />
          <p className="text-gold-300/90 text-xs font-medium font-serif">{displayRef}</p>
          <span className="text-ivory-700 text-[9px] ml-auto uppercase tracking-[0.15em]">{translation}</span>
        </div>
        <div className="space-y-1">
          {visibleVerses.map((v) => (
            <p key={v.verse} className="text-ivory-200 text-[14px] leading-[1.6] font-serif">
              <sup className="text-gold-400/40 text-[9px] mr-0.5">{v.verse}</sup>
              {v.text}
            </p>
          ))}
        </div>
      </button>
      {shouldCollapse && (
        <button
          onClick={(e) => { e.stopPropagation(); vibrate(4); setExpanded(!expanded); }}
          className="flex items-center gap-1 mt-2 text-gold-400/50 text-xs hover:text-gold-300/80 transition-colors no-tap-highlight"
        >
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          {expanded ? 'Show less' : `Show full passage (${verses.length} verses)`}
        </button>
      )}
      <button
        onClick={() => { vibrate(8); onOpenBible(reference); }}
        className="flex items-center gap-1 mt-2.5 text-gold-400/45 text-xs hover:text-gold-300/70 transition-colors no-tap-highlight"
      >
        <span className="font-medium">Open in Bible</span>
        <ArrowUpRight size={11} />
      </button>
    </div>
  );
}
