import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// ============================================================
// SOLAPATH Delete Account Edge Function
// Identity comes only from the verified bearer JWT. The service
// role key stays inside this function and is never returned.
// Order: transactional app-data deletion, then permanent Auth user deletion.
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function readAppVersion(req: Request): Promise<string> {
  try {
    const body = await req.json();
    return typeof body?.appVersion === "string" ? body.appVersion.slice(0, 32) : "unknown";
  } catch {
    return "unknown";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ ok: false, error: "unauthorized" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  try {
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    const userId = userData?.user?.id;
    if (userError || !userId) return json({ ok: false, error: "unauthorized" }, 401);

    const appVersion = await readAppVersion(req);

    const { error: dataError } = await admin.rpc("delete_account_data", {
      p_user_id: userId,
      p_app_version: appVersion,
    });
    if (dataError) {
      console.error("delete_account_data failed", dataError.code);
      return json({ ok: false, error: "deletion_failed", step: "data" }, 500);
    }

    const { error: authError } = await admin.auth.admin.deleteUser(userId);
    if (authError) {
      console.error("auth user deletion failed", authError.status);
      return json({ ok: false, error: "deletion_failed", step: "auth" }, 500);
    }

    return json({ ok: true }, 200);
  } catch (err) {
    console.error("delete-account unexpected error", err instanceof Error ? err.name : "unknown");
    return json({ ok: false, error: "deletion_failed", step: "unknown" }, 500);
  }
});
