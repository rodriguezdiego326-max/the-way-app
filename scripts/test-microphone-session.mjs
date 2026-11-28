import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { webcrypto } from 'node:crypto';

test('microphone session accepts continuous captions without VAD while retaining interpreter VAD', async () => {
  const source = readFileSync(new URL('../supabase/functions/live-sermon-translation-session/index.ts', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '');
  let handler;
  const sessions = [];
  const context = {
    Request, Response, TextEncoder, AbortSignal, crypto: webcrypto, console,
    Deno: { env: { get: () => 'test-config' }, serve: fn => { handler = fn; } },
    createClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: 'test-user' } }, error: null }) } }),
    registerTranslationMeasurement: async () => 'test-measurement',
    fetch: async (_url, options) => {
      const { session } = JSON.parse(options.body); sessions.push(session);
      if (session.type === 'transcription' && session.audio.input.turn_detection != null) {
        return Response.json({error: 'Turn detection is not supported for this transcription model.'}, {status: 400});
      }
      return Response.json({value: 'test-client-secret-value'});
    },
  };
  vm.runInNewContext(ts.transpileModule(source, {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None}}).outputText, context);
  const response = await handler(new Request('https://test.invalid', {method: 'POST', headers: {Authorization: 'Bearer test-token', 'Content-Type': 'application/json'}, body: JSON.stringify({sourceLanguage: 'en', targetLanguage: 'es'})}));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.caption_value && body.translation_value);
  assert.equal(body.measurementId, 'test-measurement');
  assert.equal(sessions.find(s => s.type === 'transcription').audio.input.turn_detection, null);
  assert.equal(sessions.find(s => s.type === 'realtime').audio.input.turn_detection.type, 'server_vad');
});
