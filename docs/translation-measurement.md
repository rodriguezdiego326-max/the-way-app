# Translation measurement and complimentary access

This change is measurement-only. It does not collect payments, produce invoices,
change subscription pricing, apply founding-church discounts, or restrict current
translation access. No free recipients are assigned by the migration.

## Owner workflow

Open Profile → Admin Approval Center → Translation usage & free access.
Only an active APP_OWNER may use the underlying administration RPCs; APP_ADMIN,
church leaders and ordinary users cannot grant access or read aggregate usage.
Search for a church by name or a person by name/email, select the exact recipient,
choose Full access, Subscription, or Translation, supply a reason, and confirm.
Revoke uses a confirmation and leaves an immutable audit entry. Revoking one scope
does not remove separate grants on another scope. Full access covers both scopes.

Church grants apply to that church's plan and shared translation. Personal grants
apply to that person's personal entitlement; a gifted pastor does not make every
church they attend free. The service-role-only `resolve_complimentary_access`
function is ready for a future billing gate. Existing Apple subscriptions are not
modified, canceled or refunded by these grants. No paid access restrictions are
introduced in this phase, so granting access records a future entitlement rather
than changing today's free behavior.

## Data flow and limits

All three church listener-token paths and the microphone secret endpoint register
an opaque measurement ID server-side after authentication. Registration failure
returns a null ID and does not prevent translation. The shared helper has a
2-second fetch timeout; client observations have a 5-second timeout.

Clients send a state immediately and every 15 seconds while the session is open.
Church states distinguish connection, reported playback, failure, and waiting.
Microphone states measure connected time only; muted output or caption-only use is
not treated as verified listening. Closing a session stops its reporter. Packets
are serialized and pending work is coalesced rather than accumulating a queue.

The database validates ownership using auth.uid(), locks the connection row,
rejects stale sequences and ignores closed/expired sessions. It uses receipt time,
not a client duration. Each interval is capped at 30 seconds. Missing final
heartbeats undercount; delayed packets can overcount up to the cap. Client states
are untrusted and must NEVER be used directly as billing evidence.

The owner report covers the last 24 hours. The reporting RPC permits windows up to
31 days. It clips intervals and unions overlaps per person/church/mode, preventing
multiple devices/rejoins from doubling person-minutes. Personal microphone mode
is separate. This is an audience report, not a sermon invoice: reused room names
are not a reliable sermon identity. A future billing system needs server-side
service IDs and verified provider/room events.

No transcript, audio, provider credential or source URL is stored in telemetry.
Data is private; deleting a profile/church cascades its telemetry. The service-only
purge function removes connections older than 90 days and their observations.
Schedule it daily when deploying; it is not automatically scheduled here.

Agent JSON logs named `translation_measurement` contain an agent-instance ID,
room/church IDs, elapsed runtime, ready/failure/closed events, 60-second runtime
samples, and a numeric whitelist from available SDK metrics. Inspect metric type
and provider semantics before summing counters. These logs are diagnostics, not
provider invoices. They cover agent runtime even with no listeners. Abrupt process
termination may omit the final sample. Provider usage export/reconciliation is
still required; it is not implemented by this change.

## Deployment order

1. Review and apply `20261127222022_translation_measurement_and_grants.sql`.
   Verify an existing App Owner account is active; no owner UUID is embedded here.
2. Deploy `church-stream-source`, `church-audio-pair`, `church-live-feed-admin`,
   and `live-sermon-translation-session`, including the new shared helper.
3. Deploy the updated LiveKit agent with its existing secrets. Do not change audio
   models or source settings for this measurement rollout.
4. Build and distribute the updated app. This branch does not bump an iOS build
   number or run Codemagic. Select the next unused build number when releasing.
5. Schedule a daily service-role/DB-owner call to
   `select public.purge_translation_measurements();`.
6. Verify the owner panel loads, a normal account cannot call its RPCs, a selected
   test grant can be added/revoked, and a real listener produces samples.

Rollback: deploy the previous clients/agent/functions. The additive schema can
remain. Existing translation remains functional if registration fails; the owner
panel reports a backend error if its migration is missing.

## Validation

- `npm ci`
- `npm run test:translation-measurement` (isolated WASM PostgreSQL with auth/role fixtures;
  exercises migration SQL, grants, interval accounting, reporter and listener integration)
- `npm run test:church-stream`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `python3 -m unittest discover -s livekit-agent/src -p 'test_*.py'`

These tests do not validate the deployed Supabase schema, real devices, SDK metric
availability at runtime, provider invoices, or actual voice latency.

## Controlled pilot (not executed by this change)

Use the same 10-minute sermon and language pair with 1, 5, then 20 authenticated
test listeners. For each run record UTC start/end, room and agent-instance IDs,
provider usage, owner connected/playback totals, observed latency and interruptions.
Each full run should produce approximately N × 10 person-minutes, with timing
variance from connection setup and heartbeat sampling. Confirm one agent per room.
Repeat with reconnects, two devices for one account, blocked playback, buffering,
source loss and zero listeners. Personal microphone mode needs a separate run.
Do not extrapolate a price until provider usage and runtime are reconciled. Server
spending caps, payment collection/failure handling, and atomic encoder dispatch
remain separate prerequisites for paid launch.

### Checks performed for this draft

42 church-stream tests, 9 measurement/permissions/listener tests, and 5 Python
lifecycle/diagnostic tests passed. TypeScript checking and the production web build
passed. Lint passed with five existing warnings and no errors. Python compilation
and git whitespace checks passed. A full Deno edge-function check was attempted
but canceled after dependency downloads stalled; it remains unverified. The SQL
was exercised in isolated PostgreSQL fixtures, not against a deployed project.

## Hosted rollout — November 27, 2026

The migration is applied to the existing SOLAPATH project using the recorded
server migration version above. Four Edge Functions are active with JWT checks
enabled: church-stream-source v3, church-audio-pair v2, church-live-feed-admin v9,
and live-sermon-translation-session v9. Transactional database smoke tests passed
for recording, reporting, grants, revocation and rejection of non-owner admin access;
test rows were rolled back. Raw table access is denied to authenticated users and
RLS is enabled on all four new private tables. Daily 90-day telemetry cleanup is
scheduled at 05:17 UTC.

Security advisors report the expected private-table/no-policy notices and
authenticated SECURITY DEFINER RPC warnings. These RPCs deliberately use checked
owner/session access; the tables have no direct client grants. See
https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
for the advisory.

iOS configuration targets 0.3.1 build 186; native sync passed. A successful
Codemagic build and TestFlight upload still need verification. The agent deploy
workflow runs on merge to main. No recipients or charges were enabled.
