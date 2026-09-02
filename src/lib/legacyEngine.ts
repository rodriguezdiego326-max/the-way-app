// Phase 9 — LEGACY Engine
// All CRUD + retrieval functions for the Legacy system.
// Legacy is PRIVATE by default, user-controlled, and separate from Memory + community systems.

import { supabase } from '@/lib/supabase';
import type {
  LegacyEvent, LegacyLifeSeason, LegacyLetter, LegacyMilestone,
  LegacyTestimony, LegacyScriptureRef, LegacyYearReview, LegacyDesignatedPerson,
  ScriptureMapEntry, LegacyEventType, LegacySourceType,
} from '@/lib/legacyTypes';

// ============================================================
// LEGACY EVENTS
// ============================================================

export async function createLegacyEvent(
  profileId: string,
  eventType: LegacyEventType | string,
  title: string,
  eventDate: string,
  sourceType: LegacySourceType | string = 'user_created',
  options?: {
    sourceId?: string;
    summary?: string;
    userText?: string;
    scriptureReferences?: string[];
    prayerId?: string;
    lifeSeasonId?: string;
    familyMemberReference?: string;
    churchReference?: string;
  },
): Promise<LegacyEvent | null> {
  const { data, error } = await supabase
    .from('legacy_events')
    .insert({
      profile_id: profileId,
      event_type: eventType,
      title,
      event_date: eventDate,
      source_type: sourceType,
      source_id: options?.sourceId ?? null,
      summary: options?.summary ?? null,
      user_text: options?.userText ?? null,
      scripture_references: options?.scriptureReferences ?? null,
      prayer_id: options?.prayerId ?? null,
      life_season_id: options?.lifeSeasonId ?? null,
      family_member_reference: options?.familyMemberReference ?? null,
      church_reference: options?.churchReference ?? null,
    })
    .select('*')
    .single();
  if (error) { console.error('[legacyEngine] createLegacyEvent', error); return null; }
  return data as LegacyEvent;
}

export async function getLegacyEvents(
  profileId: string,
  filters?: { eventType?: string; lifeSeasonId?: string; sourceType?: string },
): Promise<LegacyEvent[]> {
  let query = supabase
    .from('legacy_events')
    .select('*')
    .eq('profile_id', profileId)
    .is('deleted_at', null)
    .order('event_date', { ascending: false });
  if (filters?.eventType) query = query.eq('event_type', filters.eventType);
  if (filters?.lifeSeasonId) query = query.eq('life_season_id', filters.lifeSeasonId);
  if (filters?.sourceType) query = query.eq('source_type', filters.sourceType);
  const { data, error } = await query;
  if (error) { console.error('[legacyEngine] getLegacyEvents', error); return []; }
  return (data || []) as LegacyEvent[];
}

export async function getLegacyEventById(id: string): Promise<LegacyEvent | null> {
  const { data, error } = await supabase
    .from('legacy_events')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) { console.error('[legacyEngine] getLegacyEventById', error); return null; }
  return data as LegacyEvent | null;
}

