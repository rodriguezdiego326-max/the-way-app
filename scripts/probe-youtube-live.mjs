import { Innertube } from 'youtubei.js';

const input = process.env.TEST_YOUTUBE_URL || '';
const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|live\/|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
const videoId = match?.[1] || (/^[A-Za-z0-9_-]{11}$/.test(input) ? input : null);

if (!videoId) {
  console.error('PROBE_RESULT=invalid_youtube_url');
  process.exit(2);
}

const youtube = await Innertube.create({ lang: 'en', location: 'US' });
const info = await youtube.getInfo(videoId, { client: 'TV' });
const hls = info.streaming_data?.hls_manifest_url ?? null;

console.log('VIDEO_ID=' + videoId);
console.log('TITLE=' + (info.basic_info?.title ?? ''));
console.log('IS_LIVE=' + String(info.basic_info?.is_live ?? false));
console.log('HAS_HLS=' + String(Boolean(hls)));
console.log('HLS_HOST=' + (hls ? new URL(hls).hostname : ''));
console.log('PROBE_RESULT=' + (hls ? 'resolvable_live_hls' : 'no_live_hls'));

if (!hls) process.exit(3);
