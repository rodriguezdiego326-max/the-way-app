import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { AccessToken, IngressInput, LiveKitAPI } from "npm:livekit-server-sdk@2.20.0";
import { Innertube } from "npm:youtubei.js@18.3.0";

import { corsHeaders, json } from "./response.ts";
import { resolveYouTubeLiveHls as resolveSource, youtubeErrorCode } from "./youtubeSource.ts";

const LEADERSHIP_ROLES = new Set(["PASTOR", "CHURCH_ADMIN", "ELDER", "LEADER"]);
const TRANSLATION_AGENT_NAME = "solapath-sermon-translator";
const YOUTUBE_ROOM_PREFIX = "church-youtube-";
const YOUTUBE_SOURCE_PREFIX = "church-youtube-feed-";

function serverHost(url: string) {
  return url.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:");
}

function clientHost(url: string) {
  return url.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:");
}

function assertYouTubeRoom(churchId: string, roomName: string) {
  return roomName.startsWith(`${YOUTUBE_ROOM_PREFIX}${churchId}-`);
}

function assertYouTubeSource(churchId: string, sourceIdentity: string) {
  return sourceIdentity.startsWith(`${YOUTUBE_SOURCE_PREFIX}${churchId}-`);
}

function resolveYouTubeLiveHls(youtubeUrl: string) {
  return resolveSource(youtubeUrl, (signal) => Innertube.create({
    lang: "en",
    location: "US",
    fetch: (input, init) => fetch(input, { ...init, signal }),
  }));
}

function sourceFailure(cause: unknown) {
  const code = youtubeErrorCode(cause);
  // Do not log signed media URLs, auth headers, or the full provider response.
  console.warn(JSON.stringify({ event: "youtube_source_failed", code }));
  return json({ error: code }, code === "youtube_resolve_timeout" ? 504 : 422);
}

async function ensureTranslationAgent(
  api: LiveKitAPI,
  roomName: string,
  churchId: string,
  sourceParticipantIdentity: string,
  sourceLanguage: "en" | "es",
  targetLanguage: "en" | "es",
) {
  const metadata = JSON.stringify({
    churchId,
    sourceLanguage,
    targetLanguage,
    sourceParticipantIdentity,
    sourceKind: "youtube_live",
  });

  const dispatch = await api.agentDispatch.createDispatch(
    roomName,
    TRANSLATION_AGENT_NAME,
    { metadata },
  );

  return {
    status: "ready" as const,
    dispatchId: dispatch.id,
  };
}

