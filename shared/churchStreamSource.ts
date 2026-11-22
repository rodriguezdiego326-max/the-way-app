export type StreamKind = 'youtube' | 'web' | 'hls' | 'media';
export type StreamState = 'saved' | 'connecting' | 'live' | 'blocked' | 'offline' | 'error';
export type StreamHint = 'auto' | 'direct';
export interface StreamConfig {
  url: string;
  kind: StreamKind;
  provider: string;
  label: string;
  sourceLanguage: 'en' | 'es';
  targetLanguage: 'en' | 'es';
}
export interface ChurchStreamSource {
  revision: number;
  kind: StreamKind;
  provider: string;
  label: string;
  watchUrl: string | null;
  sourceUrl?: string;
  sourceLanguage: 'en' | 'es';
  targetLanguage: 'en' | 'es';
  state: StreamState;
  error: string | null;
  hasSession: boolean;
  canTranslate: boolean;
  canListen: boolean;
}
export interface ChurchStreamResult {
  source: ChurchStreamSource | null;
  revision: number;
  canManage: boolean;
  error?: string;
}

export function publicHttpsUrl(input: string): URL {
  if (input.length > 4096) throw new Error('invalid_stream_url');
  let url: URL;
  try { url = new URL(input.trim()); } catch { throw new Error('invalid_stream_url'); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || url.port
    || !host.includes('.') || /^[\d.]+$/.test(host) || host.includes(':')
    || /(^|\.)(localhost|local|internal|home|lan|test|invalid|onion|arpa)$/.test(host)
    || host.endsWith('.') || !/^[a-z0-9.-]+$/.test(host)) {
    throw new Error('public_https_required');
  }
  url.hash = '';
  return url;
}

export function classifyStreamUrl(input: string, hint: StreamHint = 'auto') {
  const url = publicHttpsUrl(input);
  const host = url.hostname.replace(/^www\./, '');
  const parts = url.pathname.split('/').filter(Boolean);
  if (['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'].includes(host)) {
    const id = host === 'youtu.be' ? parts[0]
      : url.pathname === '/watch' ? url.searchParams.get('v')
      : ['live', 'embed', 'shorts'].includes(parts[0]) ? parts[1] : null;
    if (!id && (parts[0]?.startsWith('@') || ['channel', 'c', 'user'].includes(parts[0]))) {
      return { url: url.href, kind: 'web' as const, provider: 'YouTube' };
    }
    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) throw new Error('invalid_youtube_url');
    return { url: `https://www.youtube.com/watch?v=${id}`, kind: 'youtube' as const, provider: 'YouTube' };
  }
  const provider = host === 'vimeo.com' || host.endsWith('.vimeo.com') ? 'Vimeo'
    : host === 'facebook.com' || host.endsWith('.facebook.com') || host === 'fb.watch' ? 'Facebook'
    : host === 'twitch.tv' || host.endsWith('.twitch.tv') ? 'Twitch' : null;
  if (provider) return { url: url.href, kind: 'web' as const, provider };
  if (/\.m3u8$/i.test(url.pathname)) return { url: url.href, kind: 'hls' as const, provider: 'Direct stream' };
  if (hint === 'direct' || /\.(mp3|mp4|m4a|ogg|webm|mov)$/i.test(url.pathname)) {
    return { url: url.href, kind: 'media' as const, provider: 'Direct stream' };
  }
  return { url: url.href, kind: 'web' as const, provider: 'Website' };
}

export function churchStreamMessage(code: string | null | undefined): string {
  switch (code) {
    case 'invalid_youtube_url': return 'Enter a valid YouTube Live URL.';
    case 'invalid_stream_url':
    case 'public_https_required':
    case 'stream_address_blocked': return 'Enter a public HTTPS stream or viewing link.';
    case 'viewing_link_only': return 'This link opens the provider’s player. Translation needs a direct audio or video feed.';
    case 'youtube_playback_manifest_unavailable':
    case 'youtube_access_denied':
    case 'youtube_client_unsupported':
    case 'youtube_unavailable': return 'Your YouTube link is saved, but YouTube has not supplied usable audio for translation.';
    case 'youtube_not_live': return 'This broadcast is not live. Start the broadcast before connecting.';
    case 'youtube_resolve_timeout':
    case 'stream_timeout': return 'The connection timed out. Refresh the feed status before trying again.';
    case 'stream_not_media': return 'This address returns a webpage, not a direct audio or video stream.';
    case 'stream_requires_login': return 'This stream requires sign-in or permission from its provider.';
    case 'stream_unreachable':
    case 'stream_dns_failed': return 'The stream could not be reached. Check the link or contact its provider.';
    case 'stream_manifest_restricted': return 'This stream uses protected media or unsupported playlist links.';
    case 'source_changed':
    case 'operation_in_progress': return 'The church feed changed or is being updated. Refresh its status before trying again.';
    case 'stop_before_editing': return 'Stop the current stream connection before changing or removing this link.';
    case 'feed_not_ready': return 'Audio is not reaching SOLAPATH yet. Check the stream status.';
    case 'no_audio': return 'The source is connected, but no audio track has been detected.';
    case 'stream_ended': return 'The stream has ended. A church leader can reconnect it when broadcasting resumes.';
    case 'stream_ingress_failed': return 'The media service could not receive this stream.';
    case 'translation_agent_failed': return 'The translation service could not start. Please try again later.';
    case 'stream_cleanup_failed': return 'The stream could not be stopped completely. Try Stop connection again.';
    case 'livekit_not_configured': return 'The church media service still needs to be configured.';
    case 'leadership_required': return 'Only authorized church leaders can manage this feed.';
    case 'unauthorized': return 'Sign in again to access the church feed.';
    default: return 'The church stream could not be updated. Please try again.';
  }
}
