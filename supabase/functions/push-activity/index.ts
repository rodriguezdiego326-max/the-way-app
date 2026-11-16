import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendApnsAlert, type ApnsEnvironment } from "../_shared/apns.ts";

// ============================================================
// SOLAPATH push-activity. Delivers a standard APNs alert for an
// existing Activity row. Activity stays the source of truth: the
// row is loaded here, and the push preference and Family/Circle
// membership are re-checked in the database before any send.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ATTEMPTS = 2;

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

type ClaimedDevice = { delivery_id: string; token: string; environment: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const expectedSecret = Deno.env.get("PUSH_WEBHOOK_SECRET") ?? "";
  const providedSecret = req.headers.get("x-push-secret") ?? "";
  if (!expectedSecret || !constantTimeEqual(providedSecret, expectedSecret)) {
    return json({ ok: false, error: "unauthorized" }, 401);
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

  const { data: claim, error: claimError } = await admin.rpc("push_claim_activity", {
    p_activity_id: activityId,
  });
  if (claimError) {
    console.error("push_claim_activity failed", claimError.code);
    return json({ ok: false, error: "claim_failed" }, 500);
  }
  if (!claim) return json({ ok: true, status: "not_found", sent: 0 }, 200);
  if (claim.status === "suppressed") return json({ ok: true, status: "suppressed", sent: 0 }, 200);

  const devices = (claim.devices ?? []) as ClaimedDevice[];
  const payload = {
    aps: {
      alert: { title: "SOLAPATH", body: "You have new activity." },
      sound: "default",
    },
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
