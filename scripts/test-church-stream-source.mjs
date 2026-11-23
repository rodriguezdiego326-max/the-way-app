import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { build } from 'esbuild';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const load = async (entryPoints, plugins = []) => {
  const result = await build({ entryPoints: [entryPoints], bundle: true, platform: 'node', format: 'esm', write: false, plugins: [
    ...plugins,
    { name: 'ipaddr', setup(b) { b.onResolve({ filter: /^npm:ipaddr/ }, () => ({ path: require.resolve('ipaddr.js') })); } },
  ] });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
};
const { classifyStreamUrl, churchStreamMessage } = await load('shared/churchStreamSource.ts');
const { probeMediaSource, isPublicAddress } = await load('supabase/functions/church-stream-source/mediaSource.ts');
const publicDns = async () => ['93.184.216.34'];
const media = (type = 'audio/mpeg') => new Response('media', { headers: { 'content-type': type } });
const playlist = content => new Response(content, { headers: { 'content-type': 'application/vnd.apple.mpegurl' } });

test('links are classified without confusing watch pages with playable media', () => {
  assert.equal(classifyStreamUrl('https://youtu.be/hNGObmydgcE?feature=shared').url, 'https://www.youtube.com/watch?v=hNGObmydgcE');
  assert.equal(classifyStreamUrl('https://www.youtube.com/@church/live').kind, 'web');
  for (const provider of ['https://vimeo.com/123', 'https://www.facebook.com/church/live', 'https://www.twitch.tv/church', 'https://church.example/watch']) {
    assert.equal(classifyStreamUrl(provider).kind, 'web');
  }
  assert.equal(classifyStreamUrl('https://vimeo.com/123', 'direct').kind, 'web');
  assert.equal(classifyStreamUrl('https://cdn.example/live.m3u8?token=keep').kind, 'hls');
  assert.equal(classifyStreamUrl('https://cdn.example/feed.mp3').kind, 'media');
  assert.equal(classifyStreamUrl('https://cdn.example/feed', 'direct').kind, 'media');
  assert.equal(classifyStreamUrl('https://youtube.com.evil.example/live/hNGObmydgcE').kind, 'web');
});

test('private, credential-bearing, local, and insecure source addresses are rejected', () => {
  for (const url of ['http://church.example/a.mp3', 'https://127.0.0.1/a.mp3', 'https://[::1]/a', 'https://user:secret@cdn.example/a', 'https://church.local/a', 'https://church.example:8443/a', 'https://0x7f000001/a']) {
    assert.throws(() => classifyStreamUrl(url), /public_https_required/);
  }
  for (const address of ['127.0.0.1','10.0.0.2','172.16.2.1','192.168.1.1','169.254.169.254','100.64.0.1','0.0.0.0','::1','fc00::1','fe80::1','::ffff:127.0.0.1','bad']) assert.equal(isPublicAddress(address), false, address);
  assert.equal(isPublicAddress('2606:4700:4700::1111'), true);
});

test('direct media keeps signed query strings and accepts a validated HLS playlist', async () => {
  const url = 'https://cdn.example/sermon.mp3?token=abc';
  assert.equal(await probeMediaSource(url, publicDns, async () => media()), url);
  assert.equal(await probeMediaSource('https://cdn.example/live.m3u8', publicDns, async () => playlist('#EXTM3U\n#EXTINF:4\nsegment.ts')), 'https://cdn.example/live.m3u8');
});

