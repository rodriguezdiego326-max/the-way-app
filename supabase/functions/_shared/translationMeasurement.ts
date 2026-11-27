import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

/** Best-effort shadow registration. Never prevent translation or return secrets in logs. */
export async function registerTranslationMeasurement(profileId: string, churchId: string | null, roomName: string | null): Promise<string | null> {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return null;
  try {
    const client = createClient(url, key, { auth: { persistSession: false }, global: {
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(2000) }),
    } });
    const { data, error } = await client.rpc('register_translation_measurement', {
      p_profile_id: profileId, p_church_id: churchId,
      p_mode: churchId ? 'church' : 'microphone', p_room_name: roomName,
    });
    if (error || typeof data !== 'string') throw new Error('measurement_unavailable');
    return data;
  } catch {
    console.warn('translation_measurement_registration_unavailable');
    return null;
  }
}
