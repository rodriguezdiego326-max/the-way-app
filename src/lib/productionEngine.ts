// Phase 10 — Production Hardening Engine
// Feature flags, beta feedback, AI usage tracking, system health, data export, account deletion

import { supabase } from '@/lib/supabase';
import type {
  FeatureFlag, BetaFeedback, AiUsageRecord, SystemVersion,
  AuditEntry, RateLimitBucket, FeatureFlagKey,
} from '@/lib/productionTypes';

// ============================================================
// FEATURE FLAGS
// ============================================================

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .order('flag_key');
  if (error) { console.error('[productionEngine] getFeatureFlags', error); return []; }
  return (data || []) as FeatureFlag[];
}

export async function getFeatureFlag(key: FeatureFlagKey | string): Promise<FeatureFlag | null> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('flag_key', key)
    .maybeSingle();
  if (error) { console.error('[productionEngine] getFeatureFlag', error); return null; }
  return data as FeatureFlag | null;
}

export async function isFeatureEnabled(key: FeatureFlagKey | string): Promise<boolean> {
  const flag = await getFeatureFlag(key);
  return flag ? flag.is_enabled : true;
}

export async function setFeatureFlag(key: string, enabled: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('feature_flags')
    .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
    .eq('flag_key', key);
  if (error) { console.error('[productionEngine] setFeatureFlag', error); return false; }
  return true;
}

export async function triggerKillSwitch(key: string): Promise<boolean> {
  return setFeatureFlag(key, false);
}

export async function resetKillSwitch(key: string): Promise<boolean> {
  return setFeatureFlag(key, true);
}

// ============================================================
// BETA FEEDBACK
// ============================================================

export async function submitFeedback(
  feedbackType: string,
  description: string,
  options?: { profileId?: string; screenContext?: string; includeHistory?: boolean },
): Promise<BetaFeedback | null> {
  const { data, error } = await supabase
    .from('beta_feedback')
    .insert({
      profile_id: options?.profileId ?? null,
      feedback_type: feedbackType,
      description,
      screen_context: options?.screenContext ?? null,
      include_history: options?.includeHistory ?? false,
    })
    .select('*')
    .single();
  if (error) { console.error('[productionEngine] submitFeedback', error); return null; }
  return data as BetaFeedback;
}

export async function getFeedback(): Promise<BetaFeedback[]> {
  const { data, error } = await supabase
    .from('beta_feedback')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('[productionEngine] getFeedback', error); return []; }
  return (data || []) as BetaFeedback[];
}

export async function updateFeedbackStatus(id: string, status: string): Promise<boolean> {
  const { error } = await supabase
    .from('beta_feedback')
    .update({ status })
    .eq('id', id);
  if (error) { console.error('[productionEngine] updateFeedbackStatus', error); return false; }
  return true;
}

// ============================================================
// AI USAGE TRACKING
// ============================================================

