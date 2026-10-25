// Build 78 — Today → Ask handoff context.
// When a user taps "Continue in Ask" after a Today reflection,
// Ask receives this structured context so it understands:
// - today's passage
// - what the user wrote
// - what SOLAPATH just said
// without requiring the user to repeat themselves.
//
// The handoff is a single honest first user message. It does NOT
// fabricate prior assistant turns in the new Ask conversation.

export interface AskHandoffContext {
  passageReference: string;
  userReflection: string;
  priorResponseSummary: string;
  language: 'en' | 'es';
}

export function isAskHandoffContext(value: unknown): value is AskHandoffContext {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.passageReference === 'string'
    && typeof v.userReflection === 'string'
    && typeof v.priorResponseSummary === 'string'
    && (v.language === 'en' || v.language === 'es');
}

// Build the first user message Ask sends when handed off from Today.
export function buildHandoffPrompt(ctx: AskHandoffContext): string {
  const lang = ctx.language;
  if (lang === 'es') {
    return [
      `Vengo de Today, reflexionando sobre ${ctx.passageReference}.`,
      `Lo que escribí: ${ctx.userReflection}`,
      `SOLAPATH respondió en Today: ${ctx.priorResponseSummary}`,
      `Quiero seguir conversando sobre esto.`,
    ].join('\n\n');
  }
  return [
    `I'm coming from Today, reflecting on ${ctx.passageReference}.`,
    `What I wrote: ${ctx.userReflection}`,
    `SOLAPATH responded in Today: ${ctx.priorResponseSummary}`,
    `I want to keep talking about this.`,
  ].join('\n\n');
}
