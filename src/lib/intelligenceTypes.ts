// SOLAPATH Intelligence — Structured Types
// These types define the structured response schema for AI-generated theological answers.

export type IntentType =
  | 'SCRIPTURE_EXPLANATION'
  | 'THEOLOGY'
  | 'LIFE_APPLICATION'
  | 'PRAYER'
  | 'APOLOGETICS'
  | 'DOUBT'
  | 'FAMILY'
  | 'EVANGELISM'
  | 'CHURCH'
  | 'ETHICAL_DECISION'
  | 'PERSONAL_WISDOM'
  | 'DIVINE_REVELATION_CLAIM'
  | 'PASTORAL_CRISIS'
  | 'GENERAL';

export type StakesLevel = 'LOW' | 'PASTORALLY_SENSITIVE' | 'HIGH';

export type ScriptureFirstMode =
  | 'ANSWER_NORMALLY'
  | 'ANSWER_WITH_SCRIPTURE_RECOMMENDATION'
  | 'ENCOURAGE_SCRIPTURE_FIRST'
  | 'ENCOURAGE_HUMAN_HELP';

export type TheologicalConfidence =
  | 'CORE_CHRISTIAN_DOCTRINE'
  | 'CONFESSIONAL_REFORMED_POSITION'
  | 'REFORMED_DEBATE'
  | 'BROADER_CHRISTIAN_DISAGREEMENT'
  | 'WISDOM_APPLICATION'
  | 'NOT_EXPLICITLY_ADDRESSED';

export type MemoryType =
  | 'PROFILE'
  | 'PREFERENCE'
  | 'CURRENT_SEASON'
  | 'SPIRITUAL_GOAL'
  | 'BIBLE_STUDY'
  | 'PRAYER_CONTEXT'
  | 'LIFE_EVENT'
  | 'RELATIONSHIP_CONTEXT'
  | 'TEMPORARY_CONTEXT'
  | 'REFLECTION_PATTERN';

export type MemorySensitivity = 'normal' | 'personal' | 'highly_sensitive';

export interface RecommendedScripture {
  reference: string;
  reading_objective: string;
  reason: string;
}

export interface SourceCitation {
  source_id: string | null;
  source_type: string;
  author: string | null;
  work: string | null;
  section: string | null;
  citation: string | null;
  verified: boolean;
  url: string | null;
}

export interface BiblicalBasisPassage {
  reference: string;
  relevance: string;
  contextual_note: string;
  is_primary: boolean;
}

export interface MemoryProposal {
  type: MemoryType;
  content: string;
  reason: string;
  sensitivity: MemorySensitivity;
  requires_explicit_opt_in: boolean;
}

export interface ScriptureTestingFlow {
  what_scripture_clearly_teaches: string | null;
  what_scripture_does_not_say: string | null;
  wisdom_considerations: string | null;
  human_counsel: string | null;
  prayer: string | null;
}

export interface StructuredTheologicalResponse {
  answer_summary: string;
  scripture_first_required: boolean;
  scripture_first_mode: ScriptureFirstMode;
  recommended_scripture: RecommendedScripture[];
  scripture_context: string | null;
  reformed_understanding: string | null;
  confessional_sources: SourceCitation[];
  historical_sources: SourceCitation[];
  modern_sources: SourceCitation[];
  scripture_sources?: SourceCitation[];
  other_christian_views: string | null;
  application: string | null;
  prayer_guidance: string | null;
  human_support_recommended: boolean;
  human_support_note: string | null;
  memory_proposals: MemoryProposal[];
  source_confidence: 'verified' | 'partial' | 'unavailable';
  theological_confidence: TheologicalConfidence;
  not_explicitly_addressed_by_scripture: boolean;
  biblical_basis: BiblicalBasisPassage[];
  is_demo: boolean;
  divine_revelation_claim_detected: boolean;
  divine_revelation_response: string | null;
  scripture_testing_flow: ScriptureTestingFlow | null;
  teacher_attribution_blocked: string | null;
  validation_passed: boolean;
  validation_warnings: string[];
  // Phase 7 additions
  rag_citations?: RAGCitation[];
  rag_context_summary?: string | null;
  rag_retrieved_source_ids?: string[];
  rag_rejected_source_ids?: string[];
  personal_context_used?: string[];
  provider?: string;
  model_version?: string;
  system_versions?: Record<string, string>;
  query_id?: string;
  source_unavailable?: boolean;
  warnings?: string[];
  is_development_mode?: boolean;
  verification_state?: VerificationState;
  has_development_content?: boolean;
}

export type VerificationState =
  | 'ALL_SOURCES_VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'SOURCES_UNAVAILABLE'
  | 'NO_EXTERNAL_SOURCES_REQUIRED';

export interface RAGCitation {
  source_id: string;
  source_type: string;
  authority_level: number;
  display_author: string;
  display_title: string;
  chapter_section: string | null;
  verified: boolean;
}

export interface RegressionTest {
  test_id: string;
  category: string;
  query: string;
  expected_properties: Record<string, unknown>;
  last_status: 'pass' | 'fail' | 'pending';
  last_detail: string | null;
  last_run_at: string | null;
}

export interface RegressionTestSummary {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  source_failures: number;
  attribution_failures: number;
  quote_failures: number;
  scripture_context_failures: number;
  safety_failures: number;
  memory_failures: number;
  schema_failures: number;
}

export interface SourceBatch {
  id: string;
  batch_label: string;
  batch_type: string;
  sources_added: number;
  sources_verified: number;
  sources_rejected: number;
  chunks_created: number;
  doctrines_covered: string[];
  tests_run: number;
  retrieval_failures: number;
  attribution_failures: number;
  release_ready: boolean;
  reviewer_notes: string | null;
  created_at: string;
}

export interface TheologicalConcernReport {
  id: string;
  query_id: string;
  concern_category: string;
  concern_detail: string | null;
  status: 'open' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
}

export interface ReleaseGate {
  id: string;
  version_label: string;
  validation_panel_pass: boolean;
  no_critical_regression_failures: boolean;
  no_citation_fabrication: boolean;
  no_source_status_leakage: boolean;
  admin_security_passing: boolean;
  theological_reviewer_approval: boolean;
  release_ready: boolean;
  notes: string | null;
  created_at: string;
}

export interface IntelligenceRequest {
  question: string;
  intent_hint?: string;
  theological_depth: string;
  profile?: {
    display_name: string | null;
    life_stage: string | null;
    season: string | null;
    current_study: string | null;
    theological_familiarity: string | null;
    bible_familiarity: string | null;
    available_time_minutes: number | null;
  };
  relevant_memories?: Array<{
    category: string;
    content: string;
  }>;
  conversation_history?: Array<{
    role: 'user' | 'assistant';
    body: string;
  }>;
  session_id?: string;
}

export interface IntentClassification {
  intent: IntentType;
  stakes: StakesLevel;
  scripture_first_mode: ScriptureFirstMode;
  reasoning: string;
}