export async function updateLegacyEvent(id: string, updates: Partial<LegacyEvent>): Promise<boolean> {
  const { error } = await supabase
    .from('legacy_events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) { console.error('[legacyEngine] updateLegacyEvent', error); return false; }
  return true;
}

export async function setAiSummary(id: string, aiSummary: string): Promise<boolean> {
  return updateLegacyEvent(id, { ai_summary: aiSummary } as Partial<LegacyEvent>);
}

export async function deleteAiSummary(id: string): Promise<boolean> {
  return updateLegacyEvent(id, { ai_summary: null } as Partial<LegacyEvent>);
}

export async function archiveLegacyEvent(id: string): Promise<boolean> {
  return updateLegacyEvent(id, { archived: true } as Partial<LegacyEvent>);
}

export async function softDeleteLegacyEvent(id: string): Promise<boolean> {
  return updateLegacyEvent(id, { deleted_at: new Date().toISOString() } as Partial<LegacyEvent>);
}

export async function toggleVaultStatus(id: string, inVault: boolean): Promise<boolean> {
  return updateLegacyEvent(id, { in_vault: inVault } as Partial<LegacyEvent>);
}

export async function getVaultEvents(profileId: string): Promise<LegacyEvent[]> {
  const { data, error } = await supabase
    .from('legacy_events')
    .select('*')
    .eq('profile_id', profileId)
    .eq('in_vault', true)
    .is('deleted_at', null)
    .order('event_date', { ascending: false });
  if (error) { console.error('[legacyEngine] getVaultEvents', error); return []; }
  return (data || []) as LegacyEvent[];
}

export async function searchLegacyEvents(profileId: string, query: string): Promise<LegacyEvent[]> {
  const { data, error } = await supabase
    .from('legacy_events')
    .select('*')
    .eq('profile_id', profileId)
    .is('deleted_at', null)
    .or(`title.ilike.%${query}%,summary.ilike.%${query}%,user_text.ilike.%${query}%,ai_summary.ilike.%${query}%`)
    .order('event_date', { ascending: false });
  if (error) { console.error('[legacyEngine] searchLegacyEvents', error); return []; }
  return (data || []) as LegacyEvent[];
}

// ============================================================
// LIFE SEASONS
// ============================================================

export async function createLifeSeason(
  profileId: string,
  title: string,
  startDate: string,
  options?: {
    description?: string;
    scripture?: string;
    prayer?: string;
    whatImLearning?: string;
    peopleInvolved?: string;
  },
): Promise<LegacyLifeSeason | null> {
  const { data, error } = await supabase
    .from('legacy_life_seasons')
    .insert({
      profile_id: profileId,
      title,
      start_date: startDate,
      description: options?.description ?? null,
      scripture: options?.scripture ?? null,
      prayer: options?.prayer ?? null,
      what_im_learning: options?.whatImLearning ?? null,
      people_involved: options?.peopleInvolved ?? null,
    })
    .select('*')
    .single();
  if (error) { console.error('[legacyEngine] createLifeSeason', error); return null; }
  return data as LegacyLifeSeason;
}

export async function getLifeSeasons(profileId: string): Promise<LegacyLifeSeason[]> {
  const { data, error } = await supabase
    .from('legacy_life_seasons')
    .select('*')
    .eq('profile_id', profileId)
    .is('deleted_at', null)
    .order('start_date', { ascending: false });
  if (error) { console.error('[legacyEngine] getLifeSeasons', error); return []; }
  return (data || []) as LegacyLifeSeason[];
}

export async function getLifeSeasonById(id: string): Promise<LegacyLifeSeason | null> {
  const { data, error } = await supabase
    .from('legacy_life_seasons')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) { console.error('[legacyEngine] getLifeSeasonById', error); return null; }
  return data as LegacyLifeSeason | null;
}

export async function updateLifeSeason(id: string, updates: Partial<LegacyLifeSeason>): Promise<boolean> {
  const { error } = await supabase
    .from('legacy_life_seasons')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) { console.error('[legacyEngine] updateLifeSeason', error); return false; }
  return true;
}

export async function endLifeSeason(id: string, endDate: string, reflection: string): Promise<boolean> {
  return updateLifeSeason(id, { end_date: endDate, season_reflection: reflection } as Partial<LegacyLifeSeason>);
}

export async function softDeleteLifeSeason(id: string): Promise<boolean> {
  return updateLifeSeason(id, { deleted_at: new Date().toISOString() } as Partial<LegacyLifeSeason>);
}

// ============================================================
// LETTERS
// ============================================================

export async function createLetter(
  profileId: string,
  letterType: string,
  body: string,
  options?: {
    recipientLabel?: string;
    scriptureReference?: string;
    targetDate?: string;
  },
): Promise<LegacyLetter | null> {
  const { data, error } = await supabase
    .from('legacy_letters')
    .insert({
      profile_id: profileId,
      letter_type: letterType,
      body,
      recipient_label: options?.recipientLabel ?? null,
      scripture_reference: options?.scriptureReference ?? null,
      target_date: options?.targetDate ?? null,
    })
    .select('*')
    .single();
  if (error) { console.error('[legacyEngine] createLetter', error); return null; }
  return data as LegacyLetter;
}

export async function getLetters(profileId: string): Promise<LegacyLetter[]> {
  const { data, error } = await supabase
    .from('legacy_letters')
    .select('*')
    .eq('profile_id', profileId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) { console.error('[legacyEngine] getLetters', error); return []; }
  return (data || []) as LegacyLetter[];
}

