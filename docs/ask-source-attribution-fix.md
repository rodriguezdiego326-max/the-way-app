# Ask source and attribution fixes — October 19, 2026

The signed-in iPhone test confirmed the correct profile, two genuine saved notes,
and follow-up continuity. It also exposed mixed Bible quotations and confusing
source/history indicators.

## Changes

- AI prose explains Scripture in its own words; exact quotations are supplied by
  the existing WEB/RV1909 translation cards. The prompt explicitly prohibits
  copying Bible quotations from earlier AI messages. This is a generation rule,
  not a guarantee that every possible model response is free from quotation errors.
- Merge and deduplicate both memory retrieval results instead of discarding the
  study-note path whenever the other path returns a conversation.
- Request IDs for memories used and resolve them only against supplied records.
  Current-conversation context is identified separately and shown as an excerpt;
  an earlier AI response is not presented as a newly verified saved note.
- Derive server source confidence from verified retrieved citations, not model
  self-ratings or the mere presence of generated Bible references.
- Report successfully loaded local Scripture text separately from AI explanation.
  Missing, partial, failed, or cancelled verse loads cannot report success.
  Handle SCRIPTURE_VERIFIED explicitly instead of displaying unavailable.

## Validation

- Nine backend regression tests passed, including retrieval merging, invented-ID
  rejection, current-chat attribution, authentication, and source confidence.
- Three ScriptureBlock tests passed: full load, missing/error/invalid text, and
  stale completion after unmount/translation change.
- Production web build passed.
- Live synthetic GPT-6 Luna follow-up used both supplied note IDs, identified
  earlier chat context, paraphrased Scripture without repeating the old quotation,
  and passed the response validator. No user records were read or written.
- Full application typecheck remains blocked by existing errors in AuthForm,
  bibleTypes, churchEngine, BibleScreen, Phase9TestScreen, PrayerScreen,
  TestimonyScreen and TodayScreen. No diagnostics involve the changed components.

## Rollout and remaining verification

Backend fixes affect new answers after deployment. Existing saved answers are not
rewritten. Client badge and panel-label changes require a new signed iOS build
through the existing Codemagic solapath-ios-testflight workflow on main.
After installing it, ask the study-history question and its two-note follow-up;
check the context panel and Scripture status, including switching WEB/RV1909.
This workspace cannot produce or install a signed iOS build.

Rollback: restore the affected files from fee8532c3e13d892935a9769b7c8e54c6dc0f9c7
and redeploy the edge function with JWT verification enabled. No schema or
credential changes were made.
