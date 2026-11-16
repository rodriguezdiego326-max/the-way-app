import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendApnsAlert, type ApnsEnvironment } from "../_shared/apns.ts";
import { buildActivityPushBody, PUSH_TITLE } from "../_shared/pushCopy.ts";

// ============================================================
// SOLAPATH push-activity. Delivers a standard APNs alert for an
// existing Activity row. Activity stays the source of truth: the
// database re-checks push preference and Family/Circle membership
// before returning any device. The payload carries only the Activity
// ID and metadata-only copy.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ATTEMPTS = 2;
const REQUIRED_SECRETS = [
  "PUSH_WEBHOOK_SECRET",
  "APNS_KEY_ID",
  "APNS_TEAM_ID",
  "APNS_PRIVATE_KEY",
  "APNS_TOPIC",
] as const;

function json(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function isApnsEnvironment(value: unknown): value is ApnsEnvironment {
  return value === "production" || value === "sandbox";
}

function missingSecrets(): string[] {
  return REQUIRED_SECRETS.filter((name) => !(Deno.env.get(name) ?? "").trim());
}

type ClaimedDevice = { delivery_id: string; token: string; environment: string };
type ClaimResult = {
  status: "ready" | "suppressed";
  activity_id?: string;
  event_type?: string;
  actor_label?: unknown;
  scope_label?: unknown;
  devices?: ClaimedDevice[];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const expectedSecret = Deno.env.get("PUSH_WEBHOOK_SECRET") ?? "";
  const providedSecret = req.headers.get("x-push-secret") ?? "";
  if (!expectedSecret || !constantTimeEqual(providedSecret, expectedSecret)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const missing = missingSecrets();
  if (missing.length > 0) {
    console.error("push-activity configuration incomplete", missing.join(","));
    return json({ ok: false, error: "not_configured" }, 503);
  }

  let activityId: unknown;
  try {
    activityId = (await req.json())?.activity_id;
  } catch {
    return json({ ok: false, error: "invalid_body" }, 400);
  }
  if (typeof activityId !== "string" || !UUID_PATTERN.test(activityId)) {
    return json({ ok: false, error: "invalid_body" }, 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: claimData, error: claimError } = await admin.rpc("push_claim_activity", {
    p_activity_id: activityId,
  });
  if (claimError) {
    console.error("push_claim_activity failed", claimError.code);
    return json({ ok: false, error: "claim_failed" }, 500);
  }
  if (!claimData) return json({ ok: true, status: "not_found", sent: 0 }, 200);

  const claim = claimData as ClaimResult;
  if (claim.status !== "ready") return json({ ok: true, status: "suppressed", sent: 0 }, 200);

  const devices = claim.devices ?? [];
  if (devices.length === 0) return json({ ok: true, status: "dispatched", attempted: 0, sent: 0 }, 200);

  const payload = {
    aps: {
      alert: {
        title: PUSH_TITLE,
        body: buildActivityPushBody({
          eventType: claim.event_type ?? "",
          actorLabel: claim.actor_label,
          scopeLabel: claim.scope_label,
        }),
      },
      sound: "default",
    },
    solapath_type: "activity",
    activity_id: claim.activity_id,
    schema_version: 1,
  };

  let sent = 0;
  for (const device of devices) {
    if (!isApnsEnvironment(device.environment)) {
      await admin.rpc("push_record_result", {
        p_delivery_id: device.delivery_id,
        p_status: "failed",
        p_apns_id: null,
        p_error_code: "bad_environment",
        p_invalidate_device: false,
      });
      continue;
    }

    const apnsId = crypto.randomUUID();
    let outcome = await sendApnsAlert(device.environment, device.token, apnsId, payload);
    for (let attempt = 1; attempt < MAX_ATTEMPTS && outcome.kind === "failed" && outcome.retryable; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      outcome = await sendApnsAlert(device.environment, device.token, apnsId, payload);
    }

    if (outcome.kind === "sent") {
      sent++;
      await admin.rpc("push_record_result", {
        p_delivery_id: device.delivery_id,
        p_status: "sent",
        p_apns_id: apnsId,
        p_error_code: null,
        p_invalidate_device: false,
      });
    } else if (outcome.kind === "invalid_token") {
      console.warn("apns invalid token", outcome.code);
      await admin.rpc("push_record_result", {
        p_delivery_id: device.delivery_id,
        p_status: "invalid_token",
        p_apns_id: null,
        p_error_code: outcome.code,
        p_invalidate_device: true,
      });
    } else {
      console.warn("apns send failed", outcome.code);
      await admin.rpc("push_record_result", {
        p_delivery_id: device.delivery_id,
        p_status: "failed",
        p_apns_id: null,
        p_error_code: outcome.code,
        p_invalidate_device: false,
      });
    }
  }

  return json({ ok: true, status: "dispatched", attempted: devices.length, sent }, 200);
});
