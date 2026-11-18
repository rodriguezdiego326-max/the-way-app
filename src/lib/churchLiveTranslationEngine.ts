import { supabase } from '@/lib/supabase';

export type ChurchLiveInputType = 'rtmp' | 'whip';
export type ChurchLiveLanguage = 'en' | 'es';
export type ChurchLiveProviderStatus =
  | 'not_connected'
  | 'provisioning'
  | 'ready'
  | 'live'
  | 'offline'
  | 'error';

export interface ChurchLiveTranslationSettings {
  church_id: string;
  enabled: boolean;
  input_type: ChurchLiveInputType;
  source_language: ChurchLiveLanguage;
  target_language: ChurchLiveLanguage;
  provider_status: ChurchLiveProviderStatus;
  created_by_profile_id: string;
  updated_by_profile_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChurchLiveFeedCredentials {
  provider: 'livekit';
  inputType: ChurchLiveInputType;
  ingressId: string;
  serverUrl: string;
  streamKey: string | null;
  roomName: string;
  reused?: boolean;
}

export interface ChurchLiveListenerToken {
  url: string;
  token: string;
  roomName: string;
}

interface FunctionErrorShape {
  error?: string;
}

function functionErrorCode(error: unknown): string | null {
  const response = (error as { context?: unknown } | null)?.context;
  if (!(response instanceof Response)) return null;
  return response.headers.get('x-solapath-error');
}

export async function getChurchLiveTranslationSettings(
  churchId: string,
): Promise<ChurchLiveTranslationSettings | null> {
  const { data, error } = await supabase
    .from('church_live_translation_settings')
    .select('*')
    .eq('church_id', churchId)
    .maybeSingle();

  if (error) {
    console.error('[ChurchLive] load settings failed', {
      code: error.code,
      message: error.message,
    });
    return null;
  }

  return (data as ChurchLiveTranslationSettings | null) ?? null;
}

export async function provisionChurchLiveFeed(
  churchId: string,
  inputType: ChurchLiveInputType,
  sourceLanguage: ChurchLiveLanguage,
  targetLanguage: ChurchLiveLanguage,
): Promise<{ credentials: ChurchLiveFeedCredentials | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke<ChurchLiveFeedCredentials & FunctionErrorShape>(
    'church-live-feed-admin',
    {
      body: {
        action: 'provision',
        churchId,
        inputType,
        sourceLanguage,
        targetLanguage,
      },
    },
  );

  if (error) {
    const code = functionErrorCode(error);
    console.error('[ChurchLive] provision failed', { message: error.message, code });
    return { credentials: null, error: code || 'provision_failed' };
  }

  if (data?.error) return { credentials: null, error: data.error };
  return { credentials: data as ChurchLiveFeedCredentials, error: null };
}

export async function getChurchLiveFeedCredentials(
  churchId: string,
): Promise<ChurchLiveFeedCredentials | null> {
  const { data, error } = await supabase.functions.invoke<ChurchLiveFeedCredentials & FunctionErrorShape>(
    'church-live-feed-admin',
    { body: { action: 'credentials', churchId } },
  );

  if (error || data?.error) return null;
  return data as ChurchLiveFeedCredentials;
}

export async function getChurchLiveListenerToken(
  churchId: string,
): Promise<ChurchLiveListenerToken | null> {
  const { data, error } = await supabase.functions.invoke<ChurchLiveListenerToken & FunctionErrorShape>(
    'church-live-feed-admin',
    { body: { action: 'listener_token', churchId } },
  );

  if (error || data?.error) return null;
  return data as ChurchLiveListenerToken;
}
