import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Cleanup-Secret",
};

const BUCKET = "sermon-transcription-temp";
const REMOVE_BATCH_SIZE = 100;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) {
      console.error("cleanup-sermon-transcription-temp: missing server configuration");
      return json({ error: "not_configured" }, 500);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const presented = req.headers.get("x-cleanup-secret") ?? "";
    const { data: expected, error: secretError } = await admin.rpc("sermon_transcription_cleanup_secret");
    if (secretError || typeof expected !== "string" || expected.length < 32) {
      console.error("cleanup-sermon-transcription-temp: secret lookup failed");
      return json({ error: "server_error" }, 500);
    }
    if (presented !== expected) return json({ error: "unauthorized" }, 401);

    const { data: objectRows, error: objectsError } = await admin.rpc("sermon_transcription_stale_objects");
    if (objectsError) {
      console.error("cleanup-sermon-transcription-temp: object lookup failed", objectsError.message);
      return json({ error: "server_error" }, 500);
    }
    const paths = (objectRows ?? []).map((row: { object_name: string }) => row.object_name);

    for (let start = 0; start < paths.length; start += REMOVE_BATCH_SIZE) {
      const batch = paths.slice(start, start + REMOVE_BATCH_SIZE);
      const { error: removeError } = await admin.storage.from(BUCKET).remove(batch);
      if (removeError) {
        console.error("cleanup-sermon-transcription-temp: object removal failed", removeError.message);
        return json({ error: "server_error" }, 500);
      }
    }

    const { data: jobRows, error: jobsError } = await admin.rpc("sermon_transcription_stale_jobs");
    if (jobsError) {
      console.error("cleanup-sermon-transcription-temp: job lookup failed", jobsError.message);
      return json({ error: "server_error" }, 500);
    }
    let jobsRemoved = 0;
    for (const job of (jobRows ?? []) as { user_id: string; recording_id: string }[]) {
      const { error: deleteError } = await admin
        .from("sermon_transcripts")
        .delete()
        .eq("user_id", job.user_id)
        .eq("recording_id", job.recording_id);
      if (deleteError) {
        console.error("cleanup-sermon-transcription-temp: job removal failed", deleteError.message);
        return json({ error: "server_error" }, 500);
      }
      jobsRemoved += 1;
    }

    return json({ objectsRemoved: paths.length, jobsRemoved });
  } catch (cause) {
    console.error("cleanup-sermon-transcription-temp: unhandled error", cause);
    return json({ error: "server_error" }, 500);
  }
});