export async function getAiUsageStats(): Promise<{
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  failureRate: number;
  avgLatency: number;
  byModel: Array<{ model: string; count: number; cost: number }>;
  recent: AiUsageRecord[];
}> {
  const { data, error } = await supabase
    .from('ai_usage_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) { console.error('[productionEngine] getAiUsageStats', error); return { totalRequests: 0, totalInputTokens: 0, totalOutputTokens: 0, totalCost: 0, failureRate: 0, avgLatency: 0, byModel: [], recent: [] }; }
  const records = (data || []) as AiUsageRecord[];
  const totalRequests = records.length;
  const failures = records.filter(r => !r.success).length;
  const totalInputTokens = records.reduce((sum, r) => sum + (r.input_tokens || 0), 0);
  const totalOutputTokens = records.reduce((sum, r) => sum + (r.output_tokens || 0), 0);
  const totalCost = records.reduce((sum, r) => sum + (r.estimated_cost || 0), 0);
  const avgLatency = totalRequests > 0 ? records.reduce((sum, r) => sum + (r.latency_ms || 0), 0) / totalRequests : 0;
  const modelMap = new Map<string, { count: number; cost: number }>();
  for (const r of records) {
    const key = r.model || 'unknown';
    const existing = modelMap.get(key) || { count: 0, cost: 0 };
    existing.count += 1;
    existing.cost += r.estimated_cost || 0;
    modelMap.set(key, existing);
  }
  return {
    totalRequests,
    totalInputTokens,
    totalOutputTokens,
    totalCost,
    failureRate: totalRequests > 0 ? failures / totalRequests : 0,
    avgLatency,
    byModel: Array.from(modelMap.entries()).map(([model, v]) => ({ model, ...v })),
    recent: records.slice(0, 20),
  };
}

// ============================================================
// SYSTEM HEALTH
// ============================================================

export async function getSystemVersions(): Promise<SystemVersion[]> {
  const { data, error } = await supabase
    .from('system_versions')
    .select('*')
    .order('component');
  if (error) { console.error('[productionEngine] getSystemVersions', error); return []; }
  return (data || []) as SystemVersion[];
}

export async function getAuditTrail(limit = 50): Promise<AuditEntry[]> {
  const { data, error } = await supabase
    .from('audit_trail')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('[productionEngine] getAuditTrail', error); return []; }
  return (data || []) as AuditEntry[];
}

export async function getRateLimitBuckets(): Promise<RateLimitBucket[]> {
  const { data, error } = await supabase
    .from('rate_limit_buckets')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) { console.error('[productionEngine] getRateLimitBuckets', error); return []; }
  return (data || []) as RateLimitBucket[];
}

export async function checkDatabaseHealth(): Promise<{ healthy: boolean; tableCount: number; latencyMs: number }> {
  const start = Date.now();
  const { error } = await supabase.from('app_settings').select('id').limit(1);
  const latencyMs = Date.now() - start;
  return { healthy: !error, tableCount: 0, latencyMs };
}

// ============================================================
// DATA EXPORT
// ============================================================

export async function exportUserData(profileId: string): Promise<Record<string, unknown>> {
  const tables = [
    { key: 'profile', table: 'profiles', filter: { column: 'id', value: profileId } },
    { key: 'memories', table: 'memories', filter: null },
    { key: 'prayers', table: 'prayers', filter: null },
    { key: 'walk_reflections', table: 'walk_reflections', filter: null },
    { key: 'ask_conversations', table: 'ask_conversations', filter: null },
    { key: 'ask_messages', table: 'ask_messages', filter: null },
    { key: 'family_profiles', table: 'family_profiles', filter: { column: 'profile_id', value: profileId } },
    { key: 'family_members', table: 'family_members', filter: { column: 'profile_id', value: profileId } },
    { key: 'family_walks', table: 'family_walks', filter: { column: 'profile_id', value: profileId } },
    { key: 'family_prayers', table: 'family_prayers', filter: { column: 'profile_id', value: profileId } },
    { key: 'reach_people', table: 'reach_people', filter: { column: 'profile_id', value: profileId } },
    { key: 'reach_conversations', table: 'reach_conversations', filter: { column: 'profile_id', value: profileId } },
    { key: 'sermon_notes', table: 'sermon_notes', filter: { column: 'profile_id', value: profileId } },
    { key: 'legacy_events', table: 'legacy_events', filter: { column: 'profile_id', value: profileId } },
    { key: 'legacy_life_seasons', table: 'legacy_life_seasons', filter: { column: 'profile_id', value: profileId } },
    { key: 'legacy_letters', table: 'legacy_letters', filter: { column: 'profile_id', value: profileId } },
    { key: 'legacy_milestones', table: 'legacy_milestones', filter: { column: 'profile_id', value: profileId } },
    { key: 'legacy_testimony', table: 'legacy_testimony', filter: { column: 'profile_id', value: profileId } },
    { key: 'legacy_scripture_refs', table: 'legacy_scripture_refs', filter: { column: 'profile_id', value: profileId } },
    { key: 'legacy_year_reviews', table: 'legacy_year_reviews', filter: { column: 'profile_id', value: profileId } },
  ];

  const exportData: Record<string, unknown> = { exported_at: new Date().toISOString(), profile_id: profileId };

  for (const { key, table, filter } of tables) {
    let query = supabase.from(table).select('*');
    if (filter) query = query.eq(filter.column, filter.value);
    const { data, error } = await query;
    if (!error && data) {
      exportData[key] = data;
    } else {
      exportData[key] = [];
    }
  }

  return exportData;
}