export async function updateLetter(id: string, updates: Partial<LegacyLetter>): Promise<boolean> {
  const { error } = await supabase
    .from('legacy_letters')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) { console.error('[legacyEngine] updateLetter', error); return false; }
  return true;
}

export async function softDeleteLetter(id: string): Promise<boolean> {
  return updateLetter(id, { deleted_at: new Date().toISOString() } as Partial<LegacyLetter>);
}

// ============================================================
// MILESTONES
// ============================================================

export async function createMilestone(
  profileId: string,
  milestoneType: string,
  title: string,
  milestoneDate: string,
  options?: {
    churchName?: string;
    pastorName?: string;
    scripture?: string;
    reflection?: string;
  },
): Promise<LegacyMilestone | null> {
  const { data, error } = await supabase
    .from('legacy_milestones')
    .insert({
      profile_id: profileId,
      milestone_type: milestoneType,
      title,
      milestone_date: milestoneDate,
      church_name: options?.churchName ?? null,
      pastor_name: options?.pastorName ?? null,
      scripture: options?.scripture ?? null,
      reflection: options?.reflection ?? null,
    })
    .select('*')
    .single();
  if (error) { console.error('[legacyEngine] createMilestone', error); return null; }
  return data as LegacyMilestone;
}

export async function getMilestones(profileId: string): Promise<LegacyMilestone[]> {
  const { data, error } = await supabase
    .from('legacy_milestones')
    .select('*')
    .eq('profile_id', profileId)
    .is('deleted_at', null)
    .order('milestone_date', { ascending: false });
  if (error) { console.error('[legacyEngine] getMilestones', error); return []; }
  return (data || []) as LegacyMilestone[];
}

export async function softDeleteMilestone(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('legacy_milestones')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) { console.error('[legacyEngine] softDeleteMilestone', error); return false; }
  return true;
}

// ============================================================
// TESTIMONY
// ============================================================

export async function getTestimony(profileId: string): Promise<LegacyTestimony | null> {
  const { data, error } = await supabase
    .from('legacy_testimony')
    .select('*')
    .eq('profile_id', profileId)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) { console.error('[legacyEngine] getTestimony', error); return null; }
  return data as LegacyTestimony | null;
}

export async function upsertTestimony(profileId: string, fields: Partial<LegacyTestimony>): Promise<LegacyTestimony | null> {
  const existing = await getTestimony(profileId);
  if (existing) {
    const { data, error } = await supabase
      .from('legacy_testimony')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('*')
      .single();
    if (error) { console.error('[legacyEngine] upsertTestimony update', error); return null; }
    return data as LegacyTestimony;
  }
  const { data, error } = await supabase
    .from('legacy_testimony')
    .insert({ profile_id: profileId, ...fields })
    .select('*')
    .single();
  if (error) { console.error('[legacyEngine] upsertTestimony insert', error); return null; }
  return data as LegacyTestimony;
}

export async function setTestimonyAiOrganized(profileId: string, aiVersion: string): Promise<boolean> {
  const result = await upsertTestimony(profileId, { ai_organized_version: aiVersion } as Partial<LegacyTestimony>);
  return result !== null;
}

export async function deleteTestimonyAiOrganized(profileId: string): Promise<boolean> {
  const existing = await getTestimony(profileId);
  if (!existing) return true;
  const { error } = await supabase
    .from('legacy_testimony')
    .update({ ai_organized_version: null, updated_at: new Date().toISOString() })
    .eq('id', existing.id);
  if (error) { console.error('[legacyEngine] deleteTestimonyAiOrganized', error); return false; }
  return true;
}

// ============================================================
// SCRIPTURE REFS
// ============================================================

export async function createScriptureRef(
  profileId: string,
  passageReference: string,
  book: string,
  dateMarked: string,
  options?: {
    lifeSeasonId?: string;
    whyItMattered?: string;
    userReflection?: string;
    relatedPrayerId?: string;
    relatedSermonId?: string;
    relatedFamilyWalkId?: string;
  },
): Promise<LegacyScriptureRef | null> {
  const { data, error } = await supabase
    .from('legacy_scripture_refs')
    .insert({
      profile_id: profileId,
      passage_reference: passageReference,
      book,
      date_marked: dateMarked,
      life_season_id: options?.lifeSeasonId ?? null,
      why_it_mattered: options?.whyItMattered ?? null,
      user_reflection: options?.userReflection ?? null,
      related_prayer_id: options?.relatedPrayerId ?? null,
      related_sermon_id: options?.relatedSermonId ?? null,
      related_family_walk_id: options?.relatedFamilyWalkId ?? null,
    })
    .select('*')
    .single();
  if (error) { console.error('[legacyEngine] createScriptureRef', error); return null; }
  return data as LegacyScriptureRef;
}

