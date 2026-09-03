import React, { useMemo, useCallback } from 'react';
import {
  Clock, MapPin, Flame, Crown, Heart, Eye, BookOpen,
  type LucideIcon,
} from 'lucide-react';
import { tokenizeVerse, reconstructVerse, getSelectedText, rangesOverlap, type ScriptureToken } from '@/lib/scriptureTokenizer';
import { getMarkStyleClasses, getPhraseSafeStyle, getMarkingColor, isIconSymbol, type BibleKeywordMark, type BibleKeyword, type HighlightColor, type BibleHighlight } from '@/lib/bibleTypes';

const HIGHLIGHT_COLOR_CLASSES: Record<string, string> = {
  gold: 'bg-gold-500/25 text-gold-100 rounded-sm',
  amber: 'bg-amber-500/25 text-amber-100 rounded-sm',
  orange: 'bg-orange-500/25 text-orange-100 rounded-sm',
  coral: 'bg-coral-500/25 text-coral-100 rounded-sm',
  red: 'bg-red-500/25 text-red-100 rounded-sm',
  rose: 'bg-rose-500/25 text-rose-100 rounded-sm',
  violet: 'bg-violet-500/25 text-violet-100 rounded-sm',
  purple: 'bg-purple-500/25 text-purple-100 rounded-sm',
  indigo: 'bg-indigo-500/25 text-indigo-100 rounded-sm',
  blue: 'bg-blue-500/25 text-blue-100 rounded-sm',
  teal: 'bg-teal-500/25 text-teal-100 rounded-sm',
  green: 'bg-green-500/25 text-green-100 rounded-sm',
  sage: 'bg-sage-500/25 text-sage-100 rounded-sm',
};

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
  tokenHighlights?: BibleHighlight[];
  onTokenTap: (verse: number, tokenIndex: number) => void;
  onMarkedTokenTap: (markId: string) => void;
  onHighlightTokenTap: (highlightId: string) => void;
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
  tokenHighlights,
  onTokenTap,
  onMarkedTokenTap,
  onHighlightTokenTap,
}) => {
  const tokens = useMemo(() => tokenizeVerse(text), [text]);
  const tokenMarks = useMemo(() => buildTokenMarks(marks, keywords), [marks, keywords]);

  const getTokenHl = useCallback(
    (idx: number): BibleHighlight | undefined => {
      if (!tokenHighlights) return undefined;
      return tokenHighlights.find((h) => h.token_start !== null && h.token_end !== null && idx >= Math.min(h.token_start!, h.token_end!) && idx <= Math.max(h.token_start!, h.token_end!));
    },
    [tokenHighlights],
  );

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

          const tokenHl = getTokenHl(token.index);
          if (tokenHl) {
            const hlColorClass = HIGHLIGHT_COLOR_CLASSES[tokenHl.color_key as HighlightColor] || HIGHLIGHT_COLOR_CLASSES.gold;
            return (
              <span
                key={token.index}
                data-token-index={token.index}
                data-verse={verseNumber}
                className={`${hlColorClass} cursor-pointer`}
                onClick={(e) => {
                  e.stopPropagation();
                  onHighlightTokenTap(tokenHl.id);
                }}
              >
                {token.text}
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
