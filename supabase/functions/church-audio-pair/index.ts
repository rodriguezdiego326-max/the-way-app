import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import {
  AccessToken,
  LiveKitAPI,
  TrackSource,
} from "npm:livekit-server-sdk@2.20.0";
import { corsHeaders, json } from "../church-youtube-live-source/response.ts";

interface Config {
  owner: string;
  codeHash: string;
  proofHash: string;
  expiresAt: number;
  paired: boolean;
  sourceLanguage: "en" | "es";
}
interface Session {
  roomName: string;
  sourceIdentity: string;
}
interface Row {
  config: Config | null;
  session: Session | null;
  revision: number;
  error_code: string | null;
}
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const errors = new Set([
  "source_changed",
  "operation_in_progress",
  "stop_before_editing",
  "pair_expired",
  "pair_invalid",
  "sender_not_authorized",
  "feed_not_ready",
  "stream_cleanup_failed",
  "translation_agent_failed",
  "livekit_not_configured",
]);
const digest = async (text: string) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
    ),
  )
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
const random = (bytes: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let release: (() => Promise<unknown>) | undefined;
  try {
    const token = (req.headers.get("Authorization") ?? "").replace(
      /^Bearer\s+/i,
      "",
    );
    if (!token) return json({ error: "unauthorized" }, 401);
    const user = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
          fetch: (input, init) =>
            fetch(input, { ...init, signal: AbortSignal.timeout(12000) }),
        },
        auth: { persistSession: false },
      },
    );
    const { data: auth, error: authError } = await user.auth.getUser(token);
    if (authError || !auth.user) return json({ error: "unauthorized" }, 401);
    const raw = await req.text();
    if (raw.length > 4000) return json({ error: "invalid_request" }, 400);
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw);
    } catch {
      return json({ error: "invalid_request" }, 400);
    }
    if (!body || typeof body !== "object")
      return json({ error: "invalid_request" }, 400);
    const churchId = String(body.churchId ?? "");
    const action = String(body.action ?? "");
    if (!uuid.test(churchId)) return json({ error: "church_required" }, 400);
    if (
      ![
        "get",
        "create",
        "pair",
        "publisher_token",
        "listener_token",
        "stop",
      ].includes(action)
    )
      return json({ error: "unsupported_action" }, 400);
    const { data: member, error: memberError } = await user
      .from("church_memberships")
      .select("verified_church_role")
      .eq("church_id", churchId)
      .eq("profile_id", auth.user.id)
      .maybeSingle();
    if (memberError || !member)
      return json({ error: "not_a_church_member" }, 403);
    const { data: appRole } = await user.rpc("get_app_admin_role");
    const canManage =
      ["PASTOR", "CHURCH_ADMIN", "ELDER", "LEADER"].includes(
        member.verified_church_role,
      ) || appRole === "APP_OWNER";
    if (!["get", "listener_token"].includes(action) && !canManage)
      return json({ error: "leadership_required" }, 403);
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        global: {
          fetch: (input, init) =>
            fetch(input, { ...init, signal: AbortSignal.timeout(12000) }),
        },
        auth: { persistSession: false },
      },
    );
    const rpc = async (
      verb: string,
      op: string | null = null,
      payload: unknown = {},
    ) => {
      const { data, error } = await admin.rpc("church_audio_pairing_service", {
        p_church_id: churchId,
        p_action: verb,
        p_operation_id: op,
        p_payload: payload,
      });
      if (error)
        throw new Error(
          errors.has(error.message) ? error.message : "pair_update_failed",
        );
      return data as Row | null;
    };
    const host = Deno.env.get("LIVEKIT_URL") ?? "";
    const key = Deno.env.get("LIVEKIT_API_KEY") ?? "";
    const secret = Deno.env.get("LIVEKIT_API_SECRET") ?? "";
    const api = () => {
      if (!host || !key || !secret) throw new Error("livekit_not_configured");
      return new LiveKitAPI({
        host: host.replace(/^wss:/, "https:"),
        apiKey: key,
        secret,
        requestTimeout: 8,
      });
    };
    const snapshot = async (row: Row | null) => {
      const config = row?.config;
      let canListen = false;
      let error = row?.error_code ?? null;
      const expired = !!config && config.expiresAt < Date.now();
      if (row?.session && !expired && !error) {
        try {
          const people = await api().room.listParticipants(
            row.session.roomName,
          );
          canListen = people.some(
            (p) =>
              p.identity === row.session?.sourceIdentity &&
              p.tracks.some((t) => t.type === 0 && !t.muted),
          );
        } catch {
          error = "feed_not_ready";
        }
      }
      return {
        revision: Number(row?.revision ?? 0),
        canManage,
        exists: !!config,
        paired: !!config?.paired,
        hasSession: !!row?.session,
        canListen,
        expiresAt: config?.expiresAt ?? null,
        sourceLanguage: config?.sourceLanguage ?? "en",
        error: expired ? "pair_expired" : error,
      };
    };
    let row = await rpc("get");
    if (action === "get") return json(await snapshot(row));
    if (action === "publisher_token" || action === "listener_token") {
      if (
        !row?.session ||
        !row.config?.paired ||
        row.config.expiresAt < Date.now()
      )
        throw new Error("pair_expired");
      const publish = action === "publisher_token";
      if (publish) {
        if (
          row.config.owner !== auth.user.id ||
          typeof body.proof !== "string" ||
          body.proof.length !== 64 ||
          (await digest(body.proof)) !== row.config.proofHash
        )
          throw new Error("sender_not_authorized");
      } else if (!(await snapshot(row)).canListen)
        throw new Error("feed_not_ready");
      if (row.error_code) throw new Error(row.error_code);
      // Never let a fresh publishing token recreate an expired room without its agent.
      if (publish) {
        try {
          await api().room.listParticipants(row.session.roomName);
        } catch {
          throw new Error("pair_expired");
        }
      }
      const access = new AccessToken(key, secret, {
        identity: publish
          ? row.session.sourceIdentity
          : `${auth.user.id}-${crypto.randomUUID()}`,
        ttl: publish ? "60s" : "10m",
      });
      access.addGrant({
        roomJoin: true,
        room: row.session.roomName,
        canPublish: publish,
        canPublishSources: publish ? [TrackSource.MICROPHONE] : [],
        canSubscribe: !publish,
        canPublishData: false,
      });
      return json({
        connection: {
          url: host.replace(/^https:/, "wss:"),
          token: await access.toJwt(),
          roomName: row.session.roomName,
          sourceIdentity: row.session.sourceIdentity,
        },
      });
    }
    if (!Number.isSafeInteger(body.revision) || Number(body.revision) < 0)
      throw new Error("source_changed");
    const op = crypto.randomUUID();
    row = await rpc("claim", op, { revision: body.revision });
    if (!row) throw new Error("source_changed");
    release = () => rpc("release", op);
    const write = async (patch: Partial<Row>, checkpoint = false) => {
      row = await rpc(checkpoint ? "checkpoint" : "write", op, {
        ...row,
        ...patch,
        state: patch.error_code ? "error" : "saved",
        updated_by: auth.user!.id,
      });
      if (!checkpoint) release = undefined;
    };
    const stop = async (session: Session) => {
      if (!session.roomName.startsWith(`church-pair-${churchId}-`))
        throw new Error("stream_cleanup_failed");
      try {
        await api().room.deleteRoom(session.roomName);
      } catch (e) {
        const error = e as { status?: number; code?: string };
        if (error.status !== 404 && error.code !== "not_found")
          throw new Error("stream_cleanup_failed");
      }
    };
    if (action === "stop") {
      if (row.session) await stop(row.session);
      await write({ config: null, session: null, error_code: null });
    } else if (action === "create") {
      if (row.session) throw new Error("stop_before_editing");
      const code = random(6).toUpperCase();
      const proof = random(32);
      const expiresAt = Date.now() + 10 * 60 * 1000;
      await write({
        config: {
          owner: auth.user.id,
          codeHash: await digest(code),
          proofHash: await digest(proof),
          expiresAt,
          paired: false,
          sourceLanguage: body.sourceLanguage === "es" ? "es" : "en",
        },
        session: null,
        error_code: null,
      });
      return json({
        ...(await snapshot(row)),
        code: code.match(/.{4}/g)!.join("-"),
        proof,
      });
    } else if (action === "pair") {
      if (row.session || row.config?.paired)
        throw new Error("stop_before_editing");
      const config = row.config;
      const code =
        typeof body.code === "string"
          ? body.code.replace(/[\s-]/g, "").toUpperCase()
          : "";
      if (!config || config.expiresAt < Date.now())
        throw new Error("pair_expired");
      if (
        !/^[A-F0-9]{12}$/.test(code) ||
        (await digest(code)) !== config.codeHash
      )
        throw new Error("pair_invalid");
      const suffix = crypto.randomUUID();
      const session = {
        roomName: `church-pair-${churchId}-${suffix}`,
        sourceIdentity: `church-pair-feed-${suffix}`,
      };
      // Save the room reference before network work so Stop can recover even if a request dies.
      await write(
        {
          session,
          config: {
            ...config,
            paired: true,
            codeHash: "",
            expiresAt: Date.now() + 4 * 60 * 60 * 1000,
          },
        },
        true,
      );
      try {
        await api().room.createRoom({
          name: session.roomName,
          emptyTimeout: 60,
          departureTimeout: 30,
        });
        await api().agentDispatch.createDispatch(
          session.roomName,
          "solapath-sermon-translator",
          {
            metadata: JSON.stringify({
              churchId,
              sourceLanguage: config.sourceLanguage,
              targetLanguage: config.sourceLanguage === "en" ? "es" : "en",
              sourceParticipantIdentity: session.sourceIdentity,
              sourceKind: "paired",
            }),
          },
        );
        await write({ error_code: null });
      } catch {
        try {
          await stop(session);
          await write({
            config: null,
            session: null,
            error_code: "translation_agent_failed",
          });
        } catch {
          await write({ error_code: "stream_cleanup_failed" });
        }
      }
    }
    return json(await snapshot(row));
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    const code = errors.has(message) ? message : "pair_update_failed";
    return json({ error: code }, code === "sender_not_authorized" ? 403 : 409);
  } finally {
    if (release) await release().catch(() => undefined);
  }
});
