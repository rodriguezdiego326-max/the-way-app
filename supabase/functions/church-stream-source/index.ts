import { registerTranslationMeasurement } from '../_shared/translationMeasurement.ts';
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { AccessToken, IngressInput, LiveKitAPI } from 'npm:livekit-server-sdk@2.20.0';
import { Innertube } from 'npm:youtubei.js@18.3.0';
import { classifyStreamUrl, type StreamConfig, type ChurchStreamSource, type StreamState } from '../../../shared/churchStreamSource.ts';
import { resolveYouTubeLiveHls } from '../church-youtube-live-source/youtubeSource.ts';
import { corsHeaders, json } from '../church-youtube-live-source/response.ts';
import { probeMediaSource } from './mediaSource.ts';

interface Session { roomName: string; ingressId: string; sourceIdentity: string; startedAt: string }
interface Row {
  config: StreamConfig | null; session: Session | null; state: StreamState;
  error_code: string | null; revision: number; operation_id: string | null;
  operation_expires_at: string | null;
}
const leadership = new Set(['PASTOR', 'CHURCH_ADMIN', 'ELDER', 'LEADER']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const failureCodes = new Set([
  'invalid_stream_url','public_https_required','stream_address_blocked','stream_dns_failed',
  'stream_unreachable','stream_not_media','stream_requires_login','stream_manifest_restricted','stream_timeout',
  'viewing_link_only','stop_before_editing','source_changed','operation_in_progress','feed_not_ready',
  'livekit_not_configured','stream_ingress_failed','translation_agent_failed','stream_cleanup_failed',
  'invalid_youtube_url','youtube_not_live','youtube_access_denied','youtube_client_unsupported','youtube_unavailable',
  'youtube_playback_manifest_unavailable','youtube_manifest_host_rejected','youtube_resolve_timeout','youtube_resolve_failed',
]);
function errorCode(error: unknown) {
  const message = error instanceof Error ? error.message : (error as { message?: string })?.message;
  return message && failureCodes.has(message) ? message : 'stream_update_failed';
}
function isMissing(error: unknown) {
  const e = error as { status?: number; code?: string };
  return e?.status === 404 || e?.code === 'not_found';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!url || !anon || !service) return json({ error: 'not_configured' }, 503);
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'unauthorized' }, 401);
  const fetchTimed: typeof fetch = (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(12_000) });
  const userClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` }, fetch: fetchTimed }, auth: { persistSession: false } });
  const admin = createClient(url, service, { global: { fetch: fetchTimed }, auth: { persistSession: false } });
  let release: (() => Promise<unknown>) | undefined;
  try {
    const { data: auth, error: authError } = await userClient.auth.getUser(token);
    if (authError || !auth.user) return json({ error: 'unauthorized' }, 401);
    const raw = await req.text();
    if (raw.length > 16000) return json({ error: 'invalid_request' }, 400);
    let body: Record<string, unknown>;
    try { body = JSON.parse(raw); } catch { return json({ error: 'invalid_request' }, 400); }
    if (!body || typeof body !== 'object') return json({ error: 'invalid_request' }, 400);
    const churchId = typeof body.churchId === 'string' ? body.churchId : '';
    if (!uuid.test(churchId)) return json({ error: 'church_required' }, 400);
    const { data: member, error: memberError } = await userClient.from('church_memberships')
      .select('verified_church_role').eq('church_id', churchId).eq('profile_id', auth.user.id).maybeSingle();
    if (memberError || !member) return json({ error: 'not_a_church_member' }, 403);
    const { data: appRole } = await userClient.rpc('get_app_admin_role');
    const canManage = leadership.has(member.verified_church_role) || appRole === 'APP_OWNER';
    const action = typeof body.action === 'string' ? body.action : '';
    if (!['get','save','start','stop','remove','listener_token'].includes(action)) return json({ error: 'unsupported_action' }, 400);
    if (!['get','listener_token'].includes(action) && !canManage) return json({ error: 'leadership_required' }, 403);
    const rpc = async (verb: string, operation: string | null = null, payload: unknown = {}) => {
      const { data, error } = await admin.rpc('church_stream_source_service', {
        p_church_id: churchId, p_action: verb, p_operation_id: operation, p_payload: payload,
      });
      if (error) throw new Error(errorCode(error));
      return data as Row | null;
    };
    const livekitUrl = Deno.env.get('LIVEKIT_URL') ?? '';
    const apiKey = Deno.env.get('LIVEKIT_API_KEY') ?? '';
    const secret = Deno.env.get('LIVEKIT_API_SECRET') ?? '';
    const api = () => {
      if (!livekitUrl || !apiKey || !secret) throw new Error('livekit_not_configured');
      return new LiveKitAPI({ host: livekitUrl.replace(/^wss:/, 'https:'), apiKey, secret, requestTimeout: 8 });
    };
    const snapshot = async (row: Row | null) => {
      if (!row?.config) return { source: null, revision: Number(row?.revision ?? 0), canManage };
      let state = row.state;
      let error = row.error_code;
      let canListen = false;
      if (row.session && row.error_code !== 'stream_cleanup_failed') {
        try {
          const info = (await api().ingress.listIngress({ ingressId: row.session.ingressId }))[0];
          const status = info?.state?.status;
          if (status === 2) {
            // A publishing endpoint alone can be video-only. Require a real
            // source audio publication before offering the translation listener.
            const participant = (await api().room.listParticipants(row.session.roomName))
              .find(p => p.identity === row.session?.sourceIdentity);
            canListen = !!participant?.tracks.some(track => track.type === 0);
            state = canListen ? 'live' : Date.now() - Date.parse(row.session.startedAt) > 60_000 ? 'error' : 'connecting';
            error = canListen ? null : 'no_audio';
          } else if (status === 3) { state = 'error'; error = 'stream_ingress_failed'; }
          else if (status === 4 || !info) { state = 'offline'; error = 'stream_ended'; }
          else if (Date.now() - Date.parse(row.session.startedAt) > 60_000) { state = 'error'; error = 'stream_timeout'; }
          else { state = 'connecting'; error = null; }
        } catch { state = 'error'; error = 'stream_unreachable'; }
      }
      const config = row.config;
      const source: ChurchStreamSource = {
        revision: Number(row.revision), kind: config.kind, provider: config.provider, label: config.label,
        watchUrl: ['youtube','web'].includes(config.kind) ? config.url : null,
        ...(canManage ? { sourceUrl: config.url } : {}),
        sourceLanguage: config.sourceLanguage, targetLanguage: config.targetLanguage,
        state, error, hasSession: !!row.session, canTranslate: config.kind !== 'web', canListen,
      };
      return { source, revision: Number(row.revision), canManage };
    };
    if (action === 'get') return json(await snapshot(await rpc('get')));
    if (action === 'listener_token') {
      const row = await rpc('get');
      const current = await snapshot(row);
      if (!row?.session || !current.source?.canListen) return json({ error: 'feed_not_ready' }, 409);
      const access = new AccessToken(apiKey, secret, { identity: `${auth.user.id}-${crypto.randomUUID().slice(0,8)}`, ttl: '1h' });
      access.addGrant({ roomJoin: true, room: row.session.roomName, canSubscribe: true, canPublish: false, canPublishData: false });
      return json({ connection: { url: livekitUrl.replace(/^https:/, 'wss:'), token: await access.toJwt(),
        roomName: row.session.roomName, sourceIdentity: row.session.sourceIdentity,
        measurementId: await registerTranslationMeasurement(auth.user.id, churchId, row.session.roomName) } });
    }
    if (!Number.isSafeInteger(body.revision) || Number(body.revision) < 0) return json({ error: 'source_changed' }, 409);
    const operation = crypto.randomUUID();
    let row = await rpc('claim', operation, { revision: body.revision });
    if (!row) throw new Error('source_changed');
    release = () => rpc('release', operation);
    const write = async (patch: Partial<Row>, checkpoint = false) => {
      row = await rpc(checkpoint ? 'checkpoint' : 'write', operation, { ...row, ...patch, updated_by: auth.user.id });
      if (!checkpoint) release = undefined;
      return row;
    };
    const stopSession = async (session: Session) => {
      if (!session.roomName.startsWith(`church-stream-${churchId}-`)) throw new Error('stream_cleanup_failed');
      const client = api();
      for (const remove of [() => client.ingress.deleteIngress(session.ingressId), () => client.room.deleteRoom(session.roomName)]) {
        try { await remove(); } catch (error) { if (!isMissing(error)) throw new Error('stream_cleanup_failed'); }
      }
    };
    if (action === 'save') {
      if (row.session) throw new Error('stop_before_editing');
      const classified = classifyStreamUrl(typeof body.sourceUrl === 'string' ? body.sourceUrl : '', body.hint === 'direct' ? 'direct' : 'auto');
      const sourceLanguage = body.sourceLanguage === 'es' ? 'es' : 'en';
      const targetLanguage = sourceLanguage === 'en' ? 'es' : 'en';
      const config: StreamConfig = { ...classified,
        label: typeof body.label === 'string' && body.label.trim() ? body.label.trim().slice(0,80) : classified.provider,
        sourceLanguage, targetLanguage };
      await write({ config, session: null, state: 'saved', error_code: classified.kind === 'web' ? 'viewing_link_only' : null });
    } else if (action === 'remove') {
      if (row.session) throw new Error('stop_before_editing');
      await write({ config: null, session: null, state: 'saved', error_code: null });
    } else if (action === 'stop') {
      if (row.session) await stopSession(row.session);
      await write({ session: null, state: 'saved', error_code: null });
    } else if (action === 'start') {
      if (!row.config) throw new Error('invalid_stream_url');
      if (row.session) throw new Error('stop_before_editing');
      const client = api();
      const config = row.config;
      let session: Session | null = null;
      try {
        if (config.kind === 'web') throw new Error('viewing_link_only');
        let mediaUrl: string;
        if (config.kind === 'youtube') {
          const source = await resolveYouTubeLiveHls(config.url, signal => Innertube.create({ lang: 'en', location: 'US', fetch: (input, init) => fetch(input, { ...init, signal }) }));
          mediaUrl = source.hlsUrl;
        } else {
          mediaUrl = await probeMediaSource(config.url, async host => {
            const results = await Promise.allSettled([Deno.resolveDns(host, 'A'), Deno.resolveDns(host, 'AAAA')]);
            return results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
          });
        }
        const suffix = crypto.randomUUID();
        const roomName = `church-stream-${churchId}-${suffix}`;
        const sourceIdentity = `church-stream-feed-${churchId}-${suffix}`;
        const ingress = await client.ingress.createIngress(IngressInput.URL_INPUT, {
          name: 'SOLAPATH Church Stream', roomName, participantIdentity: sourceIdentity,
          participantName: 'Church stream', url: mediaUrl, enableTranscoding: true,
          participantMetadata: JSON.stringify({ churchId, role: 'sermon_source', sourceKind: config.kind }),
        }).catch(() => { throw new Error('stream_ingress_failed'); });
        if (!ingress.ingressId) throw new Error('stream_ingress_failed');
        session = { roomName, ingressId: ingress.ingressId, sourceIdentity, startedAt: new Date().toISOString() };
        await write({ session, state: 'connecting', error_code: null }, true);
        await client.agentDispatch.createDispatch(roomName, 'solapath-sermon-translator', { metadata: JSON.stringify({
          churchId, sourceLanguage: config.sourceLanguage, targetLanguage: config.targetLanguage,
          sourceParticipantIdentity: sourceIdentity, sourceKind: config.kind,
        }) }).catch(() => { throw new Error('translation_agent_failed'); });
        await write({ session, state: 'connecting', error_code: null });
      } catch (error) {
        let code = errorCode(error);
        if (session) {
          try { await stopSession(session); session = null; } catch { code = 'stream_cleanup_failed'; }
        }
        await write({ session, state: session ? 'error' : 'blocked', error_code: code });
      }
    }
    return json(await snapshot(row));
  } catch (error) {
    const code = errorCode(error);
    console.warn(JSON.stringify({ event: 'church_stream_request_failed', code }));
    return json({ error: code }, ['source_changed','operation_in_progress','stop_before_editing'].includes(code) ? 409 : 422);
  } finally { if (release) await release().catch(() => undefined); }
});
