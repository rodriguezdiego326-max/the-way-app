/*
# Build 118 — AI processing consent on profiles

1. Modified table
- `public.profiles` gains three columns:
  - `ai_processing_consent` boolean, NOT NULL, default false. Existing users start with false.
  - `ai_processing_consent_at` timestamptz, nullable.
  - `ai_processing_consent_version` text, nullable.

2. Important notes
- No existing user is opted in. Consent is never inferred from account creation, Memory, prior Ask use, or TestFlight participation.
- Updates continue to use the existing profile ownership policies. No new SECURITY DEFINER function is added.
- Consent is valid only when the stored boolean is true AND the version matches the app's current consent version. The version is enforced by the server in the AI edge function.
- Idempotent: safe to re-run.
*/

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_processing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_processing_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS ai_processing_consent_version text;