test('DNS, redirect, provider access, HTML, and protected playlist failures stay distinct', async () => {
  await assert.rejects(probeMediaSource('https://cdn.example/a.mp3', async () => ['10.0.0.1'], async () => { throw new Error('must not fetch'); }), /stream_address_blocked/);
  await assert.rejects(probeMediaSource('https://cdn.example/a.mp3', publicDns, async () => new Response(null, { status: 302, headers: { location: 'https://127.0.0.1/private' } })), /public_https_required/);
  await assert.rejects(probeMediaSource('https://cdn.example/a.mp3', publicDns, async () => new Response('login', { status: 403 })), /stream_requires_login/);
  await assert.rejects(probeMediaSource('https://cdn.example/audio', publicDns, async () => media('text/html')), /stream_not_media/);
  for (const content of ['#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="key"\nsegment.ts', '#EXTM3U\nhttps://127.0.0.1/internal', '#EXTM3U\n#EXT-X-MEDIA:URI="https://private.example/list.m3u8"\nsegment.ts']) {
    await assert.rejects(probeMediaSource('https://cdn.example/a.m3u8', async host => host === 'private.example' ? ['192.168.0.1'] : await publicDns(), async () => playlist(content)), /stream_manifest_restricted|public_https_required|stream_address_blocked/);
  }
});

test('even stalled DNS is bounded by the source deadline', async () => {
  await assert.rejects(probeMediaSource('https://cdn.example/a.mp3', () => new Promise(() => {}), async () => media(), 10), /stream_timeout/);
});

const churchId = '11111111-1111-4111-8111-111111111111';
const profileId = '22222222-2222-4222-8222-222222222222';
const config = { url: 'https://cdn.example/a.mp3?token=private', kind: 'media', provider: 'Direct stream', label: 'Sunday service', sourceLanguage: 'en', targetLanguage: 'es' };
let row, calls, member, role, appRole, authValid, ingressStatus, audio, dispatchFails, cleanupFails, grant, handler;
function reset() {
  row = { config: null, session: null, state: 'saved', error_code: null, revision: 0, operation_id: null };
  calls = []; member = true; role = 'PASTOR'; appRole = null; authValid = true; ingressStatus = 1; audio = true; dispatchFails = false; cleanupFails = false; grant = null;
}
reset();
const client = {
  auth: { getUser: async () => ({ data: { user: authValid ? { id: profileId } : null }, error: null }) },
  from(name) {
    assert.equal(name, 'church_memberships');
    const chain = { select() { return chain; }, eq() { return chain; }, async maybeSingle() { return { data: member ? { verified_church_role: role } : null, error: null }; } };
    return chain;
  },
  async rpc(name, args) {
    if (name === 'get_app_admin_role') return { data: appRole };
    assert.equal(name, 'church_stream_source_service');
    calls.push(args.p_action);
    if (args.p_action === 'get') return { data: structuredClone(row) };
    if (args.p_action === 'claim') {
      if (row.operation_id) return { error: { message: 'operation_in_progress' } };
      if (row.revision !== args.p_payload.revision) return { error: { message: 'source_changed' } };
      row.operation_id = args.p_operation_id;
    } else if (args.p_action === 'release') {
      if (row.operation_id === args.p_operation_id) row.operation_id = null;
    } else {
      if (row.operation_id !== args.p_operation_id) return { error: { message: 'source_changed' } };
      row = { ...row, ...args.p_payload };
      if (args.p_action === 'write') { row.revision++; row.operation_id = null; }
    }
    return { data: structuredClone(row) };
  },
};
const api = {
  ingress: {
    async listIngress() { return [{ ingressId: 'ingress-test', state: { status: ingressStatus } }]; },
    async createIngress(type, options) { calls.push(['createIngress', type, options]); return { ingressId: 'ingress-test' }; },
    async deleteIngress(id) { calls.push(['deleteIngress', id]); if (cleanupFails) throw new Error('offline'); },
  },
  room: {
    async listParticipants() { return [{ identity: row.session?.sourceIdentity, tracks: [{ type: audio ? 0 : 1 }] }]; },
    async deleteRoom(roomName) { calls.push(['deleteRoom', roomName]); },
  },
  agentDispatch: { async createDispatch(...args) { calls.push(['dispatch', ...args]); if (dispatchFails) throw new Error('offline'); } },
};
globalThis.__streamTest = {
  createClient: () => client,
  LiveKitAPI: class { constructor() { return api; } },
  AccessToken: class { addGrant(value) { grant = value; } async toJwt() { return 'test-token'; } },
  IngressInput: { URL_INPUT: 2 },
  Innertube: { create: async () => ({ getBasicInfo: async () => ({ basic_info: { is_live: true }, playability_status: { status: 'OK' } }) }) },
};
globalThis.Deno = { serve(value) { handler = value; }, env: { get(name) { return name === 'LIVEKIT_URL' ? 'wss://livekit.example' : 'test-value'; } }, resolveDns: publicDns };
await load('supabase/functions/church-stream-source/index.ts', [{ name: 'edge-mocks', setup(b) {
  b.onResolve({ filter: /^jsr:/ }, () => ({ path: 'empty', namespace: 'mock' }));
  b.onResolve({ filter: /^npm:(@supabase|livekit|youtubei)/ }, () => ({ path: 'services', namespace: 'mock' }));
  b.onLoad({ filter: /.*/, namespace: 'mock' }, ({ path }) => ({ contents: path === 'empty' ? 'export {}' : 'export const { createClient, LiveKitAPI, AccessToken, IngressInput, Innertube } = globalThis.__streamTest;' }));
} }]);
async function request(action, values = {}) {
  const response = await handler(new Request('https://functions.example/church-stream-source', { method: 'POST', headers: { Authorization: 'Bearer test-user' }, body: JSON.stringify({ churchId, action, revision: row.revision, ...values }) }));
  return { status: response.status, data: await response.json() };
}

