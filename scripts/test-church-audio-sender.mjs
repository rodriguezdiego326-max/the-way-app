import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
let capture,
  stops,
  disconnects,
  published,
  events,
  room,
  states,
  levels,
  resume;
function reset() {
  stops = disconnects = 0;
  published = [];
  events = {};
  states = [];
  levels = [];
  resume = async () => {};
  capture = async () => ({
    stop() {
      stops++;
    },
    mediaStreamTrack: { addEventListener() {} },
  });
}
globalThis.senderFixture = {
  AudioPresets: { speech: {} },
  Track: { Source: { Microphone: "microphone" } },
  RoomEvent: {
    Reconnecting: "reconnecting",
    Reconnected: "reconnected",
    Disconnected: "disconnected",
  },
  createLocalAudioTrack: (...args) => capture(...args),
  Room: class {
    constructor() {
      room = this;
      this.localParticipant = {
        publishTrack: async (...args) => published.push(args),
      };
    }
    on(name, fn) {
      events[name] = fn;
    }
    async connect() {}
    async disconnect() {
      disconnects++;
    }
  },
};
globalThis.MediaStream = class {};
globalThis.AudioContext = class {
  async resume() {
    await resume();
  }
  async close() {}
  createMediaStreamSource() {
    return { connect() {} };
  }
  createAnalyser() {
    return {
      fftSize: 256,
      getByteTimeDomainData(samples) {
        samples.fill(128);
      },
    };
  }
};
const bundled = await build({
  entryPoints: ["src/lib/churchAudioSender.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  plugins: [
    {
      name: "media",
      setup(b) {
        b.onResolve({ filter: /^livekit-client$/ }, () => ({
          path: "media",
          namespace: "fixture",
        }));
        b.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
          contents:
            "export const {AudioPresets,Room,RoomEvent,Track,createLocalAudioTrack}=globalThis.senderFixture;",
        }));
      },
    },
  ],
});
const { createChurchAudioSender } = await import(
  "data:text/javascript;base64," +
    Buffer.from(bundled.outputFiles[0].text).toString("base64")
);
const connection = { url: "wss://fixture", token: "test" };
const make = () =>
  createChurchAudioSender(
    (s) => states.push(s),
    (l) => levels.push(l),
  );
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
};
test("selected input publishes mono microphone audio and disconnect releases it once", async () => {
  reset();
  const original = capture;
  let options;
  capture = async (opts) => {
    options = opts;
    return original();
  };
  const sender = make();
  await sender.start(connection, "usb-mixer");
  assert.deepEqual(options.deviceId, { exact: "usb-mixer" });
  assert.equal(options.channelCount, 1);
  assert.equal(published[0][1].source, "microphone");
  assert.equal(states.at(-1), "sending");
  events.reconnecting();
  assert.equal(states.at(-1), "reconnecting");
  events.reconnected();
  assert.equal(states.at(-1), "sending");
  await sender.stop();
  await sender.stop();
  assert.equal(stops, 1);
  assert.equal(disconnects, 1);
  assert.equal(states.at(-1), "closed");
});
test("permission denial disconnects and returns the real browser error", async () => {
  reset();
  capture = async () => {
    throw new DOMException("denied", "NotAllowedError");
  };
  const sender = make();
  await assert.rejects(sender.start(connection, ""), {
    name: "NotAllowedError",
  });
  assert.equal(published.length, 0);
  assert.equal(states.at(-1), "closed");
});
test("cancel while the permission prompt is open stops a late microphone track", async () => {
  reset();
  const wait = deferred();
  const original = capture;
  capture = () => wait.promise;
  const sender = make();
  const started = sender.start(connection, "");
  await sender.stop();
  wait.resolve(await original());
  await started;
  assert.equal(stops, 1);
  assert.equal(published.length, 0);
  assert.equal(states.at(-1), "closed");
});
test("cancel while audio context resumes cannot create a leaking meter or publish", async () => {
  reset();
  const wait = deferred();
  resume = () => wait.promise;
  const sender = make();
  const started = sender.start(connection, "");
  await Promise.resolve();
  await sender.stop();
  wait.resolve();
  await started;
  assert.equal(published.length, 0);
  assert.equal(states.at(-1), "closed");
});
test("cancel during network connection prevents publication", async () => {
  reset();
  const wait = deferred();
  const sender = make();
  room.connect = () => wait.promise;
  const started = sender.start(connection, "");
  await new Promise((r) => setTimeout(r, 0));
  await sender.stop();
  wait.resolve();
  await started;
  assert.equal(published.length, 0);
  assert.equal(states.at(-1), "closed");
});
