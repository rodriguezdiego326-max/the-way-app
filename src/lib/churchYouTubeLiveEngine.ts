import { supabase } from '@/lib/supabase';
import { churchStreamErrorCode, withStreamDeadline } from '@/lib/churchStreamErrors';
import type { ChurchLiveLanguage } from '@/lib/churchLiveTranslationEngine';

export interface ChurchYouTubeResolveResult {
  provider: 'youtube';
  videoId: string;
  title: string | null;
  resolvable: true;
}

export interface ChurchYouTubeListenerConnection {
  url: string;
  token: string;
  roomName: string;
}

export interface ChurchYouTubeLiveSession {
  provider: 'youtube';
  videoId: string;
  title: string | null;
  ingressId: string;
  roomName: string;
  sourceParticipantIdentity: string;
  sourceLanguage: ChurchLiveLanguage;
  targetLanguage: ChurchLiveLanguage;
  agentStatus: 'ready';
  listener: ChurchYouTubeListenerConnection;
  startedAt: string;
}

interface FunctionErrorShape {
  error?: string;
}

export async function resolveChurchYouTubeLiveSource(
  churchId: string,
  youtubeUrl: string,
): Promise<{ source: ChurchYouTubeResolveResult | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke<ChurchYouTubeResolveResult & FunctionErrorShape>(
    'church-youtube-live-source',
    {
      body: {
        action: 'resolve',
        churchId,
        youtubeUrl,
      },
    },
  );

  if (error) {
    return {
      source: null,
      error: (await churchStreamErrorCode(error)) || error.message || 'youtube_resolve_failed',
    };
  }

  if (data?.error) return { source: null, error: data.error };
  return { source: data as ChurchYouTubeResolveResult, error: null };
}

export async function startChurchYouTubeLiveSource(
  churchId: string,
  youtubeUrl: string,
  sourceLanguage: ChurchLiveLanguage,
  targetLanguage: ChurchLiveLanguage,
): Promise<{ session: ChurchYouTubeLiveSession | null; error: string | null }> {
  try {
    const { data, error } = await withStreamDeadline(
      supabase.functions.invoke<ChurchYouTubeLiveSession & FunctionErrorShape>(
        'church-youtube-live-source',
        { body: { action: 'start', churchId, youtubeUrl, sourceLanguage, targetLanguage } },
      ),
      async ({ data, error }) => {
        if (!error && data && !data.error && data.roomName && data.ingressId) {
          await stopChurchYouTubeLiveSource(churchId, data);
        }
      },
    );
    if (error) {
      return {
        session: null,
        error: (await churchStreamErrorCode(error)) || error.message || 'youtube_start_failed',
      };
    }
    if (data?.error) return { session: null, error: data.error };
    return { session: data as ChurchYouTubeLiveSession, error: null };
  } catch (cause) {
    return {
      session: null,
      error: cause instanceof Error && cause.message === 'youtube_connection_timeout'
        ? cause.message : 'youtube_start_failed',
    };
  }
}

export async function getChurchYouTubeListenerToken(
  churchId: string,
  roomName: string,
  sourceParticipantIdentity: string,
): Promise<ChurchYouTubeListenerConnection | null> {
  const { data, error } = await supabase.functions.invoke<ChurchYouTubeListenerConnection & FunctionErrorShape>(
    'church-youtube-live-source',
    {
      body: {
        action: 'listener_token',
        churchId,
        roomName,
        sourceParticipantIdentity,
      },
    },
  );

  if (error || data?.error) return null;
  return data as ChurchYouTubeListenerConnection;
}

export async function stopChurchYouTubeLiveSource(
  churchId: string,
  session: Pick<ChurchYouTubeLiveSession, 'roomName' | 'ingressId'>,
): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke<{ stopped?: boolean } & FunctionErrorShape>(
    'church-youtube-live-source',
    {
      body: {
        action: 'stop',
        churchId,
        roomName: session.roomName,
        ingressId: session.ingressId,
      },
    },
  );

  return !error && !data?.error && data?.stopped === true;
}