test('authentication and membership protect every source action', async () => {
  reset(); authValid = false;
  assert.equal((await request('get')).status, 401);
  authValid = true; member = false;
  for (const action of ['get','save','start','stop','remove','listener_token']) assert.equal((await request(action)).status, 403);
  assert.deepEqual(calls, []);
});

test('members read safe source status; only verified leaders or App Owner can change it', async () => {
  reset(); row.config = config; role = null;
  const memberView = await request('get');
  assert.equal(memberView.data.canManage, false);
  assert.equal(memberView.data.source.sourceUrl, undefined);
  assert.equal(memberView.data.source.watchUrl, null);
  for (const action of ['save','start','stop','remove']) assert.equal((await request(action)).status, 403);
  appRole = 'APP_OWNER';
  const saved = await request('save', { sourceUrl: 'https://youtu.be/hNGObmydgcE', sourceLanguage: 'es', label: 'Sunday' });
  assert.equal(saved.status, 200);
  assert.equal(saved.data.source.sourceLanguage, 'es');
  assert.equal(saved.data.source.targetLanguage, 'en');
  assert.equal(row.config.url, 'https://www.youtube.com/watch?v=hNGObmydgcE');
  assert.equal(row.revision, 1);
  assert.equal((await request('remove', { revision: 0 })).status, 409);
  assert.equal(row.config.label, 'Sunday');
});

test('viewing pages remain saved and cannot be mistaken for a translation connection', async () => {
  reset();
  await request('save', { sourceUrl: 'https://vimeo.com/12345' });
  const response = await request('start');
  assert.equal(response.data.source.watchUrl, 'https://vimeo.com/12345');
  assert.equal(response.data.source.canListen, false);
  assert.equal(response.data.source.error, 'viewing_link_only');
  assert.equal(calls.some(c => Array.isArray(c) && c[0] === 'createIngress'), false);
});

test('direct source setup is shared, checkpoints resources, and grants members subscribe-only access', async () => {
  reset(); row.config = config;
  const previousFetch = globalThis.fetch; globalThis.fetch = async () => media();
  try {
    const started = await request('start');
    assert.equal(started.data.source.state, 'connecting');
    assert.equal(started.data.source.canListen, false);
    assert.ok(calls.indexOf('checkpoint') < calls.findIndex(c => Array.isArray(c) && c[0] === 'dispatch'));
    assert.equal((await request('listener_token')).status, 409);
    ingressStatus = 2; role = null;
    const ready = await request('get');
    assert.equal(ready.data.source.canListen, true);
    assert.equal(ready.data.source.sourceUrl, undefined);
    const connected = await request('listener_token');
    assert.equal(connected.data.connection.sourceIdentity, row.session.sourceIdentity);
    assert.deepEqual(grant, { roomJoin: true, room: row.session.roomName, canSubscribe: true, canPublish: false, canPublishData: false });
    role = 'PASTOR';
    assert.equal((await request('save', { sourceUrl: 'https://other.example/watch' })).status, 409);
    assert.equal((await request('remove')).status, 409);
    const roomName = row.session.roomName;
    await request('stop', { roomName: 'church-other', ingressId: 'unrelated' });
    assert.equal(row.session, null);
    assert.ok(calls.some(c => Array.isArray(c) && c[0] === 'deleteIngress' && c[1] === 'ingress-test'));
    assert.ok(calls.some(c => Array.isArray(c) && c[0] === 'deleteRoom' && c[1] === roomName));
  } finally { globalThis.fetch = previousFetch; }
});

