import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { AccessToken, IngressInput, LiveKitAPI } from "npm:livekit-server-sdk@2.20.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LEADERSHIP_ROLES = new Set(["PASTOR", "CHURCH_ADMIN", "ELDER", "LEADER"]);
const TRANSLATION_AGENT_NAME = "solapath-sermon-translator";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function serverHost(url: string) {
  return url.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:");
}

function clientHost(url: string) {
  return url.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:");
}

async function ensureTranslationAgent(
  api: LiveKitAPI,
  roomName: string,
  churchId: string,
  sourceLanguage: "en" | "es",
  targetLanguage: "en" | "es",
) {
  try {
    const existing = await api.agentDispatch.listDispatch(roomName);
    const active = existing.find((item) => item.agentName === TRANSLATION_AGENT_NAME);
    if (active) return { status: "ready", dispatchId: active.id };

    const dispatch = await api.agentDispatch.createDispatch(
      roomName,
      TRANSLATION_AGENT_NAME,
      {
        metadata: JSON.stringify({
          churchId,
          sourceLanguage,
          targetLanguage,
          sourceParticipantIdentity: `church-feed-${churchId}`,
        }),
      },
    );
    return { status: "ready", dispatchId: dispatch.id };
  } catch (cause) {
    console.warn("church-live-feed-admin: translation agent dispatch pending", cause);
    return { status: "pending", dispatchId: null };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !anonKey || !serviceRole) return json({ error: "not_configured" }, 500);

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const serviceClient = createClient(supabaseUrl, serviceRole, {
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

  if (membershipError || !membership) return json({ error: "not_a_church_member" }, 403);

  const verifiedRole = (membership as { verified_church_role?: string | null }).verified_church_role ?? null;
  const isLeadership = verifiedRole ? LEADERSHIP_ROLES.has(verifiedRole) : false;

  const livekitUrl = Deno.env.get("LIVEKIT_URL") ?? "";
  const livekitApiKey = Deno.env.get("LIVEKIT_API_KEY") ?? "";
  const livekitApiSecret = Deno.env.get("LIVEKIT_API_SECRET") ?? "";

  if (action === "status") {
    const { data: settings, error } = await userClient
      .from("church_live_translation_settings")
      .select("*")
      .eq("church_id", churchId)
      .maybeSingle();
    if (error) return json({ error: "status_failed" }, 500);
    return json({ settings, isLeadership, verifiedRole });
  }

  if (action === "provision") {
    if (!isLeadership) return json({ error: "leadership_required" }, 403);

    const inputType = body.inputType === "whip" ? "whip" : "rtmp";
    const sourceLanguage = body.sourceLanguage === "es" ? "es" : "en";
    const targetLanguage = body.targetLanguage === "en" ? "en" : "es";
    if (sourceLanguage === targetLanguage) return json({ error: "languages_must_differ" }, 400);

    const { data: existingSettings } = await userClient
      .from("church_live_translation_settings")
      .select("church_id")
      .eq("church_id", churchId)
      .maybeSingle();

    if (existingSettings) {
      const { error: updateError } = await userClient
        .from("church_live_translation_settings")
        .update({
          input_type: inputType,
          source_language: sourceLanguage,
          target_language: targetLanguage,
          provider_status: "provisioning",
          updated_by_profile_id: userData.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("church_id", churchId);
      if (updateError) return json({ error: "settings_update_failed" }, 500);
    } else {
      const { error: insertError } = await userClient
        .from("church_live_translation_settings")
        .insert({
          church_id: churchId,
          enabled: false,
          input_type: inputType,
          source_language: sourceLanguage,
          target_language: targetLanguage,
          provider_status: "provisioning",
          created_by_profile_id: userData.user.id,
          updated_by_profile_id: userData.user.id,
        });
      if (insertError) return json({ error: "settings_create_failed" }, 500);
    }

    if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
      await userClient
        .from("church_live_translation_settings")
        .update({
          provider_status: "not_connected",
          updated_by_profile_id: userData.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("church_id", churchId);
      return json({ error: "livekit_not_configured" }, 503);
    }

    const api = new LiveKitAPI({
      host: serverHost(livekitUrl),
      apiKey: livekitApiKey,
      secret: livekitApiSecret,
    });

    const { data: savedConfig } = await serviceClient.rpc(
      "get_church_live_provider_config_for_service",
      { p_church_id: churchId },
    );
    const prior = Array.isArray(savedConfig) ? savedConfig[0] : null;
    if (prior?.ingress_url && prior?.ingress_id) {
      const agent = await ensureTranslationAgent(
        api,
        prior.room_name,
        churchId,
        sourceLanguage,
        targetLanguage,
      );

      await userClient
        .from("church_live_translation_settings")
        .update({
          enabled: true,
          provider_status: "ready",
          updated_by_profile_id: userData.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("church_id", churchId);

      return json({
        provider: "livekit",
        inputType: prior.input_type,
        ingressId: prior.ingress_id,
        serverUrl: prior.ingress_url,
        streamKey: prior.stream_key,
        roomName: prior.room_name,
        reused: true,
        agentStatus: agent.status,
      });
    }

    const roomName = `church-${churchId}`;
    const ingress = await api.ingress.createIngress(
      inputType === "whip" ? IngressInput.WHIP_INPUT : IngressInput.RTMP_INPUT,
      {
        name: "SOLAPATH Church Sermon Feed",
        roomName,
        participantIdentity: `church-feed-${churchId}`,
        participantName: "Church Sermon Feed",
        participantMetadata: JSON.stringify({
          role: "sermon_source",
          churchId,
        }),
        enableTranscoding: inputType === "rtmp",
      },
    );

    if (!ingress.ingressId || !ingress.url) {
      await userClient
        .from("church_live_translation_settings")
        .update({
          provider_status: "error",
          updated_by_profile_id: userData.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("church_id", churchId);
      return json({ error: "ingress_provision_failed" }, 502);
    }

    const { error: saveError } = await serviceClient.rpc(
      "save_church_live_provider_config_for_service",
      {
        p_church_id: churchId,
        p_room_name: roomName,
        p_ingress_id: ingress.ingressId,
        p_ingress_url: ingress.url,
        p_stream_key: ingress.streamKey ?? null,
        p_input_type: inputType,
      },
    );
    if (saveError) return json({ error: "provider_config_save_failed" }, 500);

    const agent = await ensureTranslationAgent(
      api,
      roomName,
      churchId,
      sourceLanguage,
      targetLanguage,
    );

    await userClient
      .from("church_live_translation_settings")
      .update({
        enabled: true,
        provider_status: "ready",
        updated_by_profile_id: userData.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("church_id", churchId);

    return json({
      provider: "livekit",
      inputType,
      ingressId: ingress.ingressId,
      serverUrl: ingress.url,
      streamKey: ingress.streamKey ?? null,
      roomName,
      reused: false,
      agentStatus: agent.status,
    });
  }

  if (action === "credentials") {
    if (!isLeadership) return json({ error: "leadership_required" }, 403);

    const { data, error } = await serviceClient.rpc(
      "get_church_live_provider_config_for_service",
      { p_church_id: churchId },
    );
    if (error) return json({ error: "credentials_failed" }, 500);
    const config = Array.isArray(data) ? data[0] : null;
    if (!config) return json({ error: "not_provisioned" }, 404);

    return json({
      provider: "livekit",
      inputType: config.input_type,
      ingressId: config.ingress_id,
      serverUrl: config.ingress_url,
      streamKey: config.stream_key,
      roomName: config.room_name,
    });
  }

  if (action === "listener_token") {
    if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
      return json({ error: "livekit_not_configured" }, 503);
    }

    const { data: settings, error: settingsError } = await userClient
      .from("church_live_translation_settings")
      .select("enabled, source_language, target_language")
      .eq("church_id", churchId)
      .maybeSingle();
    if (settingsError) return json({ error: "listener_settings_failed" }, 500);
    if (!settings?.enabled) return json({ error: "feed_not_ready" }, 409);

    const { data, error } = await serviceClient.rpc(
      "get_church_live_provider_config_for_service",
      { p_church_id: churchId },
    );
    if (error) return json({ error: "listener_config_failed" }, 500);
    const config = Array.isArray(data) ? data[0] : null;
    if (!config?.room_name) return json({ error: "not_provisioned" }, 404);

    const api = new LiveKitAPI({
      host: serverHost(livekitUrl),
      apiKey: livekitApiKey,
      secret: livekitApiSecret,
    });
    const sourceLanguage = settings.source_language === "es" ? "es" : "en";
    const targetLanguage = settings.target_language === "en" ? "en" : "es";
    const agent = await ensureTranslationAgent(
      api,
      config.room_name,
      churchId,
      sourceLanguage,
      targetLanguage,
    );

    const access = new AccessToken(livekitApiKey, livekitApiSecret, {
      identity: userData.user.id,
      ttl: "2h",
    });
    access.addGrant({
      roomJoin: true,
      room: config.room_name,
      canSubscribe: true,
      canPublish: false,
      canPublishData: false,
    });

    return json({
      url: clientHost(livekitUrl),
      token: await access.toJwt(),
      roomName: config.room_name,
      agentStatus: agent.status,
    });
  }

  return json({ error: "unsupported_action" }, 400);
});