export async function getScriptureRefs(profileId: string): Promise<LegacyScriptureRef[]> {
  const { data, error } = await supabase
    .from('legacy_scripture_refs')
    .select('*')
    .eq('profile_id', profileId)
    .is('deleted_at', null)
    .order('date_marked', { ascending: false });
  if (error) { console.error('[legacyEngine] getScriptureRefs', error); return []; }
  return (data || []) as LegacyScriptureRef[];
}

export async function getScriptureMap(profileId: string): Promise<ScriptureMapEntry[]> {
  const { data, error } = await supabase
    .from('legacy_scripture_refs')
    .select('book')
    .eq('profile_id', profileId)
    .is('deleted_at', null);
  if (error) { console.error('[legacyEngine] getScriptureMap', error); return []; }
  const counts = new Map<string, number>();
  for (const row of data || []) {
    const b = (row as { book: string }).book;
    counts.set(b, (counts.get(b) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([book, count]) => ({ book, count }))
    .sort((a, b) => b.count - a.count);
}

export async function softDeleteScriptureRef(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('legacy_scripture_refs')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) { console.error('[legacyEngine] softDeleteScriptureRef', error); return false; }
  return true;
}

// ============================================================
// YEAR REVIEWS
// ============================================================

export async function getYearReview(profileId: string, year: number): Promise<LegacyYearReview | null> {
  const { data, error } = await supabase
    .from('legacy_year_reviews')
    .select('*')
    .eq('profile_id', profileId)
    .eq('year', year)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) { console.error('[legacyEngine] getYearReview', error); return null; }
  return data as LegacyYearReview | null;
}

export async function upsertYearReview(
  profileId: string,
  year: number,
  fields: Partial<LegacyYearReview>,
): Promise<LegacyYearReview | null> {
  const existing = await getYearReview(profileId, year);
  if (existing) {
    const { data, error } = await supabase
      .from('legacy_year_reviews')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('*')
      .single();
    if (error) { console.error('[legacyEngine] upsertYearReview update', error); return null; }
    return data as LegacyYearReview;
  }
  const { data, error } = await supabase
    .from('legacy_year_reviews')
    .insert({ profile_id: profileId, year, ...fields })
    .select('*')
    .single();
  if (error) { console.error('[legacyEngine] upsertYearReview insert', error); return null; }
  return data as LegacyYearReview;
}

export async function deleteYearReviewAiSummary(profileId: string, year: number): Promise<boolean> {
  const existing = await getYearReview(profileId, year);
  if (!existing) return true;
  const { error } = await supabase
    .from('legacy_year_reviews')
    .update({ ai_year_summary: null, updated_at: new Date().toISOString() })
    .eq('id', existing.id);
  if (error) { console.error('[legacyEngine] deleteYearReviewAiSummary', error); return false; }
  return true;
}

export async function softDeleteYearReview(profileId: string, year: number): Promise<boolean> {
  const existing = await getYearReview(profileId, year);
  if (!existing) return true;
  const { error } = await supabase
    .from('legacy_year_reviews')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', existing.id);
  if (error) { console.error('[legacyEngine] softDeleteYearReview', error); return false; }
  return true;
}

// ============================================================
// DESIGNATED PERSONS
// ============================================================

export async function getDesignatedPersons(profileId: string): Promise<LegacyDesignatedPerson[]> {
  const { data, error } = await supabase
    .from('legacy_designated_persons')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
  if (error) { console.error('[legacyEngine] getDesignatedPersons', error); return []; }
  return (data || []) as LegacyDesignatedPerson[];
}

