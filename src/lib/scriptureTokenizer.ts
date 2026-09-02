export interface ScriptureToken {
  index: number;
  text: string;
  startOffset: number;
  endOffset: number;
}

/**
 * Tokenize Scripture verse text into stable, deterministic tokens.
 * Preserves all whitespace, punctuation, capitalization, and special characters.
 * The reconstructed text from tokens is guaranteed to equal the original.
 *
 * Tokenization splits on whitespace boundaries: each token is a maximal
 * sequence of non-whitespace characters. Whitespace between tokens is
 * preserved as separate "space" tokens so reconstruction is exact.
 */
export function tokenizeVerse(text: string): ScriptureToken[] {
  const tokens: ScriptureToken[] = [];
  let index = 0;
  let offset = 0;

  // Split into whitespace runs and non-whitespace runs
  const re = /(\s+|\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const piece = match[0];
    tokens.push({
      index,
      text: piece,
      startOffset: offset,
      endOffset: offset + piece.length,
    });
    index++;
    offset += piece.length;
  }

  return tokens;
}

/**
 * Reconstruct the original verse text from tokens.
 * Guaranteed to equal the original text passed to tokenizeVerse.
 */
export function reconstructVerse(tokens: ScriptureToken[]): string {
  return tokens.map((t) => t.text).join('');
}

/**
 * Get the selected text between token indices (inclusive).
 */
export function getSelectedText(tokens: ScriptureToken[], tokenStart: number, tokenEnd: number): string {
  const start = Math.min(tokenStart, tokenEnd);
  const end = Math.max(tokenStart, tokenEnd);
  return tokens.slice(start, end + 1).map((t) => t.text).join('');
}

/**
 * Check if two token ranges overlap.
 */
export function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  const aMin = Math.min(aStart, aEnd);
  const aMax = Math.max(aStart, aEnd);
  const bMin = Math.min(bStart, bEnd);
  const bMax = Math.max(bStart, bEnd);
  return aMin <= bMax && bMin <= aMax;
}