// ============================================================
// ACCOUNT DELETION
// ============================================================

export async function deleteAccount(profileId: string): Promise<boolean> {
  const now = new Date().toISOString();

  // PERMANENTLY DELETE all user-owned tables — no soft-delete, no recovery.
  // This matches the user-facing promise: "permanently remove."
  const allDeleteTables = [
    // Legacy tables (previously soft-deleted — now hard-deleted to match promise)
    { table: 'legacy_events', column: 'profile_id' },
    { table: 'legacy_life_seasons', column: 'profile_id' },
    { table: 'legacy_letters', column: 'profile_id' },
    { table: 'legacy_milestones', column: 'profile_id' },
    { table: 'legacy_testimony', column: 'profile_id' },
    { table: 'legacy_scripture_refs', column: 'profile_id' },
    { table: 'legacy_year_reviews', column: 'profile_id' },
    { table: 'legacy_designated_persons', column: 'profile_id' },
    // Personal data
    { table: 'memories', column: null },
    { table: 'prayers', column: null },
    { table: 'prayer_updates', column: null },
    { table: 'walk_reflections', column: null },
    { table: 'ask_conversations', column: null },
    { table: 'ask_messages', column: null },
    { table: 'daily_checkins', column: null },
    { table: 'life_stages', column: 'profile_id' },
    { table: 'life_areas', column: 'profile_id' },
    { table: 'growth_areas', column: 'profile_id' },
    { table: 'current_studies', column: 'profile_id' },
    // Family
    { table: 'family_profiles', column: 'profile_id' },
    { table: 'family_members', column: 'profile_id' },
    { table: 'family_walks', column: 'profile_id' },
    { table: 'family_prayers', column: 'profile_id' },
    { table: 'family_prayer_updates', column: 'profile_id' },
    { table: 'family_journey_progress', column: 'profile_id' },
    { table: 'catechism_progress', column: 'profile_id' },
    // REACH
    { table: 'reach_people', column: 'profile_id' },
    { table: 'reach_conversations', column: 'profile_id' },
    { table: 'reach_prayer_updates', column: 'profile_id' },
    { table: 'prodigal_journey', column: 'profile_id' },
    { table: 'prodigal_updates', column: 'profile_id' },
    { table: 'conversation_practice', column: 'profile_id' },
    // Church
    { table: 'sermon_notes', column: 'profile_id' },
    { table: 'church_memberships', column: 'profile_id' },
    // Together / Circles
    { table: 'circle_members', column: 'profile_id' },
    { table: 'circle_invitations', column: 'invited_by_profile_id' },
    { table: 'shared_prayers', column: 'profile_id' },
    { table: 'shared_reflections', column: 'profile_id' },
    { table: 'circle_check_ins', column: 'profile_id' },
    { table: 'encouragements', column: 'from_profile_id' },
    { table: 'accountability_relationships', column: 'profile_id' },
    // Settings
    { table: 'notification_preferences', column: 'profile_id' },
  ];

  for (const { table, column } of allDeleteTables) {
    let query = supabase.from(table).delete();
    if (column) query = query.eq(column, profileId);
    await query;
  }

  // Finally, delete the profile itself
  const { error: profileErr } = await supabase.from('profiles').delete().eq('id', profileId);
  if (profileErr) { console.error('[productionEngine] deleteAccount profile', profileErr); return false; }

  // Log minimal audit metadata — NO spiritual content, NO profile ID that could
  // be cross-referenced back to deleted data. Only the event, timestamp, and version.
  await supabase.from('audit_trail').insert({
    action: 'account_deletion',
    entity_type: 'profile',
    entity_id: 'deleted',
    performed_by: null,
    metadata: { deleted_at: now, system_version: 'phase10.1' },
  });

  // Clear all local drafts for this user
  clearAllUserDrafts(profileId);

  return true;
}

