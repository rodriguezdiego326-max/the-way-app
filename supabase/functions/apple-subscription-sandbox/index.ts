import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { Environment, SignedDataVerifier } from 'npm:@apple/app-store-server-library@3.1.0';
import { Buffer } from 'node:buffer';
import { appleRootG3 } from './appleRoot.ts';
import { describeVerifiedSample } from './policy.ts';

const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
const verifier = new SignedDataVerifier([Buffer.from(appleRootG3, 'base64')], true, Environment.SANDBOX, 'com.rfgforge.solapath');

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const authorization = req.headers.get('authorization') || '';
  if (!/^Bearer\s+\S+$/i.test(authorization)) return json({ error: 'unauthorized' }, 401);
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: authError } = await client.auth.getUser(authorization.replace(/^Bearer\s+/i, ''));
  if (authError || !userData.user) return json({ error: 'unauthorized' }, 401);
  const { data: role, error: roleError } = await client.rpc('get_app_admin_role');
  if (roleError || role !== 'APP_OWNER') return json({ error: 'app_owner_required' }, 403);
  // Bound the streamed body even if Content-Length is absent or untruthful.
  if (!req.body) return json({ error: 'invalid_request' }, 400);
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 32768) { await reader.cancel(); return json({ error: 'request_too_large' }, 413); }
      chunks.push(value);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (typeof body.signedTransaction !== 'string' || body.signedTransaction.length > 30000) return json({ error: 'invalid_request' }, 400);
    // Validates Apple certificate chain, OCSP, signature, bundle and environment.
    const tx = await verifier.verifyAndDecodeTransaction(body.signedTransaction);
    return json(describeVerifiedSample(tx as unknown as Record<string, unknown>, userData.user.id));
  } catch {
    // Never log signed transactions, account tokens, or certificate payloads.
    return json({ error: 'verification_failed' }, 400);
  } finally { reader.releaseLock(); }
});
