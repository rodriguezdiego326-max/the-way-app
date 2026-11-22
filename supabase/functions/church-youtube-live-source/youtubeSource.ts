interface YouTubeInfo {
  basic_info?: { title?: string | null; is_live?: boolean };
  streaming_data?: { hls_manifest_url?: string };
  playability_status?: { status?: string; reason?: string };
}

type CreatePlayer = (signal: AbortSignal) => Promise<{
  getBasicInfo(videoId: string): Promise<YouTubeInfo>;
}>;

export function extractYouTubeVideoId(input: string): string | null {
  const raw = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;
  let url: URL;
  try { url = new URL(raw); } catch { return null; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  const parts = url.pathname.split('/').filter(Boolean);
  let candidate = '';
  if (hostname === 'youtu.be') {
    candidate = parts[0] ?? '';
  } else if (['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(hostname)) {
    candidate = url.pathname === '/watch'
      ? url.searchParams.get('v') ?? ''
      : ['live', 'embed', 'shorts'].includes(parts[0]) ? parts[1] ?? '' : '';
  }
  return /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : null;
}

const ERROR_CODES = new Set([
  'invalid_youtube_url', 'youtube_resolve_timeout', 'youtube_not_live',
  'youtube_access_denied', 'youtube_client_unsupported', 'youtube_unavailable',
  'youtube_playback_manifest_unavailable', 'youtube_manifest_host_rejected',
]);

function playbackError(status?: string, reason = ''): string | null {
  if (/no longer supported|update.*(?:app|client)|unsupported (?:app|client)/i.test(reason)) {
    return 'youtube_client_unsupported';
  }
  if (status === 'LOGIN_REQUIRED' || /sign in|confirm.*not a bot/i.test(reason)) {
    return 'youtube_access_denied';
  }
  if (status === 'LIVE_STREAM_OFFLINE') return 'youtube_not_live';
  return status && status !== 'OK' ? 'youtube_unavailable' : null;
}

export function youtubeErrorCode(cause: unknown): string {
  if (cause instanceof Error && ERROR_CODES.has(cause.message)) return cause.message;
  const info = (cause as { info?: { status?: string; reason?: string } } | null)?.info;
  return playbackError(info?.status, info?.reason) ?? 'youtube_resolve_failed';
}

export async function resolveYouTubeLiveHls(
  input: string,
  createPlayer: CreatePlayer,
  timeoutMs = 20_000,
) {
  const videoId = extractYouTubeVideoId(input);
  if (!videoId) throw new Error('invalid_youtube_url');
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        const player = await createPlayer(controller.signal);
        // Use the regular player request. The TV_EMBEDDED client is rejected by
        // YouTube. Access restrictions must fail explicitly, without client cycling.
        const info = await player.getBasicInfo(videoId);
        const failure = playbackError(info.playability_status?.status, info.playability_status?.reason);
        if (failure) throw new Error(failure);
        if (info.basic_info?.is_live === false) throw new Error('youtube_not_live');
        const hlsUrl = info.streaming_data?.hls_manifest_url;
        if (!hlsUrl) throw new Error('youtube_playback_manifest_unavailable');
        let parsed: URL;
        try { parsed = new URL(hlsUrl); } catch { throw new Error('youtube_manifest_host_rejected'); }
        const host = parsed.hostname.toLowerCase();
        if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port
          || !(host === 'googlevideo.com' || host.endsWith('.googlevideo.com'))) {
          throw new Error('youtube_manifest_host_rejected');
        }
        return { videoId, title: info.basic_info?.title ?? null, hlsUrl };
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error('youtube_resolve_timeout'));
        }, timeoutMs);
      }),
    ]);
  } catch (cause) {
    throw new Error(controller.signal.aborted ? 'youtube_resolve_timeout' : youtubeErrorCode(cause));
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}
