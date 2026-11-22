import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import { FunctionsHttpError } from '@supabase/supabase-js';

async function load(path) {
  const { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  });
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
}

const { churchStreamErrorCode, withStreamDeadline } = await load('src/lib/churchStreamErrors.ts');
const { resolveYouTubeLiveHls } = await load('supabase/functions/church-youtube-live-source/youtubeSource.ts');
const { json } = await load('supabase/functions/church-youtube-live-source/response.ts');
const url = 'https://www.youtube.com/live/hNGObmydgcE?feature=shared';
const playable = {
  basic_info: { title: 'Test church broadcast', is_live: true },
  playability_status: { status: 'OK' },
  streaming_data: { hls_manifest_url: 'https://manifest.googlevideo.com/api/manifest/hls/test' },
};
const player = (info) => async () => ({ getBasicInfo: async () => info });

test('422 response survives the Supabase FunctionsHttpError boundary and is CORS-visible', async () => {
  const response = json({ error: 'youtube_playback_manifest_unavailable' }, 422);
  assert.equal(response.status, 422);
  assert.equal(response.headers.get('Access-Control-Expose-Headers'), 'x-solapath-error');
  assert.equal(response.headers.get('x-solapath-error'), 'youtube_playback_manifest_unavailable');
  assert.equal(await churchStreamErrorCode(new FunctionsHttpError(response)), 'youtube_playback_manifest_unavailable');
  assert.deepEqual(await response.json(), { error: 'youtube_playback_manifest_unavailable' });
});

test('legacy body-only errors and proxy header-only errors are readable', async () => {
  const body = new Response('{"error":"invalid_youtube_url"}', { status: 422 });
  assert.equal(await churchStreamErrorCode(new FunctionsHttpError(body)), 'invalid_youtube_url');
  const proxy = new Response('Gateway timeout', { status: 504, headers: { 'x-solapath-error': 'youtube_resolve_timeout' } });
  assert.equal(await churchStreamErrorCode(new FunctionsHttpError(proxy)), 'youtube_resolve_timeout');
  assert.equal(await churchStreamErrorCode(new Error('network failure')), null);
});

test('a valid live HLS source resolves without changing its signed URL', async () => {
  const result = await resolveYouTubeLiveHls(url, player(playable));
  assert.equal(result.videoId, 'hNGObmydgcE');
  assert.equal(result.hlsUrl, playable.streaming_data.hls_manifest_url);
});

test('live metadata alone is not treated as a usable audio source', async () => {
  await assert.rejects(resolveYouTubeLiveHls(url, player({ ...playable, streaming_data: undefined })), /youtube_playback_manifest_unavailable/);
});

test('provider restrictions, obsolete clients, and offline streams are distinguished', async () => {
  for (const [status, reason, code] of [
    ['LOGIN_REQUIRED', "Sign in to confirm you're not a bot", 'youtube_access_denied'],
    ['ERROR', 'YouTube is no longer supported in this application or device.', 'youtube_client_unsupported'],
    ['LIVE_STREAM_OFFLINE', 'Starts soon', 'youtube_not_live'],
  ]) {
    await assert.rejects(resolveYouTubeLiveHls(url, player({ playability_status: { status, reason } })), new RegExp(code));
  }
  const unsupported = Object.assign(new Error('This video is unavailable'), {
    info: { status: 'ERROR', reason: 'YouTube is no longer supported in this application or device.' },
  });
  await assert.rejects(resolveYouTubeLiveHls(url, async () => ({ getBasicInfo: async () => { throw unsupported; } })), /youtube_client_unsupported/);
  await assert.rejects(resolveYouTubeLiveHls(url, player({ ...playable, basic_info: { is_live: false } })), /youtube_not_live/);
});

test('URL validation cannot send a caller-supplied external host to the player or ingress', async () => {
  let called = false;
  await assert.rejects(resolveYouTubeLiveHls('https://youtube.com.evil.example/live/hNGObmydgcE', async () => { called = true; }), /invalid_youtube_url/);
  assert.equal(called, false);
  for (const hls of ['http://manifest.googlevideo.com/live', 'https://googlevideo.com.evil.example/live', 'https://127.0.0.1/live', 'https://user:password@manifest.googlevideo.com/live']) {
    await assert.rejects(resolveYouTubeLiveHls(url, player({ ...playable, streaming_data: { hls_manifest_url: hls } })), /youtube_manifest_host_rejected/);
  }
});

test('a stalled provider request times out and aborts its fetch signal', async () => {
  let signal;
  const stalled = resolveYouTubeLiveHls(url, async (next) => {
    signal = next;
    return { getBasicInfo: () => new Promise(() => {}) };
  }, 10);
  await assert.rejects(stalled, /youtube_resolve_timeout/);
  assert.equal(signal.aborted, true);
});

test('client timeout cleans up a late session instead of showing it as connected', async () => {
  let finish;
  const request = new Promise((resolve) => { finish = resolve; });
  const cleaned = [];
  await assert.rejects(withStreamDeadline(request, async (result) => { cleaned.push(result); }, 10), /youtube_connection_timeout/);
  finish({ roomName: 'isolated-test-room', ingressId: 'test-ingress' });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(cleaned, [{ roomName: 'isolated-test-room', ingressId: 'test-ingress' }]);
});

test('normal success and thrown network errors settle without late cleanup', async () => {
  let cleaned = false;
  const cleanup = async () => { cleaned = true; };
  assert.equal(await withStreamDeadline(Promise.resolve('ready'), cleanup, 10), 'ready');
  await assert.rejects(withStreamDeadline(Promise.reject(new Error('network')), cleanup, 10), /network/);
  assert.equal(cleaned, false);
});
