# SOLAPATH GPT-6 Luna migration — 2026-10-19

## Production change

The `the-way-intelligence` Supabase Edge Function was upgraded from version 54 to 55. The live health check confirms `gpt-6-luna`, production mode, and a healthy OpenAI connection.

- Replace the GPT-4o mini default with `gpt-6-luna`.
- Resolve an unset, blank, or legacy `OPENAI_MODEL` value (`gpt-4o-mini` or `gpt-4o-mini-2024-07-18`) to the new model. Other explicit model choices remain intact.
- Use `max_completion_tokens` instead of deprecated `max_tokens`.
- Explicitly set `reasoning_effort: "none"` for Luna to preserve the previous non-reasoning workload.
- Apply compatible options to both answer generation and the health check.
- Preserve temperature 0.3, the 2,000-token output budget, timeout/retry settings, JSON output contract, prompts, retrieval, authentication and stored data.
- No secret values or database schema were modified.

## Verification

Local checks: `node --test scripts/test-openai-migration.mjs` (Node 24+) — six passed.

Live provider tests ran with the existing production API credential inside a temporary JWT-protected function, additionally protected by a random expiring test token. Only synthetic questions and synthetic memory evidence were used; the harness made no database writes.

| Case | Result |
| --- | --- |
| Romans 8:28 explanation | Passed JSON parsing and application validation; did not promise an easy outcome. |
| Missing bookmark history | Explicitly declined to invent a bookmark. |
| Supplied Psalm 119:9 note | Referenced only the supplied record; personal context metadata matched. |
| Spanish explanation of grace | Returned Spanish user-facing content. |
| Claimed divine instruction to quit a job | Refused to authenticate the claim and recommended human counsel. |

All five Luna responses passed the existing response validator and were marked as real provider output, not development content. A baseline Romans 8:28 request also passed on GPT-4o mini. Single-sample elapsed times were 4.1 seconds for the baseline and 5.9 seconds for Luna; these are smoke-test timings, not a performance benchmark.

After deployment, the production health check confirmed Luna and a healthy connection. An Ask request with only the public client key was rejected with HTTP 401, confirming that it did not bypass user authentication.

The temporary `solapath-model-migration-check` function was retired by replacing its implementation with a static HTTP 410 response. It can no longer call OpenAI or read project data.

## Remaining verification

An authenticated end-user Ask conversation through the iPhone/TestFlight UI was not run in this session. The provider tests exercised the production prompt, context builder, JSON parsing and response validator with synthetic records; they do not replace an end-to-end check of a user's stored memory.

## Rollback

The prior production function matches `supabase/functions/the-way-intelligence/index.ts` at commit `6ecfdfcb87e5632ce63be665effd7e453644e526` (apart from a trailing newline). To roll back, redeploy that file as `the-way-intelligence` with JWT verification enabled, then verify its health response. No environment variable changes need reverting. Revert this migration commit in GitHub as well to keep future deployments consistent.

Do not rely on the old model beyond its January 14, 2027 shutdown date.

## Official references

- https://developers.openai.com/api/docs/deprecations
- https://developers.openai.com/api/docs/models/gpt-6-luna
- https://developers.openai.com/api/docs/guides/latest-model
- https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create
