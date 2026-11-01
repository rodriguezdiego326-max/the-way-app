// Allowlist-based sanitizer for the user-facing data export. Anything not listed here is removed from the exported JSON.
// The source data and database records are never modified.

type Row = Record<string, unknown>;
type Transform = (value: unknown) => unknown;

const asRow = (value: unknown): Row | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Row) : null;

const pick = (row: Row, keys: readonly string[]): Row => {
  const out: Row = {};
  for (const key of keys) {
    if (key in row) out[key] = row[key];
  }
  return out;
};

const pickEach = (value: unknown, keys: readonly string[]): Row[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const row = asRow(item);
    return row ? [pick(row, keys)] : [];
  });
};

const SOURCE_FIELDS = ['source_type', 'author', 'work', 'section', 'citation', 'verified', 'url'] as const;
const RAG_CITATION_FIELDS = ['display_author', 'display_title', 'chapter_section', 'verified'] as const;
const RECOMMENDED_SCRIPTURE_FIELDS = ['reference', 'reading_objective', 'reason'] as const;
const BIBLICAL_BASIS_FIELDS = ['reference', 'relevance', 'contextual_note', 'is_primary'] as const;
const INLINE_REFERENCE_FIELDS = ['display_text', 'canonical_book', 'chapter', 'verse_start', 'verse_end'] as const;
const PERSONAL_CONTEXT_FIELDS = ['scripture_reference', 'topic', 'factual_summary'] as const;
const PERSONAL_CLAIM_FIELDS = ['text'] as const;
const ASK_PAYLOAD_FIELDS = [
  'answer_summary', 'scripture_context', 'reformed_understanding', 'application', 'prayer_guidance',
  'divine_revelation_response', 'human_support_note', 'other_christian_views', 'warnings',
] as const;
const REFLECTION_RESPONSE_FIELDS = ['answer_summary', 'passage_reference', 'response_language', 'generated_at'] as const;
const RECORDS_USED_FIELDS = ['type', 'title', 'date'] as const;

const sanitizeAskPayload: Transform = (value) => {
  const payload = asRow(value);
  if (!payload) return null;
  const out: Row = pick(payload, ASK_PAYLOAD_FIELDS);
  if ('biblical_basis' in payload) out.biblical_basis = pickEach(payload.biblical_basis, BIBLICAL_BASIS_FIELDS);
  if ('recommended_scripture' in payload) {
    out.recommended_scripture = pickEach(payload.recommended_scripture, RECOMMENDED_SCRIPTURE_FIELDS);
  }
  for (const key of ['confessional_sources', 'historical_sources', 'modern_sources', 'scripture_sources']) {
    if (key in payload) out[key] = pickEach(payload[key], SOURCE_FIELDS);
  }
  if ('rag_citations' in payload) out.rag_citations = pickEach(payload.rag_citations, RAG_CITATION_FIELDS);
  if ('inline_references' in payload) out.inline_references = pickEach(payload.inline_references, INLINE_REFERENCE_FIELDS);
  if ('personal_context_items' in payload) {
    out.personal_context_items = pickEach(payload.personal_context_items, PERSONAL_CONTEXT_FIELDS);
  }
  if ('personal_claims' in payload) out.personal_claims = pickEach(payload.personal_claims, PERSONAL_CLAIM_FIELDS);
  return out;
};

const sanitizeReflectionResponse: Transform = (value) => {
  const response = asRow(value);
  return response ? pick(response, REFLECTION_RESPONSE_FIELDS) : null;
};

const sanitizeRecordsUsed: Transform = (value) => pickEach(value, RECORDS_USED_FIELDS);

