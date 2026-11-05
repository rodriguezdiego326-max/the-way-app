import { supabase } from './supabase';
import { AI_PROCESSING_CONSENT_VERSION } from './privacyConfig';
import type { Profile } from './types';

export function hasCurrentAiConsent(profile: Profile | null): boolean {
  return profile?.ai_processing_consent === true
    && profile.ai_processing_consent_version === AI_PROCESSING_CONSENT_VERSION;
}

export async function grantAiConsent(profileId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ai_processing_consent: true,
      ai_processing_consent_at: new Date().toISOString(),
      ai_processing_consent_version: AI_PROCESSING_CONSENT_VERSION,
    })
    .eq('id', profileId)
    .select('*')
    .maybeSingle();
  if (error || !data) throw new Error('Could not save your AI permission. Please try again.');
  return data as Profile;
}

export async function withdrawAiConsent(profileId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ai_processing_consent: false,
      ai_processing_consent_at: null,
      ai_processing_consent_version: null,
    })
    .eq('id', profileId)
    .select('*')
    .maybeSingle();
  if (error || !data) throw new Error('Could not withdraw your AI permission. Please try again.');
  return data as Profile;
}
