import { supabase } from '@/lib/supabase';
import { churchStreamErrorCode, withStreamDeadline } from '@/lib/churchStreamErrors';
import type { ChurchStreamResult } from '../../shared/churchStreamSource';
export type { ChurchStreamResult, ChurchStreamSource, StreamHint } from '../../shared/churchStreamSource';
export { churchStreamMessage } from '../../shared/churchStreamSource';

export interface StreamConnection { url: string; token: string; roomName: string; sourceIdentity: string; measurementId?: string | null }
export async function churchStreamRequest(
  churchId: string,
  action: 'get' | 'save' | 'start' | 'stop' | 'remove' | 'listener_token',
  values: Record<string, unknown> = {},
): Promise<{ data: (ChurchStreamResult & { connection?: StreamConnection }) | null; error: string | null }> {
  try {
    const result = await withStreamDeadline(supabase.functions.invoke<ChurchStreamResult & { connection?: StreamConnection }>(
      'church-stream-source', { body: { ...values, churchId, action } },
    ), async () => undefined, 60_000);
    if (result.error) return { data: null, error: await churchStreamErrorCode(result.error) || 'stream_update_failed' };
    if (result.data?.error) return { data: null, error: result.data.error };
    return { data: result.data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error && error.message === 'youtube_connection_timeout' ? 'stream_timeout' : 'stream_update_failed' };
  }
}
