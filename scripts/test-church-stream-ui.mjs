import assert from 'node:assert/strict';
import test, { after, afterEach } from 'node:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://solapath.example', pretendToBeVisual: true });
for (const key of ['window','document','navigator','HTMLElement','HTMLInputElement','Node','NodeFilter','MutationObserver','localStorage']) Object.defineProperty(globalThis, key, { value: key === 'window' ? dom.window : dom.window[key], configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createElement, StrictMode, act } = await import('react');
const { createRoot } = await import('react-dom/client');
const require = createRequire(import.meta.url);
const cwd = process.cwd();
const bundled = await build({ stdin: { contents: `export { default as Panel } from './src/components/ChurchStreamSourcePanel'; export { LanguageProvider } from './src/lib/i18n';`, resolveDir: cwd, loader: 'tsx' }, bundle: true, write: false, format: 'esm', platform: 'node', mainFields: ['module', 'main'], jsx: 'automatic', plugins: [{ name: 'ui-fixtures', setup(b) {
  b.onResolve({ filter: /^@\/lib\/i18n$/ }, () => ({ path: cwd + '/src/lib/i18n.tsx' }));
  b.onResolve({ filter: /^react(?:\/|$)/ }, args => ({ path: pathToFileURL(require.resolve(args.path)).href, external: true }));
  b.onResolve({ filter: /^@\/lib\/churchStreamEngine$/ }, () => ({ path: 'engine', namespace: 'fixture' }));
  b.onResolve({ filter: /^@\/lib\/churchLiveListener$/ }, () => ({ path: 'listener', namespace: 'fixture' }));
  b.onResolve({ filter: /^@capacitor\/browser$/ }, () => ({ path: 'browser', namespace: 'fixture' }));
  b.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({ resolveDir: cwd, contents:
    path === 'engine' ? `export { churchStreamMessage } from './shared/churchStreamSource.ts'; export const churchStreamRequest = (...args) => globalThis.streamUi.request(...args);` :
    path === 'listener' ? 'export const startChurchLiveListenerFromConnection = (...args) => globalThis.streamUi.listen(...args);' :
    'export const Browser = { open: async ({url}) => {globalThis.streamUi.opened.push(url);} };' }));
} }] });
const temporary = mkdtempSync(join(tmpdir(), 'solapath-stream-ui-'));
const modulePath = join(temporary, 'panel.mjs');
writeFileSync(modulePath, bundled.outputFiles[0].text);
after(() => { dom.window.close(); rmSync(temporary, { recursive: true, force: true }); });
const { Panel, LanguageProvider } = await import(pathToFileURL(modulePath).href);
const fixtureSource = { revision: 1, kind: 'youtube', provider: 'YouTube', label: 'Sunday service', watchUrl: 'https://www.youtube.com/watch?v=hNGObmydgcE', sourceUrl: 'https://www.youtube.com/watch?v=hNGObmydgcE', sourceLanguage: 'en', targetLanguage: 'es', state: 'saved', error: null, hasSession: false, canTranslate: true, canListen: false };
let root;
function setup(source = fixtureSource, canManage = true, language = 'en') {
  localStorage.setItem('solapath_ui_language', language);
  const fixture = { data: { source: structuredClone(source), revision: 1, canManage }, opened: [], calls: [], stopCount: 0,
    async request(churchId, action, values) {
      fixture.calls.push({ churchId, action, values });
      if (action === 'save') fixture.data = { ...fixture.data, revision: 2, source: { ...fixtureSource, label: values.label, sourceUrl: values.sourceUrl, watchUrl: values.sourceUrl } };
      if (action === 'start') fixture.data.source = { ...fixture.data.source, state: 'blocked', error: 'youtube_playback_manifest_unavailable' };
      return { data: structuredClone(fixture.data), error: null };
    },
    async listen() { return { async stop() { fixture.stopCount++; }, async startAudio() {} }; },
  };
  globalThis.streamUi = fixture;
  window.confirm = () => true;
  return fixture;
}
async function mount() {
  root = createRoot(document.getElementById('root'));
  await act(async () => { root.render(createElement(StrictMode, null, createElement(LanguageProvider, null, createElement(Panel, { churchId: 'church-fixture' })))); });
}
const button = name => [...document.querySelectorAll('button')].find(b => b.textContent === name);
async function click(name) { const target = button(name); assert.ok(target, `Missing button: ${name}`); await act(async () => target.click()); }
afterEach(async () => { if (root) { await act(async () => root.unmount()); root = null; } });