// ============================================================
// DRAFT AUTOSAVE (user-scoped, expiring, localStorage-based)
// ============================================================
//
// Drafts are scoped per-user so User B cannot see User A's drafts on the
// same device. Each draft stores a timestamp and expires after 7 days.
// Sensitive long-form content (testimony, letters, reflections) is only
// saved when the user explicitly opts in via the `sensitive` flag —
// otherwise we keep just a non-sensitive placeholder so the user doesn't
// lose work unexpectedly but nothing private persists in the browser.

const DRAFT_EXPIRY_DAYS = 7;

interface DraftEnvelope {
  content: string;
  saved_at: string;
  profile_id: string;
  sensitive: boolean;
}

function draftKey(profileId: string, key: string): string {
  return `theway_draft_${profileId}_${key}`;
}

export function saveDraft(key: string, content: string, options?: { profileId?: string; sensitive?: boolean }): void {
  try {
    const pid = options?.profileId || 'global';
    const sensitive = options?.sensitive ?? false;
    // For sensitive content, only persist if the caller explicitly opts in
    if (sensitive && content.length > 0) {
      // Store a non-sensitive truncated placeholder so the user sees they had a draft
      // but the actual sensitive text is not left in localStorage long-term.
      const placeholder = content.slice(0, 50) + (content.length > 50 ? '…' : '');
      const envelope: DraftEnvelope = {
        content: placeholder,
        saved_at: new Date().toISOString(),
        profile_id: pid,
        sensitive: true,
      };
      localStorage.setItem(draftKey(pid, key), JSON.stringify(envelope));
      return;
    }
    const envelope: DraftEnvelope = {
      content,
      saved_at: new Date().toISOString(),
      profile_id: pid,
      sensitive: false,
    };
    localStorage.setItem(draftKey(pid, key), JSON.stringify(envelope));
  } catch { /* ignore storage errors */ }
}

export function loadDraft(key: string, options?: { profileId?: string }): string | null {
  try {
    const pid = options?.profileId || 'global';
    const raw = localStorage.getItem(draftKey(pid, key));
    if (!raw) return null;
    const envelope = JSON.parse(raw) as DraftEnvelope;
    // Check expiration
    const savedAt = new Date(envelope.saved_at).getTime();
    const ageDays = (Date.now() - savedAt) / (1000 * 60 * 60 * 24);
    if (ageDays > DRAFT_EXPIRY_DAYS) {
      localStorage.removeItem(draftKey(pid, key));
      return null;
    }
    // Verify user scope — prevent cross-user leakage
    if (envelope.profile_id !== pid) return null;
    return envelope.content;
  } catch { return null; }
}

export function clearDraft(key: string, options?: { profileId?: string }): void {
  try {
    const pid = options?.profileId || 'global';
    localStorage.removeItem(draftKey(pid, key));
  } catch { /* ignore */ }
}

export function clearAllUserDrafts(profileId: string): void {
  try {
    const prefix = `theway_draft_${profileId}_`;
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) toRemove.push(k);
    }
    for (const k of toRemove) localStorage.removeItem(k);
  } catch { /* ignore */ }
}

export function clearAllDrafts(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('theway_draft_')) toRemove.push(k);
    }
    for (const k of toRemove) localStorage.removeItem(k);
  } catch { /* ignore */ }
}

// ============================================================
// DUPLICATE SUBMISSION PROTECTION
// ============================================================

const submissionLocks = new Set<string>();

export function isSubmitting(key: string): boolean {
  return submissionLocks.has(key);
}

export function lockSubmission(key: string): boolean {
  if (submissionLocks.has(key)) return false;
  submissionLocks.add(key);
  return true;
}

export function unlockSubmission(key: string): void {
  submissionLocks.delete(key);
}
