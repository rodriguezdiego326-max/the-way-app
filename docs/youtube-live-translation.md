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

## Client staging

`src/lib/churchYouTubeLiveEngine.ts` contains the future client API, but it is not imported by any current screen. A later app update can add the YouTube URL field without changing the current release.