test('StrictMode initial fetch settles immediately and members see a watch link without management controls', async () => {
  const fixture = setup(fixtureSource, false);
  await mount();
  assert.equal(fixture.calls.filter(c => c.action === 'get').length, 2);
  assert.ok(document.body.textContent.includes('Sunday service'));
  assert.equal(document.body.textContent.includes('Loading church live feed...'), false);
  assert.equal(document.querySelector('input'), null);
  assert.equal(button('Save stream link'), undefined);
  await click('Watch stream');
  assert.deepEqual(fixture.opened, [fixtureSource.watchUrl]);
});

test('a saved source survives remount; refreshing does not overwrite edits', async () => {
  const fixture = setup(null);
  await mount();
  const inputs = document.querySelectorAll('input');
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  await act(async () => {
    setValue.call(inputs[0], 'New church stream'); inputs[0].dispatchEvent(new window.Event('input', { bubbles: true }));
    setValue.call(inputs[1], 'https://church.example/watch'); inputs[1].dispatchEvent(new window.Event('input', { bubbles: true }));
  });
  await click('Refresh feed status');
  assert.equal(inputs[1].value, 'https://church.example/watch');
  await click('Save stream link');
  const save = fixture.calls.find(c => c.action === 'save');
  assert.equal(save.values.sourceUrl, 'https://church.example/watch');
  assert.equal(save.values.label, 'New church stream');
  await act(async () => root.unmount()); root = null;
  await mount();
  assert.ok(document.body.textContent.includes('New church stream'));
  assert.equal(document.querySelectorAll('input')[1].value, 'https://church.example/watch');
});

test('a failed translation check keeps Watch stream and shows the actual provider error', async () => {
  setup(); await mount();
  await click('Check translation connection');
  assert.ok(button('Watch stream'));
  assert.equal(button('Listen to Translation'), undefined);
  assert.ok(document.body.textContent.includes('Your YouTube link is saved, but YouTube has not supplied usable audio for translation.'));
});

test('unmount during connection stops the late session and ignores its callbacks', async () => {
  const fixture = setup({ ...fixtureSource, canListen: true, hasSession: true, state: 'live' }, false);
  const originalRequest = fixture.request;
  fixture.request = async (...args) => args[1] === 'listener_token' ? { data: { connection: { url: 'wss://test.example', token: 'fixture', sourceIdentity: 'fixture' } }, error: null } : originalRequest(...args);
  let finish;
  fixture.listen = () => new Promise(resolve => { finish = () => resolve({ async stop() { fixture.stopCount++; }, async startAudio() {} }); });
  await mount(); await click('Listen to Translation');
  assert.ok(button('Cancel connection'));
  await act(async () => root.unmount()); root = null;
  await act(async () => finish());
  assert.equal(fixture.stopCount, 1);
  assert.equal(document.getElementById('root').textContent, '');
});

test('Spanish mode renders the new saved-link and restricted-provider messages', async () => {
  setup({ ...fixtureSource, state: 'blocked', error: 'youtube_playback_manifest_unavailable' }, true, 'es');
  await mount();
  assert.ok(button('Ver transmisión'));
  assert.ok(button('Guardar enlace de transmisión'));
  assert.ok(document.body.textContent.includes('Tu enlace de YouTube está guardado'));
  assert.equal(document.body.textContent.includes('Translation unavailable'), false);
  assert.equal(document.querySelector('label').textContent, 'Nombre de la transmisión');
});
