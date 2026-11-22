export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
  'Access-Control-Expose-Headers': 'x-solapath-error',
};

export function json(body: unknown, status = 200) {
  const headers: Record<string, string> = { ...corsHeaders, 'Content-Type': 'application/json' };
  const code = (body as { error?: unknown } | null)?.error;
  if (status >= 400 && typeof code === 'string' && /^[a-z0-9_]+$/.test(code)) {
    headers['x-solapath-error'] = code;
  }
  return new Response(JSON.stringify(body), { status, headers });
}
