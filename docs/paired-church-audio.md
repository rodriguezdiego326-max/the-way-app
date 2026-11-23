# Paired church audio — Build 183

Version 0.3.1 (183), feature/youtube-live-translation. The main branch is unchanged.

A church leader can send live microphone or USB mixer audio from a computer browser
straight to the existing LiveKit translation service, using a code entered in the
phone app. This is a browser audio source, not a universal decoder for arbitrary
OBS/Blackmagic stream keys. Equipment must appear as an audio input on the computer.
Existing saved stream links and encoder setup are retained separately.

## Test procedure

1. Run the existing iOS workflow in Codemagic on `feature/youtube-live-translation`.
   Confirm version **0.3.1 (183)**, then install it from TestFlight.
2. On Windows, open https://solapath-audio-sender-test.rodriguezdiego326.chatgpt.site
   in a current Chrome or Edge browser. This initial sender host is owner-private:
   sign in to ChatGPT with the account that owns the test site if prompted, then
   sign in to SOLAPATH with your church leader account.
3. Select the same church as on your phone. Choose the translation direction and
   **Generate pairing code**. Leave that browser tab open.
4. In the phone app, open My Church → Church Live Feed → Pair church audio.
   Enter the code and tap **Pair this sender** within ten minutes.
5. Back on Windows, choose **Choose audio input**, allow microphone access, and
   select the microphone or USB audio interface/mixer. Press **Start sending audio**.
6. Speak normally and confirm the computer's audio meter moves. On the phone,
   wait for **Source audio received**, then **Listen to Translation**. Use headphones.
   Confirm original captions, translated captions and translated speech.
7. Measure delay using a short identifiable spoken phrase, timing from the start
   of the original phrase to its translated audio. Repeat ten times and record
   the range. The previous 3–6 second target is not a measured result or guarantee.
8. Test for ten minutes, then briefly disconnect/reconnect the computer network.
   Confirm recovery or a clear stopped state, with no duplicate speech. Stop audio,
   leave the screen, and verify the browser microphone indicator switches off.
9. Check Spanish UI, a regular member's listen-only controls, an invalid/expired
   code, and **Stop paired connection** ending the shared feed.

The computer must remain awake with this sender tab open. Closing or reloading the
tab loses its in-memory sender proof; stop the old connection and generate a new
code. A paired session lasts at most four hours. After three minutes without its
sender, the agent closes the room; pair again to restart. These are deliberate test
limits, not background streaming or unattended reconnection promises.

## Security and lifecycle

- New authenticated `church-audio-pair` Edge Function, JWT verification enabled.
- Migration `20261123003809_church_audio_pairings.sql`; separate private table and
  service-only, SECURITY INVOKER RPC. No client table policies or privileges.
- Every action checks actual church membership. Creation, pairing, publishing and
  stopping also require verified leadership or App Owner status.
- Random 48-bit code expires after ten minutes and is consumed once. A separate
  random 256-bit sender proof stays in browser memory. Only hashes are stored.
- Publisher token is bound to the original account, source identity and room;
  permits microphone audio only, no subscription or data publishing. Member tokens
  are subscribe-only. Tokens are never included in status snapshots or logs.
- Revision/operation lease serializes mutations; session is checkpointed before
  network creation. Failed cleanup retains its reference for a later Stop.
- Agent subscribes to the exact paired source identity as a STANDARD participant;
  existing encoder sources still use INGRESS. Paired-room watchdog tests cover
  absence, reconnect grace and the four-hour maximum.
- No new recording or audio persistence is introduced. Live audio is processed by
  the existing media/AI translation services.

## Verification and release limits

42 Node stream tests pass, including six pairing authorization/lifecycle tests,
five microphone cancellation/publication tests and four React pairing UI tests.
Three Python watchdog tests pass. App and backend TypeScript, language contract,
web build, sender build and Capacitor iOS sync pass. Lint has zero errors and four
pre-existing warnings. The sender sign-in page was checked in a real browser in
English and Spanish. Database transaction tests were rolled back; service-only
access was verified. The new RLS-without-policy advisory is intentional because
clients have no table access.

Mocked media tests do not prove end-to-end audio. Physical Windows microphone,
USB mixer, iPhone playback and actual latency require the procedure above.
The signed iOS archive/TestFlight upload still requires Codemagic. Public access
for other churches has not been enabled on the private test sender host.
