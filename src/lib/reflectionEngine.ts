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
// The passage is the first interpretive anchor; the user's reflection
// is treated honestly as journal content, not a generic Ask question.
function buildReflectionPrompt(reflection: string, ctx: ReflectionContext, translation: BibleTranslation): string {
  const lang = translation === 'RV1909' ? 'es' : 'en';
  const passageHeader = lang === 'es'
    ? `Pasaje de hoy: ${ctx.passageReference}`
    : `Today's passage: ${ctx.passageReference}`;
  const anchor = lang === 'es'
    ? 'Ancla tu respuesta primeramente en este pasaje. No comiences buscando escritura no relacionada.'
    : 'Anchor your response first in this passage. Do not begin by searching unrelated Scripture.';
  const passageTextLabel = lang === 'es' ? 'Texto del pasaje' : 'Passage text';
  const reflectionLabel = lang === 'es' ? 'Lo que escribió el usuario' : 'What the user wrote';
  const instruction = lang === 'es'
    ? 'Esto es una reflexión personal de Today, no una pregunta genérica de Ask. Responde con tono humano conversacional, sin sermón automático. Si hay una pregunta, respóndela directamente. Si es solo una reflexión, reconócela brevemente y conecta el pasaje con lo que escribió. No inventes escritura ni autentiques revelación privada.'
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

export async function generateReflectionResponse(
  args: GenerateReflectionResponseArgs,
): Promise<GenerateReflectionResponseResult> {
  const { reflection, context, profile, theologicalDepth, translation } = args;
  const responseLanguage = translation === 'RV1909' ? 'es' : 'en';
  const reflectionPrompt = buildReflectionPrompt(reflection, context, translation);

  const studyMemoryEvidence = await retrieveStudyMemoryEvidence(reflectionPrompt, profile);

  const response = await fetchIntelligenceResponse(
    reflectionPrompt,
    profile,
    theologicalDepth,
    [], // no prior conversation history — Today reflection is a single turn
    `today-reflection-${context.passageReference}`,
    responseLanguage,
    studyMemoryEvidence,
  );

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
