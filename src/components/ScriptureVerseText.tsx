import React, { useMemo, useCallback } from 'react';
import {
  Clock, MapPin, Flame, Crown, Heart, Eye, BookOpen,
  type LucideIcon,
} from 'lucide-react';
import { tokenizeVerse, reconstructVerse, getSelectedText, rangesOverlap, type ScriptureToken } from '@/lib/scriptureTokenizer';
import { getMarkStyleClasses, getPhraseSafeStyle, getMarkingColor, isIconSymbol, type BibleKeywordMark, type BibleKeyword, type HighlightColor } from '@/lib/bibleTypes';

const ICON_MAP: Record<string, LucideIcon> = {
  clock: Clock,
  'map-pin': MapPin,
  flame: Flame,
  crown: Crown,
  heart: Heart,
  eye: Eye,
  'book-open': BookOpen,
};

function getIconComponent(sym: string | null): LucideIcon | null {
  if (!sym || !isIconSymbol(sym)) return null;
  const name = sym.slice(5);
  return ICON_MAP[name] ?? null;
}

interface TokenMark {
  markId: string;
  keyword: BibleKeyword;
  tokenStart: number;
  tokenEnd: number;
  isPhrase: boolean;
}

interface ScriptureVerseTextProps {
  verseNumber: number;
  text: string;
  textSizeClass: string;
  marks: BibleKeywordMark[];
  keywords: BibleKeyword[];
  markingMode: boolean;
  highlightWordMode: boolean;
  highlightWordSelToken: number | null;
  highlightWordEndToken: number | null;
  selectionStartToken: number | null;
  selectionEndToken: number | null;
  adjustMode: boolean;
  onTokenTap: (verse: number, tokenIndex: number) => void;
  onMarkedTokenTap: (markId: string) => void;
}

function buildTokenMarks(marks: BibleKeywordMark[], keywords: BibleKeyword[]): TokenMark[] {
  const result: TokenMark[] = [];
  for (const m of marks) {
    if (m.token_start === null || m.token_end === null) continue;
    const kw = keywords.find((k) => k.id === m.keyword_id);
    if (!kw) continue;
    const isPhrase = m.token_start !== m.token_end;
    result.push({
      markId: m.id,
      keyword: kw,
      tokenStart: m.token_start,
      tokenEnd: m.token_end,
      isPhrase,
    });
  }
  return result;
}

function getMarkForToken(tokenMarks: TokenMark[], tokenIndex: number): TokenMark | undefined {
  return tokenMarks.find((m) => tokenIndex >= Math.min(m.tokenStart, m.tokenEnd) && tokenIndex <= Math.max(m.tokenStart, m.tokenEnd));
}

const ScriptureVerseText: React.FC<ScriptureVerseTextProps> = ({
  verseNumber,
  text,
  textSizeClass,
  marks,
  keywords,
  markingMode,
  highlightWordMode,
  highlightWordSelToken,
  highlightWordEndToken,
  selectionStartToken,
  selectionEndToken,
  adjustMode,
  onTokenTap,
  onMarkedTokenTap,
}) => {
  const tokens = useMemo(() => tokenizeVerse(text), [text]);
  const tokenMarks = useMemo(() => buildTokenMarks(marks, keywords), [marks, keywords]);

  const isTokenSelected = useCallback(
    (idx: number): boolean => {
      if (selectionStartToken === null) return false;
      if (selectionEndToken === null) return idx === selectionStartToken;
      const min = Math.min(selectionStartToken, selectionEndToken);
      const max = Math.max(selectionStartToken, selectionEndToken);
      return idx >= min && idx <= max;
    },
    [selectionStartToken, selectionEndToken],
  );

  return (
    <div className="flex-1">
      <p className={`font-serif ${textSizeClass} text-ivory-100 leading-relaxed`}>
        {tokens.map((token: ScriptureToken) => {
          const isWhitespace = /^\s+$/.test(token.text);
          const mark = getMarkForToken(tokenMarks, token.index);
          const selected = isTokenSelected(token.index);

          if (isWhitespace) {
            return <React.Fragment key={token.index}>{token.text}</React.Fragment>;
          }

          if (mark) {
            const effectiveStyle = mark.isPhrase
              ? getPhraseSafeStyle(mark.keyword.mark_style)
              : mark.keyword.mark_style;
            const styleClasses = getMarkStyleClasses(effectiveStyle, mark.keyword.color_key as HighlightColor, mark.keyword.symbol);
            const ariaLabel = `${token.text}, Scripture marking: ${mark.keyword.name}`;
            const isLastTokenOfMark = token.index === Math.max(mark.tokenStart, mark.tokenEnd);
            const IconComp = getIconComponent(mark.keyword.symbol);
            return (
              <span
                key={token.index}
                data-token-index={token.index}
                data-verse={verseNumber}
                className={`${styleClasses.className} cursor-pointer`}
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkedTokenTap(mark.markId);
                }}
                aria-label={ariaLabel}
                role="mark"
              >
                {token.text}
                {styleClasses.badge && isLastTokenOfMark && (
                  <sup className={`ml-0.5 text-[0.7em] font-bold ${getMarkingColor(mark.keyword.color_key as HighlightColor).text}`}>
                    {styleClasses.badge}
                  </sup>
                )}
                {styleClasses.badgeIcon && isLastTokenOfMark && IconComp && (
                  <sup className={`ml-0.5 inline-flex items-center ${getMarkingColor(mark.keyword.color_key as HighlightColor).text}`} style={{ fontSize: '0.7em' }}>
                    <IconComp size={10} strokeWidth={2.5} />
                  </sup>
                )}
              </span>
            );
          }

          if (markingMode || highlightWordMode) {
            const isHighlightSelected = highlightWordMode && highlightWordSelToken !== null && (
              highlightWordEndToken !== null
                ? token.index >= Math.min(highlightWordSelToken, highlightWordEndToken) && token.index <= Math.max(highlightWordSelToken, highlightWordEndToken)
                : token.index === highlightWordSelToken
            );
            return (
              <span
                key={token.index}
                data-token-index={token.index}
                data-verse={verseNumber}
                className={`cursor-pointer rounded-sm transition-colors ${
                  isHighlightSelected
                    ? 'bg-gold-500/30 text-gold-100 border-b-2 border-gold-400/60 rounded-b-sm'
                    : selected
                      ? 'bg-gold-500/30 text-gold-100 border-b-2 border-gold-400/60 rounded-b-sm'
                      : adjustMode
                        ? 'hover:bg-ivory-500/10 ring-1 ring-transparent hover:ring-gold-500/20'
                        : 'hover:bg-ivory-500/10'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onTokenTap(verseNumber, token.index);
                }}
                role="button"
                tabIndex={0}
                aria-label={isHighlightSelected ? `${token.text}, selected for highlight` : selected ? `${token.text}, selected` : token.text}
                aria-pressed={isHighlightSelected || selected}
              >
                {token.text}
              </span>
            );
          }

          return <React.Fragment key={token.index}>{token.text}</React.Fragment>;
        })}
      </p>
    </div>
  );
};

export default React.memo(ScriptureVerseText);
export { reconstructVerse, rangesOverlap };
