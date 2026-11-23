> Build 182 reference. The newer Build 183 paired computer sender is documented in [paired-church-audio.md](paired-church-audio.md).

# Universal church live feed — Build 182

Branch: `feature/youtube-live-translation`. Marketing version: **0.3.1**.
The approved main branch and the deployed `church-live-feed-admin` endpoint remain separate.

## Member and leader experience

Church Live Feed now has **Stream link** and **Church equipment** choices.
A church has one saved URL source shared across its members. Authorized pastors,
church admins, elders, leaders, and the App Owner can save, check, stop, or remove
that source. Members can open its viewing link and listen when source audio is
actually published. Closing a member's listener does not stop the shared source.
Stopping the connection for everyone requires a separate leader confirmation.

The supplied Sovereign Grace Church broadcast, `hNGObmydgcE`, is saved in the new
source record. Saving it does not establish translation or change the existing
church equipment configuration.

| Source | Watching | Translation input |
| --- | --- | --- |
| YouTube video/live URL | Opens YouTube | Experimental; requires a usable live HLS manifest |
| YouTube channel/handle URL | Opens the channel's page | Viewing only |
| Vimeo, Facebook, Twitch, church website | Opens the provider's player/page | Viewing only |
| Public HTTPS HLS, MP3, M4A, MP4, WebM, OGG, MOV | Dedicated source connection | LiveKit URL ingress, subject to actual access and audio availability |
| Compatible hardware encoder, streaming software, or restreaming service | Existing equipment flow | RTMP or WHIP; OBS is one compatible option |
| Phone microphone | Existing microphone translator | Available from either connection mode |

Extensionless direct media URLs can be selected explicitly as **Direct audio or
video URL**. Ordinary viewing pages never become playable media merely because
that option is selected. Sources must be public HTTPS addresses with media content
types; protected media, sign-in requirements, private addresses, and unsupported
playlist links are rejected. Stream providers can still impose access or codec
limits. This does not promise extraction from every website or automatic translation
of every video link.

The last check of the supplied YouTube broadcast identified it as live but returned
no usable HLS manifest. A missing-manifest/access error now retains **Watch stream**
and says why translation is unavailable. It never becomes a false Live status.

## Implementation and operation

- New authenticated Edge Function: `church-stream-source`, deployed v2 with JWT verification enabled.
- Migration: `20261122184012_church_stream_source_connections.sql`, applied remotely.
- Private `church_stream_sources` table holds source configuration, operation revision/lease, and isolated media session references.
- Service-only SQL RPC; direct access by anonymous and authenticated clients is revoked. Every API operation checks actual church membership; mutations also check verified leadership or App Owner status.
- A revision check and 90-second lease serialize changes. Checkpointing saves allocated resources before agent dispatch. Failed startup attempts clean up their own ingress/room; failed cleanup retains the session for a subsequent Stop.
- Direct URLs, redirect targets, and HLS references are checked for public HTTPS/DNS destinations. No client cookies or credentials are forwarded. Provider URLs and tokens are omitted from error logs. Member status omits private direct media URLs and ingress credentials.
- The new rooms use a `church-stream-` prefix and never overwrite the RTMP/WHIP provider configuration. Existing equipment credentials keep their actual protocol; the UI does not claim a reused RTMP credential is WHIP.
- Status requires both publishing ingress and an audio track on the expected source participant before enabling Listen. A video-only connection times out with a no-audio explanation. Translation agent errors remain visible through the existing listener status channel.
- Source checks have bounded deadlines. After a client timeout, Refresh reads the server's shared state before another attempt; it does not blindly create another source.
- Saved URLs persist. Expired URLs and ended broadcasts require a leader to stop/reconnect or save a fresh link. There is no automatic rebroadcast, scheduled start, or indefinite source reconnection in this build.
- English and Spanish cover the new forms, status, confirmations, and errors. The user's custom stream label remains their own text.

The private table intentionally has RLS enabled without client policies: only the
service role can read or mutate it. Supabase's [RLS-without-policy informational
notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
is expected here. The new foreign-key index is reported unused immediately after
creation; it remains useful for profile deletion. Existing advisories on unrelated
functions were not changed by this feature.

## Verification

- `npm run test:church-stream`: 27 passing tests, including real React/JSDOM screen lifecycle, save/remount, member controls, Spanish rendering, and late listener cleanup. Backend tests use mocked provider/LiveKit services; they do not establish real media playback.
- App TypeScript and an additional strict backend TypeScript check pass.
- Lint: zero errors; four pre-existing warnings in unrelated hooks/language exports.
- Language contract passes; production web build and Capacitor iOS sync pass.
- Deployed source files match the repository implementation. Live endpoint OPTIONS returns 200 with the error header exposed; an anonymous POST returns the expected authenticated-function 401.
- Database transaction tests pass for exclusive leases, checkpoints, revision conflicts, and release. Test changes were rolled back. Catalog checks confirm RLS and service-only access.
- Full browser layout and physical iPhone playback remain unverified. Browser installation was blocked in the execution environment; JSDOM interaction tests ran successfully.
- A signed iOS archive and TestFlight processing require the Codemagic build. This update has not started that build.

## Next device check

1. Build `feature/youtube-live-translation` in Codemagic using its existing iOS workflow. Confirm **0.3.1 (182)** before installing from TestFlight.
2. Open My Church → Church Live Feed → Stream link. The saved Sovereign Grace Church link should appear. Tap Watch stream, return, then reopen the screen to confirm persistence.
3. Tap Check translation connection. A restricted or unavailable YouTube feed must show its specific error, keep Watch stream, and permit another action after the request settles.
4. Test a church-authorized public direct audio/HLS source while it is broadcasting. Wait for Source audio received, then Listen to Translation. Confirm original captions, translated captions and translated audio on the iPhone; cancel and leave during connection to check cleanup.
5. Use a regular member account on a second device: it should see the saved source and be able to listen, with no save/start/stop-for-everyone controls. Stop Listening must affect only that device; a leader's Stop connection must end the shared source.
6. Check Spanish mode and keyboard/safe-area behavior for URL entry. Verify the existing equipment and microphone paths still work.

Build 182 is ready for the build/device-test stage, not a verified release candidate.
