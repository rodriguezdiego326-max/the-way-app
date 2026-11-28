import { strict as assert } from 'node:assert';
import { Buffer } from 'node:buffer';
import { X509Certificate, createHash } from 'node:crypto';
import { Environment, SignedDataVerifier } from '@apple/app-store-server-library';
import test from 'node:test';
import fs from 'node:fs';
import ts from 'typescript';
async function loadTS(name) {
  const source = fs.readFileSync(new URL('../supabase/functions/apple-subscription-sandbox/' + name, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
}
const { appleRootG3 } = await loadTS('appleRoot.ts');
const { describeVerifiedSample } = await loadTS('policy.ts');

const owner = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const now = 1800000000000;
const sample = {
  environment: 'Sandbox', bundleId: 'com.rfgforge.solapath', appAccountToken: owner,
  productId: 'com.rfgforge.solapath.plus.monthly', type: 'Auto-Renewable Subscription',
  inAppOwnershipType: 'PURCHASED', transactionId: '200000123456', expiresDate: now + 3600000, signedDate: now,
};
test('verified samples never grant access, even while active', () => {
  const result = describeVerifiedSample(sample, owner, now);
  assert.equal(result.state, 'active_sample'); assert.equal(result.grantsAccess, false);
  assert.equal(result.environment, 'Sandbox');
});
test('account binding, bundle, environment, product and ownership cannot be bypassed', () => {
  for (const change of [
    { appAccountToken: 'bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee' }, { appAccountToken: null },
    { environment: 'Production' }, { bundleId: 'other.app' },
    { productId: 'unapproved.product' }, { type: 'Consumable' },
    { inAppOwnershipType: 'FAMILY_SHARED' }, { transactionId: '../other' },
    { expiresDate: NaN }, { signedDate: now + 60001 },
  ]) assert.throws(() => describeVerifiedSample({ ...sample, ...change }, owner, now));
});
test('expired, revoked and superseded samples are distinct and never grants', () => {
  for (const [change, state] of [
    [{ expiresDate: now - 1 }, 'expired'], [{ revocationDate: now - 1 }, 'revoked'], [{ isUpgraded: true }, 'superseded'],
  ]) {
    const result = describeVerifiedSample({ ...sample, ...change }, owner, now);
    assert.equal(result.state, state); assert.equal(result.grantsAccess, false);
  }
});
test('bundled trust anchor matches Apple G3 and is a CA', () => {
  const root = Buffer.from(appleRootG3, 'base64');
  assert.equal(createHash('sha256').update(root).digest('hex'), '63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179');
  assert.equal(new X509Certificate(root).ca, true);
});
test('real Apple verifier rejects a forged or unsigned transaction', async () => {
  const verifier = new SignedDataVerifier([Buffer.from(appleRootG3, 'base64')], true, Environment.SANDBOX, 'com.rfgforge.solapath');
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  for (const token of [
    'not-a-jws', `${encode({ alg: 'none' })}.${encode(sample)}.`,
    `${encode({ alg: 'ES256', x5c: [appleRootG3] })}.${encode(sample)}.${Buffer.alloc(64).toString('base64url')}`,
  ]) await assert.rejects(() => verifier.verifyAndDecodeTransaction(token));
});

async function clientHarness({ role = 'APP_OWNER', platform = 'ios', status = 'purchased', verificationError = false } = {}) {
  const counts = { purchase: 0, finish: 0, verify: 0 };
  const native = {
    purchase: async () => { counts.purchase++; return { status, signedTransaction: 'sample' }; },
    finish: async () => { counts.finish++; },
  };
  const supabase = {
    auth: { getSession: async () => ({ data: { session: { user: { id: owner } } } }) },
    functions: { invoke: async () => { counts.verify++; return verificationError ? { error: new Error('rejected') } : { data: describeVerifiedSample(sample, owner, now) }; } },
  };
  const key = `__appleTest${Math.random().toString(36).slice(2)}`;
  globalThis[key] = { Capacitor: { getPlatform: () => platform }, registerPlugin: () => native, supabase, getAppAdminRole: async () => role };
  let source = fs.readFileSync(new URL('../src/lib/appleSubscriptions.ts', import.meta.url), 'utf8');
  source = source.replace(/^import .*;\n/gm, '');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  const module = await import('data:text/javascript;base64,' + Buffer.from(`const { Capacitor, registerPlugin, supabase, getAppAdminRole } = globalThis['${key}'];\n${outputText}`).toString('base64'));
  delete globalThis[key];
  return { module, counts };
}
test('client blocks non-owner and non-iOS purchase attempts', async () => {
  for (const options of [{ role: 'APP_ADMIN' }, { role: null }, { platform: 'web' }]) {
    const { module, counts } = await clientHarness(options);
    await assert.rejects(() => module.testApplePurchase(sample.productId));
    assert.equal(counts.purchase, 0);
  }
});
test('cancelled and pending checkout are not verified or finished', async () => {
  for (const status of ['cancelled', 'pending']) {
    const { module, counts } = await clientHarness({ status });
    const result = await module.testApplePurchase(sample.productId);
    assert.equal(result.status, status); assert.equal(counts.verify, 0); assert.equal(counts.finish, 0);
  }
});
test('failed server verification leaves the transaction unfinished for retry', async () => {
  const { module, counts } = await clientHarness({ verificationError: true });
  await assert.rejects(() => module.testApplePurchase(sample.productId));
  assert.equal(counts.finish, 0);
});
test('verified sandbox sample is acknowledged and finished without granting access', async () => {
  const { module, counts } = await clientHarness();
  const result = await module.testApplePurchase(sample.productId);
  assert.equal(result.status, 'verified'); assert.equal(result.samples[0].grantsAccess, false);
  assert.equal(counts.finish, 1);
});
