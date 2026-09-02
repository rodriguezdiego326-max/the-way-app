// Phase 10 — Production Hardening Types

export type FeedbackType =
  | 'bug'
  | 'confusing_experience'
  | 'feature_request'
  | 'theological_concern'
  | 'privacy_concern'
  | 'other';

export type FeedbackStatus = 'open' | 'reviewed' | 'resolved';

export interface FeatureFlag {
  id: string;
  flag_key: string;
  is_enabled: boolean;
  is_kill_switch: boolean;
  description: string | null;
  updated_at: string;
  created_at: string;
}

export interface BetaFeedback {
  id: string;
  profile_id: string | null;
  feedback_type: FeedbackType | string;
  description: string;
  screen_context: string | null;
  include_history: boolean;
  status: FeedbackStatus | string;
  created_at: string;
}

export interface AiUsageRecord {
  id: string;
  profile_id: string | null;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  request_count: number;
  estimated_cost: number;
  latency_ms: number;
  success: boolean;
  error_message: string | null;
  feature: string | null;
  created_at: string;
}

export interface SystemVersion {
  id: string;
  component: string;
  version: string;
  updated_at: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  performed_by: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface RateLimitBucket {
  id: string;
  identifier: string;
  feature: string;
  request_count: number;
  window_start: string;
  max_requests: number;
  window_seconds: number;
}

export const FEEDBACK_TYPES: { id: FeedbackType; label: string }[] = [
  { id: 'bug', label: 'Bug' },
  { id: 'confusing_experience', label: 'Confusing Experience' },
  { id: 'feature_request', label: 'Feature Request' },
  { id: 'theological_concern', label: 'Theological Concern' },
  { id: 'privacy_concern', label: 'Privacy Concern' },
  { id: 'other', label: 'Other' },
];

export const FEATURE_FLAG_KEYS = [
  'family', 'reach', 'together', 'church', 'legacy',
  'production_ai', 'ai_generation', 'circle_posting',
  'church_posting', 'legacy_ai_summaries',
] as const;

export type FeatureFlagKey = typeof FEATURE_FLAG_KEYS[number];
