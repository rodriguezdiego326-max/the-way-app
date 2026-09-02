// SOLAPATH Library — Types for Verified Theology & RAG

export type SourceType =
  | 'scripture' | 'creed' | 'confession' | 'catechism'
  | 'historic_theologian' | 'modern_teacher'
  | 'editorial' | 'family_discipleship' | 'apologetics'
  | 'church_history' | 'biblical_theology';

export type ContentStatus = 'draft' | 'pending_verification' | 'verified' | 'rejected' | 'archived';
export type CopyrightStatus = 'public_domain' | 'copyrighted' | 'mixed' | 'pending_review' | 'licensed';

export type PerspectiveProfile = 'westminster_presbyterian' | 'continental_reformed' | 'reformed_baptist' | 'broad_historic_reformed';

export interface LibraryAuthor {
  id: string;
  name: string;
  birth_year: number | null;
  death_year: number | null;
  era: string | null;
  theological_tradition: string | null;
  biography_summary: string | null;
  major_works: string[] | null;
  doctrine_specialties: string[] | null;
  public_domain_default: boolean;
  source_permissions: string | null;
  verified: boolean;
}

export interface LibrarySource {
  id: string;
  source_type: SourceType;
  authority_level: number;
  title: string;
  author_id: string | null;
  publisher: string | null;
  publication_year: number | null;
  edition: string | null;
  translator: string | null;
  volume: string | null;
  chapter: string | null;
  section: string | null;
  page_start: number | null;
  page_end: number | null;
  source_url: string | null;
  canonical_url: string | null;
  language: string;
  copyright_status: CopyrightStatus;
  license_type: string | null;
  license_notes: string | null;
  public_domain: boolean;
  verified: boolean;
  verified_by: string | null;
  verification_date: string | null;
  theological_tradition: string | null;
  content_status: ContentStatus;
  perspective_profile: PerspectiveProfile | null;
  created_at: string;
  updated_at: string;
}

export interface SourceChunk {
  id: string;
  source_id: string;
  chunk_index: number;
  heading: string | null;
  text: string;
  scripture_references: string[] | null;
  doctrine_tags: string[] | null;
  theological_tags: string[] | null;
  historical_period: string | null;
  token_count: number | null;
  citation_metadata: Record<string, unknown> | null;
  verified: boolean;
}

export interface DoctrineTaxonomyEntry {
  id: string;
  doctrine_id: string;
  category: string;
  subcategory: string;
  label: string;
  description: string | null;
  parent_doctrine_id: string | null;
  scripture_references: string[] | null;
  confession_references: string[] | null;
}

export interface BibleTranslation {
  id: string;
  translation_code: string;
  translation_name: string;
  copyright_holder: string | null;
  license_type: string | null;
  usage_limitations: string | null;
  api_provider: string | null;
  attribution_requirements: string | null;
  offline_storage_permitted: boolean;
  commercial_usage_permitted: boolean;
  public_domain: boolean;
}

export interface LibraryCreed {
  id: string;
  title: string;
  historical_date: string | null;
  tradition: string | null;
  section: string | null;
  text: string;
  source: string | null;
  public_domain: boolean;
  verified: boolean;
}

export interface LibraryConfession {
  id: string;
  confession_name: string;
  chapter_number: number | null;
  chapter_title: string | null;
  question_number: number | null;
  question: string | null;
  answer: string | null;
  text: string;
  scripture_references: string[] | null;
  doctrine_tags: string[] | null;
  theological_tradition: string | null;
  public_domain: boolean;
  verified: boolean;
}

export interface RetrievalLogEntry {
  id: string;
  query: string;
  detected_intent: string | null;
  detected_doctrine: string[] | null;
  retrieved_source_ids: string[] | null;
  rejected_source_ids: string[] | null;
  ranking: Record<string, unknown> | null;
  final_context_summary: string | null;
  citations_generated: Record<string, unknown> | null;
  theological_validation: string | null;
  created_at: string;
}

// Citation object
export interface Citation {
  source_id: string;
  display_author: string;
  display_title: string;
  chapter_section: string | null;
  page: number | null;
  source_type: SourceType;
  authority_level: number;
  verified: boolean;
  source_link: string | null;
}

// Source confidence states
export type SourceConfidence = 'verified' | 'partially_supported' | 'source_unavailable';

// RAG pipeline types
export interface RetrievalResult {
  citations: Citation[];
  confidence: SourceConfidence;
  context_summary: string;
  detected_intent: string;
  detected_doctrine: string[];
  retrieved_sources: Array<{
    source: LibrarySource;
    chunks: SourceChunk[];
    relevance: number;
  }>;
  rejected_sources: Array<{
    source_id: string;
    reason: string;
  }>;
}

export interface RAGAnswer {
  scripture_first: string | null;
  short_answer: string | null;
  biblical_context: string | null;
  reformed_understanding: string | null;
  confessional_witness: string | null;
  historic_voices: string | null;
  modern_teaching: string | null;
  other_christian_views: string | null;
  application: string | null;
  prayer_reflection: string | null;
  citations: Citation[];
  confidence: SourceConfidence;
  is_development_mode: boolean;
}

export type ContentChunk = SourceChunk;

export interface ScriptureRef {
  book: string;
  chapter: number;
  verse_start: number | null;
  verse_end: number | null;
  testament: 'OT' | 'NT';
  passage_grouping: string;
  context_range: string;
  doctrine_tags: string[];
}
