import assert from "node:assert/strict";
import test, { after, afterEach } from "node:test";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { JSDOM } from "jsdom";

const dom = new JSDOM(
  '<!doctype html><html><body><div id="root"></div></body></html>',
  { url: "https://solapath.example", pretendToBeVisual: true },
);
for (const key of [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "HTMLInputElement",
  "Node",
  "NodeFilter",
  "MutationObserver",
  "localStorage",
])
  Object.defineProperty(globalThis, key, {
    value: key === "window" ? dom.window : dom.window[key],
    configurable: true,
  });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createElement, StrictMode, act } = await import("react");
const { createRoot } = await import("react-dom/client");
const require = createRequire(import.meta.url);
const cwd = process.cwd();
const bundled = await build({
  stdin: {
    contents: `export { default as Panel } from './src/components/ChurchAudioPairPanel'; export { LanguageProvider } from './src/lib/i18n';`,
    resolveDir: cwd,
    loader: "tsx",
  },
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  mainFields: ["module", "main"],
  jsx: "automatic",
  plugins: [
    {
      name: "ui-fixtures",
      setup(b) {
        b.onResolve({ filter: /^@\/lib\/i18n$/ }, () => ({
          path: cwd + "/src/lib/i18n.tsx",
        }));
        b.onResolve({ filter: /^react(?:\/|$)/ }, (args) => ({
          path: pathToFileURL(require.resolve(args.path)).href,
          external: true,
        }));
        b.onResolve({ filter: /^@\/lib\/churchAudioPair$/ }, () => ({
          path: "engine",
          namespace: "fixture",
        }));
        b.onResolve({ filter: /^@\/lib\/churchLiveListener$/ }, () => ({
          path: "listener",
          namespace: "fixture",
        }));
        b.onResolve({ filter: /^@capacitor\/core$/ }, () => ({
          path: "browser",
          namespace: "fixture",
        }));
        b.onResolve({ filter: /^@\/lib\/churchAudioSender$/ }, () => ({
          path: "sender",
          namespace: "fixture",
        }));
        b.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          resolveDir: cwd,
          contents:
            path === "engine"
              ? `export const pairingMessage = code => code; export const audioPairRequest = (...args) => globalThis.streamUi.request(...args);`
              : path === "listener"
                ? "export const startChurchLiveListenerFromConnection = (...args) => globalThis.streamUi.listen(...args);"
                : path === "sender"
                  ? "export const createChurchAudioSender = (...args) => globalThis.streamUi.sender(...args);"
                  : "export const Capacitor={isNativePlatform:()=>false};",
        }));
      },
    },
  ],
});
const temporary = mkdtempSync(join(tmpdir(), "solapath-stream-ui-"));
const modulePath = join(temporary, "panel.mjs");
writeFileSync(modulePath, bundled.outputFiles[0].text);
after(() => {
  dom.window.close();
  rmSync(temporary, { recursive: true, force: true });
});
const { Panel, LanguageProvider } = await import(
  pathToFileURL(modulePath).href
);
let root;
const base = {
  revision: 1,
  canManage: true,
  exists: false,
  paired: false,
  hasSession: false,
  canListen: false,
  expiresAt: null,
  sourceLanguage: "en",
  error: null,
};
function setup(state = {}) {
  const f = {
    state: { ...base, ...state },
    calls: [],
    stops: 0,
    async request(church, action, values) {
      f.calls.push({ action, values });
      if (action === "create")
        f.state = {
          ...f.state,
          exists: true,
          code: "ABCD-1234-EF56",
          proof: "secret-proof",
        };
      if (action === "pair")
        f.state = { ...f.state, paired: true, hasSession: true };
      if (action === "stop") f.state = { ...base };
      if (action.endsWith("_token"))
        return {
          connection: {
            url: "wss://test",
            token: "secret",
            sourceIdentity: "source",
          },
        };
      return { ...f.state };
    },
    sender(onState) {
      return {
        async start() {
          onState("sending");
        },
        async stop() {
          f.stops++;
          onState("closed");
        },
      };
    },
    async listen() {
      return {
        async stop() {
          f.stops++;
        },
        async startAudio() {},
      };
    },
  };
  globalThis.streamUi = f;
  window.confirm = () => true;
  localStorage.setItem("solapath_ui_language", "en");
  return f;
}
async function mount() {
  root = createRoot(document.getElementById("root"));
  await act(async () =>
    root.render(
      createElement(
        StrictMode,
        null,
        createElement(
          LanguageProvider,
          null,
          createElement(Panel, { churchId: "church" }),
        ),
      ),
    ),
  );
}
const button = (name) =>
  [...document.querySelectorAll("button")].find((b) => b.textContent === name);
async function click(name) {
  const target = button(name);
  assert.ok(target, name);
  await act(async () => target.click());
}
afterEach(async () => {
  if (root) {
    await act(async () => root.unmount());
    root = null;
  }
});
test("members cannot generate codes or publish audio", async () => {
  setup({ canManage: false });
  await mount();
  assert.equal(button("Generate pairing code"), undefined);
  assert.equal(document.querySelector("input"), null);
});
test("creating a code never starts microphone capture and paired sender stops on unmount", async () => {
  const f = setup();
  await mount();
  await click("Generate pairing code");
  assert.ok(document.body.textContent.includes("ABCD-1234-EF56"));
  assert.equal(
    f.calls.some((c) => c.action === "publisher_token"),
    false,
  );
  assert.equal(localStorage.getItem("secret-proof"), null);
  f.state = { ...f.state, paired: true, hasSession: true };
  await click("Refresh feed status");
  await click("Start sending audio");
  assert.ok(document.body.textContent.includes("Sending live audio"));
  assert.equal(
    f.calls.find((c) => c.action === "publisher_token").values.proof,
    "secret-proof",
  );
  await act(async () => root.unmount());
  root = null;
  assert.equal(f.stops, 1);
});
test("late listener connection is closed after navigation", async () => {
  const f = setup({ paired: true, hasSession: true, canListen: true });
  let resolve;
  f.listen = () => new Promise((r) => (resolve = r));
  await mount();
  await click("Listen to Translation");
  await act(async () => root.unmount());
  root = null;
  await act(async () =>
    resolve({
      async stop() {
        f.stops++;
      },
      async startAudio() {},
    }),
  );
  assert.equal(f.stops, 1);
});
test("Spanish pairing and sender controls use translated copy", async () => {
  setup();
  localStorage.setItem("solapath_ui_language", "es");
  await mount();
  assert.ok(button("Generar código de vinculación"));
  assert.ok(document.body.textContent.includes("Vincular audio de la iglesia"));
  assert.equal(
    document.body.textContent.includes("No audio sender is paired."),
    false,
  );
});
