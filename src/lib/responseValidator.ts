import type { StructuredTheologicalResponse } from './intelligenceTypes';

// ============================================================
// SOLAPATH Response Validator
// Scans AI output for prohibited patterns before display.
// If unsafe wording is detected, the response is flagged and
// the answer_summary is sanitized.
// ============================================================

const PROHIBITED_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /god told (?:you|me|us) (?:to|that|you should)/i, reason: 'Claims God instructed a specific decision' },
  { pattern: /god is telling (?:you|me)/i, reason: 'Claims ongoing divine instruction' },
  { pattern: /the holy spirit told (?:you|me)/i, reason: 'Claims Holy Spirit instruction' },
  { pattern: /god revealed that/i, reason: 'Claims divine revelation' },
  { pattern: /god promises (?:your|that your) (?:business|company)/i, reason: 'Fabricates divine promise for business outcome' },
  { pattern: /god wants you to marry/i, reason: 'Claims divine instruction for marriage decision' },
  { pattern: /god (?:has|will) make your (?:business|company) succeed/i, reason: 'Fabricates divine guarantee of success' },
  { pattern: /god told (?:you|me) (?:your child|he|she) will be healed/i, reason: 'Fabricates divine healing promise' },
  { pattern: /god told (?:you|me) this person is (?:your|my) spouse/i, reason: 'Claims divine spouse identification' },
];

const PROHIBITED_IN_SCRIPTURE_CONTEXT: RegExp[] = [
  /scripture says.*god told/i,
  /in scripture.*god told/i,
];

export interface ValidationResult {
  passed: boolean;
  warnings: string[];
  sanitized_summary: string | null;
}

// ============================================================
// Structured Output Schema Validation
// Validates that a production AI response conforms to SOLAPATH's
// required structured output schema.
// ============================================================

const REQUIRED_SCHEMA_FIELDS: Array<{ field: string; type: string }> = [
  { field: 'answer_summary', type: 'string' },
  { field: 'scripture_first_required', type: 'boolean' },
  { field: 'scripture_first_mode', type: 'string' },
  { field: 'recommended_scripture', type: 'object' },
  { field: 'source_confidence', type: 'string' },
  { field: 'theological_confidence', type: 'string' },
  { field: 'biblical_basis', type: 'object' },
  { field: 'memory_proposals', type: 'object' },
  { field: 'is_demo', type: 'boolean' },
];

const VALID_SOURCE_CONFIDENCE = ['verified', 'partial', 'unavailable'];
const VALID_THEOLOGICAL_CONFIDENCE = [
  'CORE_CHRISTIAN_DOCTRINE', 'CONFESSIONAL_REFORMED_POSITION', 'REFORMED_DEBATE',
  'BROADER_CHRISTIAN_DISAGREEMENT', 'WISDOM_APPLICATION', 'NOT_EXPLICITLY_ADDRESSED',
];

export interface StructuredOutputValidationResult {
  passed: boolean;
  missing: string[];
  warnings: string[];
}

export function validateStructuredOutput(response: Record<string, unknown>): StructuredOutputValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const { field, type } of REQUIRED_SCHEMA_FIELDS) {
    const value = response[field];
    if (value === undefined || value === null) {
      missing.push(field);
      continue;
    }
    if (type === 'string' && typeof value !== 'string') {
      warnings.push(`${field} is not a string`);
    } else if (type === 'boolean' && typeof value !== 'boolean') {
      warnings.push(`${field} is not a boolean`);
    } else if (type === 'object' && !Array.isArray(value)) {
      warnings.push(`${field} is not an array`);
    }
  }

  if (typeof response.source_confidence === 'string' && !VALID_SOURCE_CONFIDENCE.includes(response.source_confidence)) {
    warnings.push(`source_confidence has invalid value: ${response.source_confidence}`);
  }
  if (typeof response.theological_confidence === 'string' && !VALID_THEOLOGICAL_CONFIDENCE.includes(response.theological_confidence)) {
    warnings.push(`theological_confidence has invalid value: ${response.theological_confidence}`);
  }

  const citationsPresent =
    Array.isArray(response.confessional_sources) ||
    Array.isArray(response.historical_sources) ||
    Array.isArray(response.scripture_sources) ||
    Array.isArray(response.rag_citations);
  if (!citationsPresent) {
    warnings.push('No citation arrays present (confessional_sources, historical_sources, scripture_sources, or rag_citations)');
  }

  return {
    passed: missing.length === 0 && warnings.length === 0,
    missing,
    warnings,
  };
}

export function validateResponse(response: StructuredTheologicalResponse): ValidationResult {
  const warnings: string[] = [];
  let sanitized_summary: string | null = null;

  const textToCheck = [
    response.answer_summary,
    response.reformed_understanding,
    response.application,
    response.prayer_guidance,
    response.other_christian_views,
    response.scripture_context,
  ].filter(Boolean) as string[];

  for (const text of textToCheck) {
    for (const { pattern, reason } of PROHIBITED_PATTERNS) {
      // Skip if this is in a scripture-quoting context or explicitly rejecting the claim
      const isRejecting = text.toLowerCase().includes('cannot confirm') ||
        text.toLowerCase().includes('cannot authenticate') ||
        text.toLowerCase().includes('will not authenticate') ||
        text.toLowerCase().includes("scripture is the standard") ||
        text.toLowerCase().includes('i cannot confirm that god told');

      if (isRejecting) continue;

      if (pattern.test(text)) {
        warnings.push(`Prohibited pattern detected: ${reason}`);
      }
    }
  }

  // Check for fake quotation marks around paraphrases
  const summary = response.answer_summary;
  if (summary && /"[^"]*(?:calvin|sproul|owen|baucham|piper|keller|macarthur|ferguson)[^"]*"/i.test(summary)) {
    // Only flag if it looks like a direct quote attribution without a verified source
    const hasVerifiedSource = response.historical_sources.some(s => s.verified) ||
      response.modern_sources.some(s => s.verified);
    if (!hasVerifiedSource) {
      warnings.push('Quotation marks around attributed theologian/teacher text without verified source');
    }
  }

  const passed = warnings.length === 0;

  return {
    passed,
    warnings,
    sanitized_summary,
  };
}

