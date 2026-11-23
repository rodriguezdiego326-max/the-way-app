import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
let handler,
  row,
  member,
  role,
  authValid,
  userId,
  grant,
  audio,
  muted,
  dispatchFails,
  cleanupFails,
  roomExists,
  calls;
const churchId = "11111111-1111-4111-8111-111111111111";
function reset() {
  row = { revision: 0, config: null, session: null, error_code: null };
  member = true;
  role = "PASTOR";
  authValid = true;
  userId = "owner";
  audio = false;
  muted = false;
  dispatchFails = false;
  cleanupFails = false;
  roomExists = false;
  calls = [];
}
const client = {
  auth: {
    async getUser() {
      return { data: { user: authValid ? { id: userId } : null } };
    },
  },
  from(name) {
    assert.equal(name, "church_memberships");
    const q = {
      select() {
        return q;
      },
      eq() {
        return q;
      },
      async maybeSingle() {
        return { data: member ? { verified_church_role: role } : null };
      },
    };
    return q;
  },
  async rpc(name, args) {
    if (name === "get_app_admin_role") return { data: null };
    assert.equal(name, "church_audio_pairing_service");
    calls.push(args.p_action);
    if (args.p_action === "get") return { data: structuredClone(row) };
    if (args.p_action === "claim") {
      if (row.operation_id)
        return { error: { message: "operation_in_progress" } };
      if (row.revision !== args.p_payload.revision)
        return { error: { message: "source_changed" } };
      row.operation_id = args.p_operation_id;
    } else if (args.p_action === "release") {
      row.operation_id = null;
    } else {
      assert.equal(row.operation_id, args.p_operation_id);
      row = { ...row, ...args.p_payload };
      if (args.p_action === "write") {
        row.revision++;
        row.operation_id = null;
      }
    }
    return { data: structuredClone(row) };
  },
};
const api = {
  room: {
    async createRoom() {
      roomExists = true;
      calls.push("createRoom");
    },
    async deleteRoom() {
      if (cleanupFails) throw Error("offline");
      roomExists = false;
      calls.push("deleteRoom");
    },
    async listParticipants() {
      if (!roomExists) throw Error("not_found");
      return audio
        ? [
            {
              identity: row.session.sourceIdentity,
              tracks: [{ type: 0, muted }],
            },
          ]
        : [];
    },
  },
  agentDispatch: {
    async createDispatch(room, name, options) {
      calls.push(["dispatch", JSON.parse(options.metadata)]);
      if (dispatchFails) throw Error("offline");
    },
  },
};
globalThis.pairFixture = {
  createClient: () => client,
  LiveKitAPI: class {
    constructor() {
      return api;
    }
  },
  TrackSource: { MICROPHONE: 2 },
  AccessToken: class {
    addGrant(g) {
      grant = g;
    }
    async toJwt() {
      return "fixture-token";
    }
  },
};
globalThis.Deno = {
  serve(fn) {
    handler = fn;
  },
  env: {
    get(name) {
      return name === "LIVEKIT_URL" ? "wss://media.example" : "fixture";
    },
  },
};
const bundled = await build({
  entryPoints: ["supabase/functions/church-audio-pair/index.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  plugins: [
    {
      name: "fixtures",
      setup(b) {
        b.onResolve({ filter: /^(jsr:|npm:)/ }, (args) => ({
          path: args.path.startsWith("jsr:") ? "empty" : "services",
          namespace: "fixture",
        }));
        b.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          contents:
            path === "empty"
              ? "export {}"
              : "export const {createClient,LiveKitAPI,TrackSource,AccessToken}=globalThis.pairFixture;",
        }));
      },
    },
  ],
});
await import(
  "data:text/javascript;base64," +
    Buffer.from(bundled.outputFiles[0].text).toString("base64")
);
async function request(action, values = {}) {
  const response = await handler(
    new Request("https://api.example", {
      method: "POST",
      headers: { Authorization: "Bearer test" },
      body: JSON.stringify({
        churchId,
        action,
        revision: row.revision,
        ...values,
      }),
    }),
  );
  return { status: response.status, data: await response.json() };
}
async function paired() {
  const created = await request("create");
  assert.equal(created.status, 200);
  const connected = await request("pair", { code: created.data.code });
  assert.equal(connected.status, 200);
  return created.data;
}
test("membership and verified leadership are enforced for every privileged action", async () => {
  reset();
  authValid = false;
  assert.equal((await request("get")).status, 401);
  authValid = true;
  member = false;
  for (const action of [
    "get",
    "create",
    "pair",
    "publisher_token",
    "listener_token",
    "stop",
  ])
    assert.equal((await request(action)).status, 403);
  member = true;
  role = null;
  for (const action of ["create", "pair", "publisher_token", "stop"])
    assert.equal((await request(action)).status, 403);
  assert.equal((await request("get")).data.canManage, false);
});
test("codes are hashed, expire, rotate, and cannot be replayed", async () => {
  reset();
  const first = (await request("create")).data;
  assert.match(first.code, /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);
  assert.equal(row.config.proofHash.length, 64);
  assert.notEqual(row.config.proofHash, first.proof);
  assert.ok(!JSON.stringify(row).includes(first.code));
  const second = (await request("create")).data;
  assert.equal(
    (await request("pair", { code: first.code })).data.error,
    "pair_invalid",
  );
  row.config.expiresAt = Date.now() - 1;
  assert.equal(
    (await request("pair", { code: second.code })).data.error,
    "pair_expired",
  );
  reset();
  const active = await paired();
  assert.equal(row.config.codeHash, "");
  assert.equal(
    (await request("pair", { code: active.code })).data.error,
    "stop_before_editing",
  );
  assert.ok(calls.indexOf("checkpoint") < calls.indexOf("createRoom"));
  assert.equal(calls.find((c) => Array.isArray(c))[1].sourceKind, "paired");
});
test("only the originating browser and account can publish microphone audio", async () => {
  reset();
  const active = await paired();
  assert.equal(
    (await request("publisher_token", { proof: "0".repeat(64) })).status,
    403,
  );
  userId = "other-leader";
  assert.equal(
    (await request("publisher_token", { proof: active.proof })).status,
    403,
  );
  userId = "owner";
  assert.equal(
    (await request("publisher_token", { proof: active.proof })).status,
    200,
  );
  assert.deepEqual(grant, {
    roomJoin: true,
    room: row.session.roomName,
    canPublish: true,
    canPublishSources: [2],
    canSubscribe: false,
    canPublishData: false,
  });
  roomExists = false;
  assert.equal(
    (await request("publisher_token", { proof: active.proof })).data.error,
    "pair_expired",
  );
});
test("listeners receive subscribe-only tokens only after unmuted source audio arrives", async () => {
  reset();
  await paired();
  role = null;
  assert.equal((await request("listener_token")).data.error, "feed_not_ready");
  audio = true;
  muted = true;
  assert.equal((await request("get")).data.canListen, false);
  muted = false;
  const status = (await request("get")).data;
  assert.equal(status.canListen, true);
  for (const key of ["proof", "code", "config", "session", "connection"])
    assert.equal(status[key], undefined);
  assert.equal((await request("listener_token")).status, 200);
  assert.equal(grant.canPublish, false);
  assert.equal(grant.canPublishData, false);
  assert.equal(grant.canSubscribe, true);
});
test("revision conflicts cannot replace another connection and stop only deletes its saved room", async () => {
  reset();
  await paired();
  const saved = structuredClone(row);
  assert.equal(
    (await request("stop", { revision: 0 })).data.error,
    "source_changed",
  );
  assert.deepEqual(row, saved);
  assert.equal((await request("create")).data.error, "stop_before_editing");
  cleanupFails = true;
  assert.equal((await request("stop")).data.error, "stream_cleanup_failed");
  assert.ok(row.session);
  cleanupFails = false;
  assert.equal(
    (await request("stop", { roomName: "unrelated-room" })).status,
    200,
  );
  assert.equal(row.session, null);
  assert.equal(row.config, null);
});
test("failed dispatch releases resources, retaining recoverable references when cleanup fails", async () => {
  reset();
  dispatchFails = true;
  const created = (await request("create")).data;
  const failed = await request("pair", { code: created.code });
  assert.equal(failed.data.error, "translation_agent_failed");
  assert.equal(row.session, null);
  reset();
  dispatchFails = true;
  cleanupFails = true;
  const second = (await request("create")).data;
  assert.equal(
    (await request("pair", { code: second.code })).data.error,
    "stream_cleanup_failed",
  );
  assert.ok(row.session);
  assert.equal(
    (await request("publisher_token", { proof: second.proof })).data.error,
    "stream_cleanup_failed",
  );
  cleanupFails = false;
  await request("stop");
  assert.equal(row.session, null);
});
