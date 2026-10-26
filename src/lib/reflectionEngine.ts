// ============================================================
// SOLAPATH Reflection Intelligence — Build 78
// Today's Walk reflection layer.
//
// AI is the servant. Scripture is the authority.
//
// This engine wraps the existing Human Conversation Intelligence
// service (the-way-intelligence) so Today can offer a thoughtful,
// Scripture-grounded response to a user's saved reflection WITHOUT
// becoming a duplicate Ask screen.
//
// It does NOT:
// - modify the Memory Engine
// - modify Ask provider routing
// - bypass RLS
// - merge AI prose into the user's authored reflection
//
// The user's reflection is stored in walk_reflections.body.
// SOLAPATH's generated response is stored separately in
// walk_reflections.ai_response (jsonb).
// ============================================================

import { supabase } from './supabase';
import { fetchIntelligenceResponse, retrieveStudyMemoryEvidence } from './intelligenceService';
import type { StructuredTheologicalResponse } from './intelligenceTypes';
import type { Profile, WalkReflection, WalkReflectionAIResponse } from './types';
import type { BibleTranslation } from './bibleTypes';

export interface ReflectionContext {
  passageReference: string;
  passageText: string | null;
  readingObjective: string | null;
  observationPrompt: string | null;
  reflectionQuestion: string | null;
}

export interface GenerateReflectionResponseArgs {
  reflection: string;
  context: ReflectionContext;
  profile: Profile | null;
  theologicalDepth: string;
  translation: BibleTranslation;
}

export interface GenerateReflectionResponseResult {
  response: StructuredTheologicalResponse;
  reflectionPrompt: string;
}

const MIN_SUBSTANTIVE_LENGTH = 4;

export function isSubstantiveReflection(text: string | null | undefined): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < MIN_SUBSTANTIVE_LENGTH) return false;
  // Reject inputs that are only punctuation / symbols / whitespace
  if (!/[A-Za-zÁ-úÀ-ÿÑñ]/.test(trimmed)) return false;
  return true;
}

export function reflectionContainsQuestion(text: string): boolean {
  return /\?|^(why|how|what|when|where|who|por qu|c|mo|qu|cu|dnde|quin)/i.test(text.trim());
}

// Build the prompt sent to the intelligence layer.
// The Today passage is the PRIMARY interpretive anchor — the response
// must center it, not substitute another passage. The user's reflection
// is treated honestly as journal content, not a generic Ask question.
function buildReflectionPrompt(reflection: string, ctx: ReflectionContext, translation: BibleTranslation): string {
  const lang = translation === 'RV1909' ? 'es' : 'en';
  const passageHeader = lang === 'es'
    ? `Pasaje asignado de hoy: ${ctx.passageReference}`
    : `Today's assigned passage: ${ctx.passageReference}`;
  const anchor = lang === 'es'
    ? `Estás respondiendo dentro del Walk de Today, no en Ask general. El pasaje asignado de hoy es ${ctx.passageReference}. Tu respuesta DEBE interpretar y aplicar ese pasaje primero y tratarlo como el contexto bíblico principal. No sustituyas otro pasaje como respuesta principal. Puedes mencionar pasajes complementarios brevemente, pero ${ctx.passageReference} debe ser el centro de tu respuesta. No comiences buscando escritura no relacionada.`
    : `You are responding inside Today's Walk, not general Ask. The assigned Today passage is ${ctx.passageReference}. Your response MUST interpret and apply that passage first and treat it as the primary biblical context. Do not substitute another passage as the main answer. You may mention complementary passages briefly, but ${ctx.passageReference} must be the center of your response. Do not begin by searching unrelated Scripture.`;
  const passageTextLabel = lang === 'es' ? 'Texto del pasaje' : 'Passage text';
  const reflectionLabel = lang === 'es' ? 'Lo que escribió el usuario' : 'What the user wrote';
  const instruction = lang === 'es'
    ? 'Esto es una reflexión personal de Today, no una pregunta genérica de Ask. Responde con tono humano conversacional, sin sermón automático. Si hay una pregunta, respóndela directamente. Si es solo una reflexión, reconócela brevemente y conecta el pasaje con lo que escribió. No inventes escritura ni autentiques revelación privada. Escribe en español latinoamericano natural y conversacional, no en prosa académica formal. Usa oraciones naturales, contracciones comunes del español hablado donde aplique, y un tono cálido sin lenguaje de manual.'
    : 'This is a personal reflection from Today, not a generic Ask question. Respond in a human conversational tone, without automatic sermonizing. If there is a question, answer it directly. If it is only a reflection, acknowledge it briefly and connect the passage to what they wrote. Do not invent Scripture or authenticate private revelation.';

  const parts: string[] = [
    passageHeader,
    anchor,
  ];
  if (ctx.passageText) {
    parts.push(`${passageTextLabel}: ${ctx.passageText}`);
  }
  parts.push(`${reflectionLabel}: ${reflection}`);
  parts.push(instruction);
  return parts.join('\n\n');
}