test('video-only, failed, and ended ingresses never advertise working translation', async () => {
  reset(); row.config = config; row.session = { ingressId: 'test', roomName: 'test', sourceIdentity: 'test', startedAt: new Date(Date.now() - 120000).toISOString() };
  ingressStatus = 2; audio = false;
  let response = await request('get');
  assert.equal(response.data.source.error, 'no_audio');
  assert.equal(response.data.source.state, 'error');
  assert.equal(response.data.source.canListen, false);
  ingressStatus = 3; response = await request('get'); assert.equal(response.data.source.error, 'stream_ingress_failed');
  ingressStatus = 4; response = await request('get'); assert.equal(response.data.source.state, 'offline');
});

test('a YouTube broadcast without usable audio retains its viewing link and explains the restriction', async () => {
  reset(); row.config = { ...config, ...classifyStreamUrl('https://youtu.be/hNGObmydgcE') };
  const response = await request('start');
  assert.equal(response.data.source.error, 'youtube_playback_manifest_unavailable');
  assert.equal(response.data.source.canListen, false);
  assert.ok(response.data.source.watchUrl);
  assert.equal(row.session, null);
});

test('failed agent startup cleans allocated resources; cleanup failures retain a recoverable session', async () => {
  const previousFetch = globalThis.fetch; globalThis.fetch = async () => media();
  try {
    reset(); row.config = config; dispatchFails = true;
    let response = await request('start');
    assert.equal(response.data.source.error, 'translation_agent_failed');
    assert.equal(row.session, null);
    reset(); row.config = config; dispatchFails = true; cleanupFails = true;
    response = await request('start');
    assert.equal(row.error_code, 'stream_cleanup_failed');
    assert.equal(response.data.source.error, 'stream_cleanup_failed');
    assert.equal(response.data.source.canListen, false);
    assert.ok(row.session);
    cleanupFails = false; await request('stop');
    assert.equal(row.session, null);
  } finally { globalThis.fetch = previousFetch; }
});

test('all shared stream messages and static panel labels have Spanish translations', () => {
  const dictionary = ts.createSourceFile('i18n.tsx', readFileSync('src/lib/i18n.tsx','utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const keys = new Set();
  const visitDictionary = node => { if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.name)) keys.add(node.name.text); ts.forEachChild(node, visitDictionary); };
  visitDictionary(dictionary);
  const messages = new Set();
  for (const file of ['src/components/ChurchStreamSourcePanel.tsx','src/screens/ChurchLiveTranslationScreen.tsx','shared/churchStreamSource.ts','src/components/ChurchAudioPairPanel.tsx','src/lib/churchAudioPair.ts','src/sender.tsx']) {
    const source = ts.createSourceFile(file, readFileSync(file,'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const visit = node => {
      if (ts.isCallExpression(node) && node.expression.getText(source) === 't' && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) messages.add(node.arguments[0].text);
      if ((file.startsWith('shared')||file.endsWith('churchAudioPair.ts')) && ts.isReturnStatement(node) && node.expression && ts.isStringLiteral(node.expression)) messages.add(node.expression.text);
      ts.forEachChild(node, visit);
    }; visit(source);
  }
  for (const key of messages) assert.ok(keys.has(key), `Spanish translation missing: ${key}`);
  assert.ok(churchStreamMessage('youtube_playback_manifest_unavailable').includes('link is saved'));
});