const TABLE_COLUMNS: Record<string, readonly string[]> = {
  profile: [
    'display_name', 'life_stage', 'season', 'preferred_translation', 'theological_depth',
    'learning_style', 'available_time_minutes', 'bible_familiarity', 'theological_familiarity',
    'reformed_familiarity', 'memory_enabled', 'onboarding_completed', 'current_study',
    'created_at', 'updated_at',
  ],
  memories: [
    'id', 'category', 'content', 'source', 'active', 'user_confirmed', 'sensitivity',
    'expiration', 'confidence', 'created_at', 'updated_at',
  ],
  prayers: ['id', 'title', 'description', 'related_scripture', 'status', 'started_at', 'closed_at', 'created_at', 'updated_at'],
  walk_reflections: ['id', 'walk_id', 'body', 'input_mode', 'created_at', 'ai_response'],
  ask_conversations: ['id', 'title', 'language', 'created_at', 'updated_at', 'archived_at'],
  ask_messages: ['id', 'conversation_id', 'role', 'body', 'created_at', 'response_language', 'structured_payload'],
  family_profiles: ['id', 'family_name', 'current_study', 'memory_enabled', 'created_at', 'updated_at'],
  family_members: [
    'id', 'family_profile_id', 'nickname', 'age_range', 'relationship', 'learning_preferences',
    'discussion_level', 'current_topics', 'created_at', 'updated_at',
  ],
  family_walks: [
    'id', 'family_profile_id', 'topic', 'passage_reference', 'reading_instruction', 'parent_prep',
    'main_truth', 'biblical_context', 'reformed_foundation', 'words_children_may_ask',
    'common_misunderstanding', 'one_thing_to_emphasize', 'age_questions', 'application',
    'prayer_guide', 'estimated_minutes', 'status', 'started_at', 'finished_at', 'created_at',
  ],
  family_prayers: [
    'id', 'family_profile_id', 'title', 'description', 'related_scripture', 'status',
    'started_at', 'closed_at', 'created_at', 'updated_at',
  ],
  reach_people: [
    'id', 'nickname', 'relationship', 'spiritual_context', 'prayer_notes', 'related_scripture',
    'active', 'created_at', 'updated_at',
  ],
  reach_conversations: [
    'id', 'reach_person_id', 'conversation_date', 'main_topic', 'questions_asked',
    'user_reflection', 'possible_followup', 'prayer', 'created_at',
  ],
  sermon_notes: [
    'id', 'sermon_id', 'notes', 'main_point', 'questions', 'application', 'prayer', 'created_at', 'updated_at',
  ],
  legacy_events: [
    'id', 'event_type', 'title', 'event_date', 'source_type', 'summary', 'user_text', 'ai_summary',
    'scripture_references', 'prayer_id', 'life_season_id', 'family_member_reference',
    'church_reference', 'visibility', 'share_status', 'user_verified', 'in_vault', 'archived',
    'deleted_at', 'created_at', 'updated_at',
  ],
  legacy_life_seasons: [
    'id', 'title', 'description', 'start_date', 'end_date', 'scripture', 'prayer', 'what_im_learning',
    'people_involved', 'season_reflection', 'archived', 'deleted_at', 'created_at', 'updated_at',
  ],
  legacy_letters: [
    'id', 'letter_type', 'recipient_label', 'body', 'ai_organized_body', 'scripture_reference',
    'target_date', 'visibility', 'archived', 'deleted_at', 'created_at', 'updated_at',
  ],
  legacy_milestones: [
    'id', 'milestone_type', 'title', 'milestone_date', 'church_name', 'pastor_name', 'scripture',
    'reflection', 'in_vault', 'archived', 'deleted_at', 'created_at', 'updated_at',
  ],
  legacy_testimony: [
    'id', 'before_christ', 'how_i_came_to_understand', 'repentance_and_faith',
    'how_christ_changed_my_life', 'what_im_still_learning', 'scripture_that_matters',
    'ai_organized_version', 'deleted_at', 'created_at', 'updated_at',
  ],
  legacy_scripture_refs: [
    'id', 'passage_reference', 'book', 'date_marked', 'life_season_id', 'why_it_mattered',
    'user_reflection', 'related_prayer_id', 'related_sermon_id', 'related_family_walk_id',
    'in_vault', 'archived', 'deleted_at', 'created_at', 'updated_at',
  ],
  legacy_year_reviews: [
    'id', 'year', 'scripture_summary', 'prayer_summary', 'seasons_summary', 'family_summary',
    'church_summary', 'growth_summary', 'faithfulness_summary', 'looking_ahead', 'ai_year_summary',
    'records_used', 'deleted_at', 'created_at', 'updated_at',
  ],
};

const TABLE_TRANSFORMS: Record<string, Record<string, Transform>> = {
  walk_reflections: { ai_response: sanitizeReflectionResponse },
  ask_messages: { structured_payload: sanitizeAskPayload },
  legacy_year_reviews: { records_used: sanitizeRecordsUsed },
};

const sanitizeRow = (table: string, row: Row): Row => {
  const out = pick(row, TABLE_COLUMNS[table]);
  for (const [column, transform] of Object.entries(TABLE_TRANSFORMS[table] ?? {})) {
    if (column in out) out[column] = transform(out[column]);
  }
  return out;
};

const sanitizeTable = (table: string, rows: unknown): Row[] => {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((item) => {
    const row = asRow(item);
    return row ? [sanitizeRow(table, row)] : [];
  });
};

export function sanitizeUserExport(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { exported_at: data.exported_at };
  for (const table of Object.keys(TABLE_COLUMNS)) {
    out[table] = sanitizeTable(table, data[table]);
  }
  return out;
}
