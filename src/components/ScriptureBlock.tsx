import { useState, useEffect } from 'react';
import { BookOpen, ArrowUpRight } from 'lucide-react';
import { parsePassageReference } from '@/lib/passageParser';
import { fetchVerses } from '@/lib/bibleEngine';
import { getBookDisplayName, type BibleTranslation } from '@/lib/bibleTypes';
import { vibrate } from '@/lib/utils';

interface ScriptureBlockProps {
  reference: string;
  translation: BibleTranslation;
  onOpenBible: (reference: string) => void;
}

export default function ScriptureBlock({ reference, translation, onOpenBible }: ScriptureBlockProps) {
  const [verses, setVerses] = useState<{ verse: number; text: string }[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const parsed = parsePassageReference(reference);
    if (!parsed || parsed.verseStart === null || parsed.verseEnd === null) {
      setFailed(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchVerses(parsed.book, parsed.chapter, parsed.verseStart, parsed.verseEnd, translation)
      .then((result) => {
        if (cancelled) return;
        if (result.verses.length === 0) {
          setFailed(true);
        } else {
          setVerses(result.verses);
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [reference, translation]);

  if (loading) {
    return (
      <div className="my-3 px-4 py-3 rounded-xl bg-ink-800/40 border border-ink-600/20 animate-pulse">
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

  return (
    <div className="my-3 px-4 py-3 rounded-xl bg-ink-800/30 border border-gold-500/15 border-l-2 border-l-gold-500/40">
      <button
        onClick={() => { vibrate(8); onOpenBible(reference); }}
        className="block w-full text-left"
      >
        <div className="flex items-center gap-1.5 mb-2">
          <BookOpen size={12} className="text-gold-400/70 shrink-0" />
          <p className="text-gold-300 text-xs font-medium font-serif">{displayRef}</p>
          <span className="text-ivory-600 text-[10px] ml-auto uppercase tracking-wider">{translation}</span>
        </div>
        <div className="space-y-1">
          {verses.map((v) => (
            <p key={v.verse} className="text-ivory-200 text-[15px] leading-[1.65] font-serif">
              <sup className="text-gold-400/50 text-[10px] mr-0.5">{v.verse}</sup>
              {v.text}
            </p>
          ))}
        </div>
        <div className="flex items-center gap-1 mt-2 text-gold-400/60 text-xs">
          <span className="font-medium">Open in Bible</span>
          <ArrowUpRight size={12} />
        </div>
      </button>
    </div>
  );
}