// Build a corrective prompt that re-asserts the assigned passage constraint
// after a validation failure. Used for the single retry attempt.
function buildCorrectiveReflectionPrompt(
  reflection: string,
  ctx: ReflectionContext,
  translation: BibleTranslation,
  originalPrompt: string,
  priorAnswer: string,
): string {
  const lang = translation === 'RV1909' ? 'es' : 'en';
  const correction = lang === 'es'
    ? `CORRECCIÓN: Tu respuesta anterior centró un pasaje distinto a ${ctx.passageReference}. Debes volver a intentarlo. El pasaje asignado de hoy es ${ctx.passageReference}. Tu respuesta DEBE interpretar y aplicar ${ctx.passageReference} como el pasaje principal. No sustituyas otro pasaje. La respuesta del usuario está conectada a este pasaje específico — responde desde este pasaje.`
    : `CORRECTION: Your previous response centered a passage other than ${ctx.passageReference}. You must try again. The assigned Today passage is ${ctx.passageReference}. Your response MUST interpret and apply ${ctx.passageReference} as the primary passage. Do not substitute another passage. The user's reflection is connected to this specific passage — respond from this passage.`;
  const priorLabel = lang === 'es' ? 'Respuesta anterior (incorrecta)' : 'Previous response (incorrect)';
  return [
    correction,
    `${priorLabel}: ${priorAnswer}`,
    '',
    originalPrompt,
  ].join('\n\n');
}

// Check whether the generated response centers the assigned passage.
// Returns false if the answer_summary prominently features a different
// passage reference while ignoring the assigned one.
function responseCentersAssignedPassage(
  answerSummary: string,
  assignedReference: string,
): boolean {
  const assignedNorm = normalizePassageRef(assignedReference);
  if (!assignedNorm) return true; // cannot validate, allow through
  const answerLower = answerSummary.toLowerCase();
  const assignedLower = assignedNorm.toLowerCase();

  // Does the answer mention the assigned passage?
  const mentionsAssigned = answerLower.includes(assignedLower) ||
    answerLower.includes(assignedReference.toLowerCase());

  // Extract all passage-like references from the answer
  const refPattern = /(?:1\s*|2\s*|3\s*)?(?:genesis|exodus|leviticus|numbers|deuteronomy|joshua|judges|ruth|1\s*samuel|2\s*samuel|1\s*kings|2\s*kings|1\s*chronicles|2\s*chronicles|ezra|nehemiah|esther|job|psalm|psalms|proverbs|ecclesiastes|song\s*of\s*songs|isaiah|jeremiah|lamentations|ezekiel|daniel|hosea|joel|amos|obadiah|jonah|micah|nahum|habakkuk|zephaniah|haggai|zechariah|malachi|matthew|mark|luke|john|acts|romans|1\s*corinthians|2\s*corinthians|galatians|ephesians|philippians|colossians|1\s*thessalonians|2\s*thessalonians|1\s*timothy|2\s*timothy|titus|philemon|hebrews|james|1\s*peter|2\s*peter|1\s*john|2\s*john|3\s*john|jude|revelation|génesis|éxodo|levítico|números|deuteronomio|josué|jueces|rut|samuel|reyes|crónicas|esdras|nehemías|ester|salmos|proverbios|eclesiastés|cantares|isaías|jeremías|lamentaciones|ezequiel|daniel|oseas|abdías|jonás|miqueas|sofonías|hageo|zacarías|malaquías|mateo|marcos|lucas|juan|hechos|romanos|corintios|gálatas|efesios|filipenses|colosenses|tesalonicenses|timoteo|tito|filemón|hebreos|santiago|pedro|apocalipsis)\s+\d+:\d+(?:-\d+)?/gi;
  const foundRefs = answerLower.match(refPattern) || [];

  // Normalize found refs for comparison
  const otherRefs = foundRefs
    .map((r) => r.replace(/\s+/g, ' ').trim())
    .filter((r) => !r.includes(assignedLower) && !r.includes(assignedReference.toLowerCase()));

  // If the answer doesn't mention the assigned passage AND mentions other passages, it's not grounded
  if (!mentionsAssigned && otherRefs.length > 0) {
    return false;
  }

  return true;
}

