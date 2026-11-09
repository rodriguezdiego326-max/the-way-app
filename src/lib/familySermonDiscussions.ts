import { supabase } from '@/lib/supabase';
import type { FamilyProfile, FamilySermonDiscussion } from '@/lib/familyTypes';

export interface FamilySermonDiscussionDraft {
  sermonTitle: string | null;
  mainPoint: string | null;
  scriptureReferences: string[];
  discussionQuestion: string | null;
  discussionBody: string;
}

export async function loadMyFamilyProfile(): Promise<FamilyProfile | null> {
  const { data, error } = await supabase
    .from('family_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .maybeSingle();
  if (error) throw error;
  return (data as FamilyProfile) ?? null;
}

export async function createMyFamilyProfile(): Promise<FamilyProfile> {
  const { data, error } = await supabase
    .from('family_profiles')
    .insert({ family_name: 'My Family', memory_enabled: true })
    .select('*')
    .single();
  if (error || !data) throw error ?? new Error('Family profile was not created');
  return data as FamilyProfile;
}

export async function createFamilySermonDiscussion(
  familyProfileId: string,
  draft: FamilySermonDiscussionDraft,
): Promise<FamilySermonDiscussion> {
  const { data, error } = await supabase
    .from('family_sermon_discussions')
    .insert({
      family_profile_id: familyProfileId,
      sermon_title: draft.sermonTitle,
      main_point: draft.mainPoint,
      scripture_references: draft.scriptureReferences,
      discussion_question: draft.discussionQuestion,
      discussion_body: draft.discussionBody,
    })
    .select('*')
    .single();
  if (error || !data) throw error ?? new Error('Family discussion was not saved');
  return data as FamilySermonDiscussion;
}

export async function getFamilySermonDiscussions(familyProfileId: string): Promise<FamilySermonDiscussion[]> {
  const { data, error } = await supabase
    .from('family_sermon_discussions')
    .select('*')
    .eq('family_profile_id', familyProfileId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as FamilySermonDiscussion[]) ?? [];
}

export async function getFamilySermonDiscussion(discussionId: string): Promise<FamilySermonDiscussion | null> {
  const { data, error } = await supabase
    .from('family_sermon_discussions')
    .select('*')
    .eq('id', discussionId)
    .maybeSingle();
  if (error) throw error;
  return (data as FamilySermonDiscussion) ?? null;
}

export async function completeFamilySermonDiscussion(discussionId: string): Promise<FamilySermonDiscussion> {
  const { data, error } = await supabase
    .from('family_sermon_discussions')
    .update({ status: 'complete', completed_at: new Date().toISOString() })
    .eq('id', discussionId)
    .select('*')
    .single();
  if (error || !data) throw error ?? new Error('Family discussion was not updated');
  return data as FamilySermonDiscussion;
}

export async function deleteFamilySermonDiscussion(discussionId: string): Promise<void> {
  const { error } = await supabase
    .from('family_sermon_discussions')
    .delete()
    .eq('id', discussionId);
  if (error) throw error;
}