async function makeListenerToken(
  livekitUrl: string,
  livekitApiKey: string,
  livekitApiSecret: string,
  roomName: string,
  identity: string,
) {
  const access = new AccessToken(livekitApiKey, livekitApiSecret, {
    identity,
    ttl: "2h",
  });
  access.addGrant({
    roomJoin: true,
    room: roomName,
    canSubscribe: true,
    canPublish: false,
    canPublishData: false,
  });

  return {
    url: clientHost(livekitUrl),
    token: await access.toJwt(),
    roomName,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const livekitUrl = Deno.env.get("LIVEKIT_URL") ?? "";
  const livekitApiKey = Deno.env.get("LIVEKIT_API_KEY") ?? "";
  const livekitApiSecret = Deno.env.get("LIVEKIT_API_SECRET") ?? "";

  if (!supabaseUrl || !anonKey) return json({ error: "not_configured" }, 500);

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "unauthorized" }, 401);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "invalid_request" }, 400);
  }

  const body = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const action = typeof body.action === "string" ? body.action : "";
  const churchId = typeof body.churchId === "string" ? body.churchId : "";
  if (!churchId) return json({ error: "church_required" }, 400);

  const { data: membership, error: membershipError } = await userClient
    .from("church_memberships")
    .select("verified_church_role")
    .eq("church_id", churchId)
    .eq("profile_id", userData.user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    return json({ error: "not_a_church_member" }, 403);
  }

  const verifiedRole =
    (membership as { verified_church_role?: string | null }).verified_church_role ?? null;
  const isLeadership = verifiedRole ? LEADERSHIP_ROLES.has(verifiedRole) : false;
  const { data: appAdminRole } = await userClient.rpc("get_app_admin_role");
  const isAppOwner = appAdminRole === "APP_OWNER";
  const canManageLiveFeed = isLeadership || isAppOwner;

  if (action === "status") {
    return json({
      provider: "youtube",
      available: true,
      canManageLiveFeed,
      verifiedRole,
      isolated: true,
    });
  }

  if (action === "resolve") {
    if (!canManageLiveFeed) return json({ error: "leadership_required" }, 403);

    const youtubeUrl = typeof body.youtubeUrl === "string" ? body.youtubeUrl : "";
    if (!youtubeUrl) return json({ error: "youtube_url_required" }, 400);

    try {
      const source = await resolveYouTubeLiveHls(youtubeUrl);
      return json({
        provider: "youtube",
        videoId: source.videoId,
        title: source.title,
        resolvable: true,
      });
    } catch (cause) {
      return sourceFailure(cause);
    }
  }

  if (action === "start") {
    if (!canManageLiveFeed) return json({ error: "leadership_required" }, 403);
    if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
      return json({ error: "livekit_not_configured" }, 503);
    }

    const youtubeUrl = typeof body.youtubeUrl === "string" ? body.youtubeUrl : "";
    if (!youtubeUrl) return json({ error: "youtube_url_required" }, 400);

    const sourceLanguage = body.sourceLanguage === "es" ? "es" : "en";
    const targetLanguage = body.targetLanguage === "en" ? "en" : "es";
    if (sourceLanguage === targetLanguage) {
      return json({ error: "languages_must_differ" }, 400);
    }

    let source: Awaited<ReturnType<typeof resolveYouTubeLiveHls>>;
    try {
      source = await resolveYouTubeLiveHls(youtubeUrl);
    } catch (cause) {
      return sourceFailure(cause);
    }

    const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
    const roomName = `${YOUTUBE_ROOM_PREFIX}${churchId}-${suffix}`;
    const sourceParticipantIdentity = `${YOUTUBE_SOURCE_PREFIX}${churchId}-${suffix}`;

    const api = new LiveKitAPI({
      host: serverHost(livekitUrl),
      apiKey: livekitApiKey,
      secret: livekitApiSecret,
    });

    let ingress;
    try {
      ingress = await api.ingress.createIngress(IngressInput.URL_INPUT, {
        name: "SOLAPATH YouTube Live Sermon Feed",
        roomName,
        participantIdentity: sourceParticipantIdentity,
        participantName: "YouTube Live Sermon Feed",
        participantMetadata: JSON.stringify({
          role: "sermon_source",
          churchId,
          sourceKind: "youtube_live",
          videoId: source.videoId,
        }),
        url: source.hlsUrl,
        enableTranscoding: true,
      });
    } catch (cause) {
      console.error("church-youtube-live-source: URL ingress failed", cause);
      return json({ error: "youtube_ingress_failed" }, 502);
    }

    if (!ingress.ingressId) return json({ error: "youtube_ingress_failed" }, 502);

    let agent;
    try {
      agent = await ensureTranslationAgent(
        api,
        roomName,
        churchId,
        sourceParticipantIdentity,
        sourceLanguage,
        targetLanguage,
      );
    } catch (cause) {
      console.error("church-youtube-live-source: agent dispatch failed", cause);
      await api.ingress.deleteIngress(ingress.ingressId).catch(() => undefined);
      return json({ error: "translation_agent_failed" }, 502);
    }

    const listener = await makeListenerToken(
      livekitUrl,
      livekitApiKey,
      livekitApiSecret,
      roomName,
      userData.user.id,
    );

    return json({
      provider: "youtube",
      videoId: source.videoId,
      title: source.title,
      ingressId: ingress.ingressId,
      roomName,
      sourceParticipantIdentity,
      sourceLanguage,
      targetLanguage,
      agentStatus: agent.status,
      listener,
      startedAt: new Date().toISOString(),
    });
  }

  if (action === "listener_token") {
    if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
      return json({ error: "livekit_not_configured" }, 503);
    }

    const roomName = typeof body.roomName === "string" ? body.roomName : "";
    const sourceParticipantIdentity =
      typeof body.sourceParticipantIdentity === "string" ? body.sourceParticipantIdentity : "";

    if (
      !roomName ||
      !sourceParticipantIdentity ||
      !assertYouTubeRoom(churchId, roomName) ||
      !assertYouTubeSource(churchId, sourceParticipantIdentity)
    ) {
      return json({ error: "invalid_youtube_session" }, 400);
    }

    return json(await makeListenerToken(
      livekitUrl,
      livekitApiKey,
      livekitApiSecret,
      roomName,
      userData.user.id,
    ));
  }

  if (action === "stop") {
    if (!canManageLiveFeed) return json({ error: "leadership_required" }, 403);
    if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
      return json({ error: "livekit_not_configured" }, 503);
    }

    const roomName = typeof body.roomName === "string" ? body.roomName : "";
    const ingressId = typeof body.ingressId === "string" ? body.ingressId : "";

    if (!roomName || !ingressId || !assertYouTubeRoom(churchId, roomName)) {
      return json({ error: "invalid_youtube_session" }, 400);
    }

    const api = new LiveKitAPI({
      host: serverHost(livekitUrl),
      apiKey: livekitApiKey,
      secret: livekitApiSecret,
    });

    await api.ingress.deleteIngress(ingressId).catch(() => undefined);
    await api.room.deleteRoom(roomName).catch(() => undefined);

    return json({ stopped: true, roomName });
  }

  return json({ error: "unsupported_action" }, 400);
});
