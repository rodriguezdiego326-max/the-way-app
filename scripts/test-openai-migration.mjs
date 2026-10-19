import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { test } from 'node:test';

const source = readFileSync(new URL('../supabase/functions/the-way-intelligence/index.ts', import.meta.url), 'utf8');
const javascript = stripTypeScriptTypes(source.replace(/^import "jsr:[^\n]+\n/, ''));

function load(env = {}, respond = () => ({ choices: [{ message: { content: JSON.stringify({ answer_summary: 'Grace is a gift from God.' }) } }] })) {
  const requests = [];
  let handler;
  const context = vm.createContext({
    Deno: { env: { get: key => env[key] }, serve: fn => { handler = fn; } },
    fetch: async (url, options) => {
      const body = JSON.parse(options.body);
      requests.push({ url, body });
      return new Response(JSON.stringify(respond(body)), { status: 200 });
    },
    crypto, Request, Response, URL, AbortController, setTimeout, clearTimeout, console,
  });
  vm.runInContext(javascript, context);
  const api = vm.runInContext('({ getProviderConfig, createOpenAIProvider, checkProviderHealth, buildUserContext, SYSTEM_RULES, VERSIONS })', context);
  return { ...api, handler, requests };
}

test('default and existing GPT-4o mini settings migrate consistently', () => {
  for (const value of [undefined, '', 'gpt-4o-mini', 'gpt-4o-mini-2024-07-18']) {
    const app = load({ OPENAI_API_KEY: 'test-only', OPENAI_MODEL: value });
    assert.equal(app.getProviderConfig().model, 'gpt-6-luna');
    assert.equal(app.VERSIONS.model, 'gpt-6-luna');
  }
});

test('explicit alternative model settings remain intact', () => {
  const app = load({ OPENAI_API_KEY: 'test-only', OPENAI_MODEL: 'gpt-4.1' });
  assert.equal(app.getProviderConfig().model, 'gpt-4.1');
  assert.equal(app.VERSIONS.model, 'gpt-4.1');
});

test('answer requests preserve JSON, temperature and output budget without hidden reasoning', async () => {
  const app = load({ OPENAI_API_KEY: 'test-only', AI_MAX_OUTPUT_TOKENS: '1200', AI_TEMPERATURE: '0.2' });
  const request = { question: 'What is grace?', theological_depth: 'simple' };
  const response = await app.createOpenAIProvider(app.getProviderConfig()).generateStructured(app.SYSTEM_RULES, app.buildUserContext(request), request, null);
  const { body, url } = app.requests[0];
  assert.equal(url, 'https://api.openai.com/v1/chat/completions');
  assert.equal(body.model, 'gpt-6-luna');
  assert.equal(body.reasoning_effort, 'none');
  assert.equal(body.max_completion_tokens, 1200);
  assert.equal(body.temperature, 0.2);
  assert.equal(body.response_format.type, 'json_object');
  assert.equal('max_tokens' in body, false);
  assert.equal(response.model_version, 'gpt-6-luna');
  assert.equal(response.validation_passed, true);
  assert.equal(response.is_demo, false);
  assert.equal(response.personal_context_items.length, 0);
});

test('live health check uses the same compatible model options', async () => {
  const app = load({ OPENAI_API_KEY: 'test-only' });
  const response = await app.handler(new Request('https://example.test/the-way-intelligence/health'));
  const health = await response.json();
  assert.equal(health.connected, true);
  assert.equal(health.model, 'gpt-6-luna');
  assert.equal(health.versions.model, health.model);
  assert.equal(app.requests[0].body.reasoning_effort, 'none');
  assert.equal(app.requests[0].body.max_completion_tokens, 5);
  assert.equal('max_tokens' in app.requests[0].body, false);
});

test('missing API credentials remain development-only', async () => {
  const app = load();
  const result = await app.checkProviderHealth();
  assert.equal(result.configured, false);
  assert.equal(result.connected, false);
  assert.equal(app.requests.length, 0);
});

test('unauthenticated Ask requests still fail before any provider call', async () => {
  const app = load({ OPENAI_API_KEY: 'test-only' });
  const response = await app.handler(new Request('https://example.test/the-way-intelligence', { method: 'POST', body: '{}' }));
  assert.equal(response.status, 401);
  assert.equal(app.requests.length, 0);
});
