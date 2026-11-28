import { supabase } from '@/lib/supabase';
export type ChurchChoice = { id: string; name: string; city: string | null; website: string | null; source: string; is_mine: boolean; hidden: boolean };
export async function getChurchChoices(ids: string[] | null = null): Promise<ChurchChoice[]> {
  if (ids?.length === 0) return [];
  const { data, error } = await supabase.rpc('church_choice_details', { p_ids: ids });
  if (error) throw error;
  return data || [];
}
export async function setChurchHidden(id: string, hidden: boolean): Promise<void> {
  const { error } = await supabase.rpc('set_church_hidden', { p_church_id: id, p_hidden: hidden });
  if (error) throw error;
}
