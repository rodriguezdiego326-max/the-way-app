import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function safetyIdentifier(userId: string) {
  const bytes = new TextEncoder().encode(userId);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
    if (!supabaseUrl || !anonKey || !openaiKey) {
      console.error("live-sermon-translation-session: missing server configuration");
      return json({ error: "not_configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "unauthorized" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await userClient.auth.getUser(token);
    if (error || !data.user) return json({ error: "unauthorized" }, 401);

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return json({ error: "invalid_request" }, 400);
    }

    const targetLanguage =
      raw && typeof raw === "object" && "targetLanguage" in raw
        ? (raw as { targetLanguage?: unknown }).targetLanguage
        : null;

    if (targetLanguage !== "en" && targetLanguage !== "es") {
      return json({ error: "unsupported_language" }, 400);
    }

    const response = await fetch(
      "https://api.openai.com/v1/realtime/translations/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Safety-Identifier": await safetyIdentifier(data.user.id),
        },
        body: JSON.stringify({
          session: {
            model: "gpt-realtime-translate",
            audio: { output: { language: targetLanguage } },
          },
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      console.error("live-sermon-translation-session: provider status", response.status);
      return json({ error: "provider_error" }, 502);
    }

    const value =
      payload && typeof payload === "object" && "value" in payload
        ? (payload as { value?: unknown }).value
        : null;

    if (typeof value !== "string" || value.length < 10) {
      console.error("live-sermon-translation-session: provider returned no client secret");
      return json({ error: "provider_error" }, 502);
    }

    return json({
      value,
      expires_at:
        payload && typeof payload === "object" && "expires_at" in payload
          ? (payload as { expires_at?: unknown }).expires_at
          : null,
    });
  } catch (cause) {
    console.error("live-sermon-translation-session: unhandled error", cause);
    return json({ error: "server_error" }, 500);
  }
});
