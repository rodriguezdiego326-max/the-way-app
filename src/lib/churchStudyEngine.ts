// Church studies: publisher writes (create, edit, status, assignments) and member reads.
// Visibility and write rules are enforced by database policies; this module only calls them.

import { supabase } from '@/lib/supabase';
import type { ChurchStudy, ChurchStudyAssignment, ChurchStudyStatus } from '@/lib/togetherTypes';

export interface AssignmentInput {
  week_label: string;
  passage_reference: string;
  reading_objective: string | null;
  discussion_questions: string[];
  prayer_focus: string | null;
  sort_order: number;
}

export async function createChurchStudy(
  churchId: string,
  title: string,
  description: string | null,
): Promise<ChurchStudy | null> {
  const { data, error } = await supabase
    .from('church_studies')
    .insert({ church_id: churchId, title: title.trim(), description: description?.trim() || null })
    .select('*')
    .single();
  if (error) {
    console.error('[Church] create study failed', { code: error.code, message: error.message });
    return null;
  }
  return (data as ChurchStudy) || null;
}

export async function updateChurchStudy(
  studyId: string,
  updates: { title: string; description: string | null },
): Promise<boolean> {
  const { error } = await supabase
    .from('church_studies')
    .update({ title: updates.title.trim(), description: updates.description?.trim() || null })
    .eq('id', studyId);
  if (error) {
    console.error('[Church] update study failed', { code: error.code, message: error.message });
    return false;
  }
  return true;
}

export async function setChurchStudyStatus(studyId: string, status: ChurchStudyStatus): Promise<boolean> {
  const { error } = await supabase.rpc('set_church_study_status', { p_study_id: studyId, p_status: status });
  if (error) {
    console.error('[Church] set study status failed', { code: error.code, message: error.message });
    return false;
  }
  return true;
}

export async function getStudyAssignments(studyId: string): Promise<ChurchStudyAssignment[]> {
  const { data, error } = await supabase
    .from('church_study_assignments')
    .select('*')
    .eq('church_study_id', studyId)
    .order('sort_order')
    .order('created_at');
  if (error) throw error;
  return (data as ChurchStudyAssignment[]) || [];
}

export async function createStudyAssignment(
  studyId: string,
  input: AssignmentInput,
): Promise<ChurchStudyAssignment | null> {
  const { data, error } = await supabase
    .from('church_study_assignments')
    .insert({ church_study_id: studyId, ...input })
    .select('*')
    .single();
  if (error) {
    console.error('[Church] create assignment failed', { code: error.code, message: error.message });
    return null;
  }
  return (data as ChurchStudyAssignment) || null;
}

export async function updateStudyAssignment(assignmentId: string, input: AssignmentInput): Promise<boolean> {
  const { error } = await supabase
    .from('church_study_assignments')
    .update(input)
    .eq('id', assignmentId);
  if (error) {
    console.error('[Church] update assignment failed', { code: error.code, message: error.message });
    return false;
  }
  return true;
}
