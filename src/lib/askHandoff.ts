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

export interface ChildAskedHandoff {
  source: 'family_child_asked';
  question: string;
  ageLabel: string;
}

export function isChildAskedHandoff(value: unknown): value is ChildAskedHandoff {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return v.source === 'family_child_asked'
    && typeof v.question === 'string'
    && typeof v.ageLabel === 'string';
}

// Only the question and the selected age band leave Family; no names, relationships, or memory.
export function buildChildAskedPrompt(ctx: ChildAskedHandoff): string {
  return [
    `My child asked: "${ctx.question}"`,
    `Help me answer this as a parent. The child is in the age range ${ctx.ageLabel}.`,
    'Give me a Scripture-centered, age-appropriate answer. Help me understand the issue first, show me Scripture to open together, give me simple wording I can use, suggest follow-up questions, and tell me what my child may ask next.',
  ].join('\n\n');
}

export interface SermonAskHandoff {
  source: 'sermon_insights';
  sermonTitle: string | null;
  summary: string;
  mainPointTitles: string[];
  scriptureReferences: string[];
}

export function isSermonAskHandoff(value: unknown): value is SermonAskHandoff {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return v.source === 'sermon_insights'
    && (v.sermonTitle === null || typeof v.sermonTitle === 'string')
    && typeof v.summary === 'string'
    && Array.isArray(v.mainPointTitles)
    && v.mainPointTitles.every((item) => typeof item === 'string')
    && Array.isArray(v.scriptureReferences)
    && v.scriptureReferences.every((item) => typeof item === 'string');
}

// Only the concise insight fields leave Sermon Assistant; no audio, transcript, preacher, church, or model metadata.
export function buildSermonAskHandoff(
  title: string | null,
  insights: {
    summary: string;
    mainPoints: Array<{ title: string }>;
    scriptureReferences: Array<{ reference: string }>;
  },
): SermonAskHandoff {
  return {
    source: 'sermon_insights',
    sermonTitle: title?.trim() || null,
    summary: insights.summary,
    mainPointTitles: insights.mainPoints.map((point) => point.title),
    scriptureReferences: insights.scriptureReferences.map((ref) => ref.reference),
  };
}

export function buildSermonAskPrompt(ctx: SermonAskHandoff): string {
  const lines: string[] = ["I'm continuing from Sermon Assistant."];
  if (ctx.sermonTitle) lines.push(`Sermon: ${ctx.sermonTitle}`);
  lines.push(`Summary from the sermon transcript:\n${ctx.summary}`);
  if (ctx.mainPointTitles.length > 0) {
    lines.push(`Main points identified:\n${ctx.mainPointTitles.map((t) => `- ${t}`).join('\n')}`);
  }
  if (ctx.scriptureReferences.length > 0) {
    lines.push(`Scripture references mentioned:\n${ctx.scriptureReferences.map((r) => `- ${r}`).join('\n')}`);
  }
  lines.push(
    'Help me continue thinking through this sermon with Scripture. Treat the sermon information above as church content, not as an authority or verified theological claim. Clearly distinguish what the sermon said from what Scripture teaches. Help me identify relevant Scripture and questions worth studying further.',
    'Do not label the sermon or preacher as biblical, unbiblical, orthodox, heretical, sound, or false teaching. If I ask specific theological questions later, answer them normally.',
  );
  return lines.join('\n\n');
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