export async function createDesignatedPerson(
  profileId: string,
  personLabel: string,
  options?: { personEmail?: string; relationship?: string; conditions?: string },
): Promise<LegacyDesignatedPerson | null> {
  const { data, error } = await supabase
    .from('legacy_designated_persons')
    .insert({
      profile_id: profileId,
      person_label: personLabel,
      person_email: options?.personEmail ?? null,
      relationship: options?.relationship ?? null,
      conditions: options?.conditions ?? null,
    })
    .select('*')
    .single();
  if (error) { console.error('[legacyEngine] createDesignatedPerson', error); return null; }
  return data as LegacyDesignatedPerson;
}

// ============================================================
// ENTIRE LEGACY DELETION
// ============================================================
//
// Two distinct operations:
//   archiveEntireLegacy  — soft-delete (sets deleted_at). Recoverable. Used by "Archive".
//   permanentDeleteEntireLegacy — hard-delete (DELETE rows). Irreversible. Used by "Delete Permanently".
//
// The UI must never label permanent deletion as archive, or vice versa.

export async function archiveEntireLegacy(profileId: string): Promise<boolean> {
  const now = new Date().toISOString();
  const tables = [
    'legacy_events',
    'legacy_life_seasons',
    'legacy_letters',
    'legacy_milestones',
    'legacy_testimony',
    'legacy_scripture_refs',
    'legacy_year_reviews',
  ];
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .update({ deleted_at: now })
      .eq('profile_id', profileId)
      .is('deleted_at', null);
    if (error) console.error(`[legacyEngine] archiveEntireLegacy ${table}`, error);
  }
  return true;
}

export async function permanentDeleteEntireLegacy(profileId: string): Promise<boolean> {
  const tables = [
    'legacy_events',
    'legacy_life_seasons',
    'legacy_letters',
    'legacy_milestones',
    'legacy_testimony',
    'legacy_scripture_refs',
    'legacy_year_reviews',
    'legacy_designated_persons',
  ];
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('profile_id', profileId);
    if (error) console.error(`[legacyEngine] permanentDeleteEntireLegacy ${table}`, error);
  }
  return true;
}

// Backward-compatible alias — existing callers that used deleteEntireLegacy for
// soft-delete (archive) behavior continue to work. New code should call
// archiveEntireLegacy or permanentDeleteEntireLegacy explicitly.
export const deleteEntireLegacy = archiveEntireLegacy;

// ============================================================
// LEGACY RETRIEVAL (Personal — separate from global RAG)
// ============================================================

export async function retrieveLegacyRecords(
  profileId: string,
  query: string,
): Promise<LegacyEvent[]> {
  return searchLegacyEvents(profileId, query);
}

export async function getLegacyStats(profileId: string): Promise<{
  totalEvents: number;
  totalSeasons: number;
  totalPrayers: number;
  totalScripture: number;
  totalLetters: number;
  totalMilestones: number;
  vaultCount: number;
  thisYearEvents: number;
}> {
  const currentYear = new Date().getFullYear();
  const yearStart = `${currentYear}-01-01`;
  const yearEnd = `${currentYear}-12-31`;

  const [events, seasons, scripture, letters, milestones, vault] = await Promise.all([
    supabase.from('legacy_events').select('id, event_date, event_type').eq('profile_id', profileId).is('deleted_at', null),
    supabase.from('legacy_life_seasons').select('id').eq('profile_id', profileId).is('deleted_at', null),
    supabase.from('legacy_scripture_refs').select('id').eq('profile_id', profileId).is('deleted_at', null),
    supabase.from('legacy_letters').select('id').eq('profile_id', profileId).is('deleted_at', null),
    supabase.from('legacy_milestones').select('id').eq('profile_id', profileId).is('deleted_at', null),
    supabase.from('legacy_events').select('id').eq('profile_id', profileId).eq('in_vault', true).is('deleted_at', null),
  ]);

  const eventData = events.data || [];
  const prayerCount = eventData.filter(e => e.event_type === 'prayer' || e.event_type === 'answered_prayer').length;
  const thisYearEvents = eventData.filter(e => e.event_date >= yearStart && e.event_date <= yearEnd).length;

  return {
    totalEvents: eventData.length,
    totalSeasons: (seasons.data || []).length,
    totalPrayers: prayerCount,
    totalScripture: (scripture.data || []).length,
    totalLetters: (letters.data || []).length,
    totalMilestones: (milestones.data || []).length,
    vaultCount: (vault.data || []).length,
    thisYearEvents,
  };
}