// ============================================================
// Neutral Memory Proposal Generator
// Transforms raw user statements into neutral context language,
// never canonizing user interpretations or alleged revelation.
// ============================================================

interface RawStatementAnalysis {
  raw: string;
  is_alleged_revelation: boolean;
  is_accusation: boolean;
  is_prediction: boolean;
  is_confession: boolean;
  is_sensitive_relationship: boolean;
  is_trauma: boolean;
  is_health: boolean;
  is_legal: boolean;
  is_sexual: boolean;
  neutralized_content: string;
  sensitivity: 'normal' | 'personal' | 'highly_sensitive';
  requires_explicit_opt_in: boolean;
}

export function analyzeRawStatement(raw: string): RawStatementAnalysis {
  const lower = raw.toLowerCase();

  const is_alleged_revelation = /god told|god revealed|the holy spirit told|god said to me|god wants me to|god is calling me to|god showed me/i.test(raw);
  const is_accusation = /(?:hates|is evil|is abusive|is toxic|is narcissist|is controlling)/i.test(lower);
  const is_prediction = /god (?:promised|will) (?:my|our|the) (?:business|company|will make|guarantee)/i.test(lower);
  const is_confession = /i (?:sinned|cheated|lied|stole|committed|had an affair|am addicted)/i.test(lower);
  const is_sensitive_relationship = /(?:divorce|leaving my|affair|separation|betrayed)/i.test(lower);
  const is_trauma = /(?:abuse|assault|violence|raped|molested|trauma|ptsd|suicid)/i.test(lower);
  const is_health = /(?:diagnosed|cancer|terminal|illness|disease|depression|anxiety disorder|medication)/i.test(lower);
  const is_legal = /(?:sued|lawsuit|court|custody|arrested|charged|legal trouble)/i.test(lower);
  const is_sexual = /(?:sexual|sex|pornograph|intimacy|lust)/i.test(lower);

  // Determine sensitivity level
  let sensitivity: 'normal' | 'personal' | 'highly_sensitive' = 'normal';
  let requires_explicit_opt_in = false;

  if (is_trauma || is_sexual || is_health || is_legal || is_confession) {
    sensitivity = 'highly_sensitive';
    requires_explicit_opt_in = true;
  } else if (is_alleged_revelation || is_accusation || is_prediction || is_sensitive_relationship) {
    sensitivity = 'personal';
    requires_explicit_opt_in = true;
  }

  // Neutralize the content
  let neutralized = raw;

  if (is_alleged_revelation) {
    // Transform "God told me to quit my job" → "Considering leaving a job and seeking biblical guidance"
    if (/quit (?:my )?job|leave (?:my )?job|resign/i.test(lower)) {
      neutralized = 'Considering leaving a job and seeking biblical guidance about the decision.';
    } else if (/divorce|leave (?:my )?wife|leave (?:my )?husband/i.test(lower)) {
      neutralized = 'Wrestling with a serious marital decision and seeking biblical guidance.';
    } else if (/marry|spouse/i.test(lower)) {
      neutralized = 'Considering marriage and seeking biblical guidance about the relationship.';
    } else if (/business|company/i.test(lower)) {
      neutralized = 'Hoping for success in a business and connecting that hope with faith.';
    } else if (/heal|healing|cured/i.test(lower)) {
      neutralized = 'Praying for healing and seeking biblical encouragement.';
    } else {
      neutralized = 'Seeking biblical guidance about a personal decision.';
    }
  } else if (is_accusation) {
    if (/pastor|church leader|elder/i.test(lower)) {
      neutralized = 'Experiencing conflict or concern in a relationship with a church leader.';
    } else if (/wife|husband|spouse/i.test(lower)) {
      neutralized = 'Experiencing conflict in a marriage relationship.';
    } else {
      neutralized = 'Experiencing conflict or concern in a relationship.';
    }
  } else if (is_prediction) {
    neutralized = 'Hoping for a specific outcome and connecting that hope with faith.';
  } else if (is_sensitive_relationship) {
    neutralized = 'Wrestling with a significant relationship decision.';
  } else {
    // General neutralization — strip first person, keep factual
    neutralized = raw.replace(/^(I|My|Me)\s+/i, '').trim();
    if (neutralized.length > 120) {
      neutralized = neutralized.slice(0, 117) + '...';
    }
  }

  return {
    raw,
    is_alleged_revelation,
    is_accusation,
    is_prediction,
    is_confession,
    is_sensitive_relationship,
    is_trauma,
    is_health,
    is_legal,
    is_sexual,
    neutralized_content: neutralized,
    sensitivity,
    requires_explicit_opt_in,
  };
}