// Normalize a passage reference for comparison (handles English/Spanish book names)
function normalizePassageRef(ref: string): string | null {
  const match = ref.trim().match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) return null;
  const lower = match[1].toLowerCase().trim();
  const SPANISH_TO_ENG: Record<string, string> = {
    'mateo': 'matthew', 'marcos': 'mark', 'lucas': 'luke', 'juan': 'john',
    'hechos': 'acts', 'romanos': 'romans', 'corintios': 'corinthians',
    'gálatas': 'galatians', 'galatas': 'galatians', 'efesios': 'ephesians',
    'filipenses': 'philippians', 'colosenses': 'colossians',
    'tesalonicenses': 'thessalonians', 'timoteo': 'timothy', 'filemón': 'philemon',
    'filemon': 'philemon', 'hebreos': 'hebrews', 'santiago': 'james',
    'pedro': 'peter', 'apocalipsis': 'revelation', 'salmos': 'psalm',
    'proverbios': 'proverbs', 'salmo': 'psalm', 'génesis': 'genesis',
    'éxodo': 'exodus', 'levítico': 'leviticus', 'números': 'numbers',
    'deuteronomio': 'deuteronomy', 'josué': 'joshua', 'jueces': 'judges',
    'rut': 'ruth', 'reyes': 'kings', 'crónicas': 'chronicles',
    'esdras': 'ezra', 'nehemías': 'nehemiah', 'ester': 'esther',
    'isaías': 'isaiah', 'jeremías': 'jeremiah', 'ezequiel': 'ezekiel',
    'daniel': 'daniel', 'oseas': 'hosea', 'joel': 'joel', 'amos': 'amos',
    'abdías': 'obadiah', 'jonás': 'jonah', 'miqueas': 'micah',
    'nahum': 'nahum', 'habacuc': 'habakkuk', 'sofonías': 'zephaniah',
    'hageo': 'haggai', 'zacarías': 'zechariah', 'malaquías': 'malachi',
    'cantares': 'song of solomon', 'eclesiastés': 'ecclesiastes',
  };
  const canonicalBook = SPANISH_TO_ENG[lower] || lower;
  const versePart = match[4] ? `${match[2]}:${match[3]}-${match[4]}` : `${match[2]}:${match[3]}`;
  return `${canonicalBook} ${versePart}`;
}

export async function generateReflectionResponse(
  args: GenerateReflectionResponseArgs,
): Promise<GenerateReflectionResponseResult> {
  const { reflection, context, profile, theologicalDepth, translation } = args;
  // The edge function checks response_language === 'Spanish' for its Spanish
  // code paths, and buildUserContext passes the value through to the model
  // with "Write the answer_summary ... in {response_language}". Sending 'es'
  // produces "Write in es" (a code, not a language name) and fails the
  // 'Spanish' check. Send the full language name instead.
  const responseLanguage = translation === 'RV1909' ? 'Spanish' : 'English';
  const reflectionPrompt = buildReflectionPrompt(reflection, context, translation);

  const studyMemoryEvidence = await retrieveStudyMemoryEvidence(reflectionPrompt, profile);

  let response = await fetchIntelligenceResponse(
    reflectionPrompt,
    profile,
    theologicalDepth,
    [], // no prior conversation history — Today reflection is a single turn
    `today-reflection-${context.passageReference}`,
    responseLanguage,
    studyMemoryEvidence,
  );

  // Primary-passage validation: if the response centered a different passage
  // while ignoring the assigned Today passage, retry once with a corrective
  // prompt. Do not create an infinite retry loop.
  if (!responseCentersAssignedPassage(response.answer_summary, context.passageReference)) {
    const correctivePrompt = buildCorrectiveReflectionPrompt(
      reflection,
      context,
      translation,
      reflectionPrompt,
      response.answer_summary,
    );
    const correctiveMemoryEvidence = await retrieveStudyMemoryEvidence(correctivePrompt, profile);
    response = await fetchIntelligenceResponse(
      correctivePrompt,
      profile,
      theologicalDepth,
      [],
      `today-reflection-${context.passageReference}`,
      responseLanguage,
      correctiveMemoryEvidence,
    );
  }

  return { response, reflectionPrompt };
}

