# YouTube Live sermon translation (isolated feature)

Branch: `feature/youtube-live-translation`

This feature is intentionally isolated from the current SOLAPATH release.

## Current production behavior

The existing church RTMP/WHIP path and `church-live-feed-admin` function are unchanged.
The current iOS/Android clients do not import or call the YouTube source client.

## New backend

Supabase Edge Function: `church-youtube-live-source`

Supported actions:

- `status` — authenticated church member status/capability check.
- `resolve` — leadership/App Owner validates a YouTube live URL and confirms that a live HLS manifest is available.
- `start` — leadership/App Owner resolves the YouTube HLS manifest, starts a one-use LiveKit URL ingress, dispatches the existing `solapath-sermon-translator` agent, and returns a listener token.
- `listener_token` — authenticated church members can obtain a listener token for a valid YouTube session belonging to their church.
- `stop` — leadership/App Owner removes the URL ingress and closes the isolated LiveKit room.

## Media path

ATEM Mini Pro -> YouTube Live -> YouTube HLS -> LiveKit URL ingress -> SOLAPATH translation agent -> translated audio/captions.

## Security/isolation

- Requires Supabase JWT authentication.
- Leadership-only for URL resolution, start, and stop.
- Listener tokens require church membership.
- Only YouTube URL formats are accepted.
- Resolved manifests are restricted to HTTPS `googlevideo.com` hosts before being sent to LiveKit.
- YouTube sessions use separate room/source identity prefixes and never overwrite the existing RTMP/WHIP provider configuration.
- No existing database row or live-feed configuration is modified.

## Experimental client and verified blocker (2026-11-22)

The feature branch's Build 181 includes the Stream URL field in Church Live Feed.
It is not a verified release candidate. The approved main branch remains separate.

The tested broadcast was `hNGObmydgcE`, Sovereign Grace Church Pearland (November 22nd 2026).
The deployed v4 connector returned HTTP 422 before creating a LiveKit ingress.
A local reproduction with the same pinned YouTube.js version returned an explicit
unsupported-application error from the `TV_EMBEDDED` client. Normal web and iOS
player requests identified the broadcast as live but returned no HLS manifest.
These local probes do not prove playback from the Supabase or LiveKit servers.

The resolver now uses the regular player request, limits resolution to 20 seconds,
and reports access restrictions, offline broadcasts, missing manifests and timeouts
with stable error codes. It does not cycle through clients to evade access restrictions.
Errors are logged without auth tokens or signed media URLs. Error codes are exposed
through CORS for the existing client's header reader; updated clients also read the
JSON body from Supabase's HTTP error response.

The updated client releases its Connecting state after failures or a 45-second
deadline. A session returned after that deadline is cleaned up. New messages are
localized in English and Spanish, and the URL connection is labeled experimental.
Client changes need a future app build; no new TestFlight build is required merely
to diagnose the source failure, and no app version bump is included in this patch.

Run `npm run test:church-stream` for regression tests. A successful mocked HLS
response verifies the resolver contract, not real playback. This feature remains
blocked until the actual source delivers playable audio to LiveKit and translation
is verified on a device. An error-handling patch is not evidence of a connected feed.
