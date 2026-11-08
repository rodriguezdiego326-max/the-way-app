import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BUCKET = "sermon-transcription-temp";
const MODEL = "gpt-transcribe";
const MAX_PART_BYTES = 6_000_000;
const MAX_PARTS = 32;
const MAX_TAIL_CHARS = 300;
const OPENAI_TIMEOUT_MS = 170_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface PartRequest {
  recordingId: string;
  jobId: string;
  partIndex: number;
  partCount: number;
  storagePath: string;
  previousTail: string;
}

function parseRequest(raw: unknown, userId: string): PartRequest | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  const { recordingId, jobId, partIndex, partCount, storagePath } = body;
  const previousTail = typeof body.previousTail === "string" ? body.previousTail : "";

  if (typeof recordingId !== "string" || recordingId.length < 1 || recordingId.length > 100) return null;
  if (typeof jobId !== "string" || !UUID_PATTERN.test(jobId)) return null;
  if (!Number.isInteger(partCount) || (partCount as number) < 1 || (partCount as number) > MAX_PARTS) return null;
  if (!Number.isInteger(partIndex) || (partIndex as number) < 0 || (partIndex as number) >= (partCount as number)) return null;
  if (storagePath !== `${userId}/${jobId}/part-${partIndex}.m4a`) return null;
  if (previousTail.length > MAX_TAIL_CHARS) return null;

  return {
    recordingId,
    jobId,
    partIndex: partIndex as number,
    partCount: partCount as number,
    storagePath,
    previousTail,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
    if (!supabaseUrl || !anonKey || !serviceKey || !openaiKey) {
      console.error("transcribe-sermon-part: missing server configuration");
      return json({ error: "not_configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "unauthorized" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user) return json({ error: "unauthorized" }, 401);

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return json({ error: "invalid_request" }, 400);
    }
    const input = parseRequest(raw, user.id);
    if (!input) return json({ error: "invalid_request" }, 400);

    const { data: transcript, error: transcriptError } = await userClient
      .from("sermon_transcripts")
      .select("status, current_job_id, part_count")
      .eq("recording_id", input.recordingId)
      .maybeSingle();
    if (transcriptError) {
      console.error("transcribe-sermon-part: transcript lookup failed", transcriptError.message);
      return json({ error: "server_error" }, 500);
    }
    if (
      !transcript ||
      transcript.status !== "processing" ||
      transcript.current_job_id !== input.jobId ||
      transcript.part_count !== input.partCount
    ) {
      return json({ error: "job_not_active" }, 409);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: existing, error: existingError } = await userClient
      .from("sermon_transcript_parts")
      .select("text")
      .eq("job_id", input.jobId)
      .eq("part_index", input.partIndex)
      .maybeSingle();
    if (existingError) {
      console.error("transcribe-sermon-part: part lookup failed", existingError.message);
      return json({ error: "server_error" }, 500);
    }
    if (existing) {
      await admin.storage.from(BUCKET).remove([input.storagePath]);
      return json({ partIndex: input.partIndex, text: existing.text, reused: true });
    }

    const { data: audio, error: downloadError } = await admin.storage.from(BUCKET).download(input.storagePath);
    if (downloadError || !audio) {
      return json({ error: "audio_missing" }, 404);
    }
    if (audio.size === 0 || audio.size > MAX_PART_BYTES) {
      await admin.storage.from(BUCKET).remove([input.storagePath]);
      return json({ error: "part_too_large" }, 413);
    }

    const form = new FormData();
    form.append("file", audio, `part-${input.partIndex}.m4a`);
    form.append("model", MODEL);
    form.append("response_format", "json");
    if (input.previousTail) form.append("prompt", input.previousTail);

    let openaiResponse: Response;
    try {
      openaiResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${openaiKey}` },
        body: form,
        signal: AbortSignal.timeout(OPENAI_TIMEOUT_MS),
      });
    } catch (cause) {
      console.error("transcribe-sermon-part: provider request failed", cause);
      return json({ error: "provider_unavailable" }, 502);
    }
    if (!openaiResponse.ok) {
      console.error("transcribe-sermon-part: provider status", openaiResponse.status);
      return json({ error: "provider_error" }, 502);
    }

    const payload = await openaiResponse.json().catch(() => null);
    const text = typeof payload?.text === "string" ? payload.text.trim() : null;
    if (text === null) {
      console.error("transcribe-sermon-part: provider returned no text");
      return json({ error: "provider_error" }, 502);
    }

    const { error: saveError } = await userClient.from("sermon_transcript_parts").upsert(
      {
        user_id: user.id,
        recording_id: input.recordingId,
        job_id: input.jobId,
        part_index: input.partIndex,
        text,
      },
      { onConflict: "user_id,job_id,part_index", ignoreDuplicates: true },
    );
    if (saveError) {
      console.error("transcribe-sermon-part: part save failed", saveError.message);
      return json({ error: "server_error" }, 500);
    }

    const { error: removeError } = await admin.storage.from(BUCKET).remove([input.storagePath]);
    if (removeError) console.error("transcribe-sermon-part: temp audio cleanup failed", removeError.message);

    return json({ partIndex: input.partIndex, text, reused: false });
  } catch (cause) {
    console.error("transcribe-sermon-part: unhandled error", cause);
    return json({ error: "server_error" }, 500);
  }
});