// Persist the user's reflection (body) and, separately, the AI response.
// If a walk_reflection row already exists for this walk, update its
// ai_response only — never overwrite the user's authored body.
export async function saveReflectionAndResponse(
  walkId: string,
  reflection: string,
  result: GenerateReflectionResponseResult,
  context: ReflectionContext,
  translation: BibleTranslation,
): Promise<WalkReflection | null> {
  const aiResponse: WalkReflectionAIResponse = {
    answer_summary: result.response.answer_summary,
    passage_reference: context.passageReference,
    reflection_prompt: result.reflectionPrompt,
    response_language: translation === 'RV1909' ? 'es' : 'en',
    generated_at: new Date().toISOString(),
    structured: result.response,
  };

  const { data: existing } = await supabase
    .from('walk_reflections')
    .select('id, body')
    .eq('walk_id', walkId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { data: updated, error } = await supabase
      .from('walk_reflections')
      .update({ ai_response: aiResponse as unknown as Record<string, unknown> })
      .eq('id', existing.id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return updated as WalkReflection | null;
  }

  const { data: created, error } = await supabase
    .from('walk_reflections')
    .insert({
      walk_id: walkId,
      body: reflection.trim(),
      input_mode: 'text',
      ai_response: aiResponse as unknown as Record<string, unknown>,
    })
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return created as WalkReflection | null;
}

// Persist only the user's reflection (no AI response yet).
export async function saveUserReflection(walkId: string, reflection: string): Promise<WalkReflection | null> {
  const { data: existing } = await supabase
    .from('walk_reflections')
    .select('id, body')
    .eq('walk_id', walkId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    // Don't overwrite an existing body if it has content already.
    if (existing.body && existing.body.trim().length > 0) {
      return null;
    }
    const { data: updated } = await supabase
      .from('walk_reflections')
      .update({ body: reflection.trim() })
      .eq('id', existing.id)
      .select('*')
      .maybeSingle();
    return updated as WalkReflection | null;
  }

  const { data: created } = await supabase
    .from('walk_reflections')
    .insert({
      walk_id: walkId,
      body: reflection.trim(),
      input_mode: 'text',
    })
    .select('*')
    .maybeSingle();
  return created as WalkReflection | null;
}

// Strict update-by-id: updates exactly one reflection row by its known id.
// No walk_id fallback, no insert fallback. Performs a read-back SELECT after
// the UPDATE and verifies the persisted body matches the requested body.
// When body materially changes, also verifies ai_response was cleared to null.
// Throws on any mismatch so the caller can keep edit mode open and surface
// an error instead of showing a false success state.
export async function updateUserReflectionById(
  reflectionId: string,
  newBody: string,
): Promise<WalkReflection> {
  const trimmed = newBody.trim();

  const { data: existing, error: selectErr } = await supabase
    .from('walk_reflections')
    .select('id, body, ai_response')
    .eq('id', reflectionId)
    .maybeSingle();
  if (selectErr) throw selectErr;
  if (!existing) {
    throw new Error('Reflection row not found. Please reload and try again.');
  }

  const existingRow = existing as { id: string; body: string | null; ai_response: unknown };
  const bodyChanged = (existingRow.body ?? '').trim() !== trimmed;

  const patch: { body: string; ai_response?: null } = { body: trimmed };
  if (bodyChanged) patch.ai_response = null;

  const { error: updateErr } = await supabase
    .from('walk_reflections')
    .update(patch)
    .eq('id', reflectionId);
  if (updateErr) throw updateErr;

  // Read-back verification: fresh SELECT by id to confirm the database
  // actually persisted the new body (and cleared ai_response if changed).
  const { data: verified, error: readbackErr } = await supabase
    .from('walk_reflections')
    .select('*')
    .eq('id', reflectionId)
    .maybeSingle();
  if (readbackErr) throw readbackErr;
  if (!verified) {
    throw new Error('Reflection could not be verified after save. Please try again.');
  }

  const verifiedRow = verified as WalkReflection;

  if (verifiedRow.body?.trim() !== trimmed) {
    throw new Error('Saved reflection did not match. Please try again.');
  }

  if (bodyChanged && verifiedRow.ai_response !== null) {
    throw new Error('Previous response could not be cleared. Please try again.');
  }

  return verifiedRow;
}

// Load the most recent walk_reflection for a given walk (with AI response if present).
export async function loadWalkReflection(walkId: string): Promise<WalkReflection | null> {
  const { data, error } = await supabase
    .from('walk_reflections')
    .select('*')
    .eq('walk_id', walkId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data as WalkReflection | null;
}
