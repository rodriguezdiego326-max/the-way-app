import ipaddr from 'npm:ipaddr.js@2.2.0';
import { publicHttpsUrl } from '../../../shared/churchStreamSource.ts';

type ResolveHost = (host: string) => Promise<string[]>;
export function isPublicAddress(address: string): boolean {
  try {
    const parsed = ipaddr.process(address);
    return parsed.range() === 'unicast';
  } catch { return false; }
}
export async function validateMediaAddress(input: string, resolveHost: ResolveHost): Promise<URL> {
  const url = publicHttpsUrl(input);
  let addresses: string[];
  try { addresses = await resolveHost(url.hostname); } catch { throw new Error('stream_dns_failed'); }
  if (!addresses.length) throw new Error('stream_dns_failed');
  if (!addresses.every(isPublicAddress)) throw new Error('stream_address_blocked');
  return url;
}

// Never fetch a viewing page. Validate each redirect and HLS reference before
// handing a public media URL to the media service. No client cookies are forwarded.
export async function probeMediaSource(input: string, resolveHost: ResolveHost, fetcher = fetch, timeoutMs = 12_000) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new Error('stream_timeout')); }, timeoutMs);
  });
  const probe = async () => {
    let url = await validateMediaAddress(input, resolveHost);
    let response: Response | undefined;
    for (let redirect = 0; redirect <= 3; redirect++) {
      response = await fetcher(url.href, { redirect: 'manual', signal: controller.signal,
        headers: { Range: 'bytes=0-131071', Accept: 'application/vnd.apple.mpegurl, audio/*, video/*' } });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      await response.body?.cancel();
      const location = response.headers.get('location');
      if (!location || redirect === 3) throw new Error('stream_unreachable');
      url = await validateMediaAddress(new URL(location, url).href, resolveHost);
    }
    if (!response) throw new Error('stream_unreachable');
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error([401, 403].includes(response.status) ? 'stream_requires_login' : 'stream_unreachable');
    }
    const type = (response.headers.get('content-type') ?? '').split(';')[0].toLowerCase();
    const isHls = /mpegurl/.test(type) || /\.m3u8$/i.test(url.pathname);
    if (!isHls) {
      await response.body?.cancel();
      if (!/^(audio|video)\//.test(type) && type !== 'application/ogg') throw new Error('stream_not_media');
      return url.href;
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error('stream_not_media');
    let text = '';
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        if (text.length > 131072) throw new Error('stream_manifest_restricted');
      }
    } finally { await reader.cancel().catch(() => undefined); }
    if (!text.trimStart().startsWith('#EXTM3U')) throw new Error('stream_not_media');
    if (/#EXT-X-(?:SESSION-)?KEY:.*METHOD=(?!NONE)/i.test(text)) throw new Error('stream_manifest_restricted');
    const references = text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'));
    for (const match of text.matchAll(/URI="([^"]+)"/g)) references.push(match[1]);
    if (!references.length || references.length > 200) throw new Error('stream_manifest_restricted');
    const checked = new Set<string>();
    for (const ref of references) {
      const child = publicHttpsUrl(new URL(ref, url).href);
      if (!checked.has(child.hostname)) {
        await validateMediaAddress(child.href, resolveHost);
        checked.add(child.hostname);
      }
    }
    return url.href;
  };
  try {
    return await Promise.race([probe(), deadline]);
  } catch (error) {
    if (controller.signal.aborted) throw new Error('stream_timeout');
    if (error instanceof Error && /^(stream_|public_https_|invalid_stream_)/.test(error.message)) throw error;
    throw new Error('stream_unreachable');
  } finally { clearTimeout(timer!); controller.abort(); }
}
