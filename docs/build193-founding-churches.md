# Build 193 — Founding church subscription discount

The App Owner can allocate ten lifetime founding-church slots from Admin Approval Center → Translation usage & free access → Founding churches. Each church receives 50% off its church subscription only. Translation usage and members' personal subscriptions are excluded. The selected church, location, scope and lifetime allocation are shown before confirmation; English and Spanish text use the existing accessible field styling.

This phase records eligibility only. No billing provider integration exists yet: there is no checkout, invoice, Apple subscription modification or payment collection. Actual monthly/yearly prices and application at checkout/renewal still need implementation and payment testing. Do not advertise an active checkout discount based on this registry alone.

## Rules

- Only an active protected APP_OWNER can list or assign. APP_ADMIN, church leaders and ordinary users cannot administer this registry.
- Ten fixed database slots, serialized allocation, one slot per church, idempotent retries. Assignment records the church, name, actor, time and internal reason.
- No expiration or cancellation-based loss of eligibility. Slots never recycle, even if a church is deleted. No customer recipients are automatically assigned. Lifetime allocations have no revoke/delete control in this version; review the church carefully before confirming.
- Existing free church subscription grants block unnecessary new assignments. An already-assigned founding church may later receive free access; free takes precedence and never stacks. Removing that free grant leaves its 50% lifetime eligibility intact.
- Personal grants do not affect church pricing. A translation-only grant does not prevent founding subscription eligibility.
- Archived duplicate church records cannot be assigned. Future church merges must explicitly preserve founding status and used slot history; no automatic transfer is implemented.

## Billing integration boundary

`resolve_church_discount_percent(church_id, scope)` is service-role-only and returns 100 for matching free church access, 50 for a founding church subscription, otherwise 0. Scope must be `subscription` or `translation`; the latter can never receive a founding discount. It rejects missing/archived church records. This is a server resolver, not authorization to charge, and does not accept a price or modify a subscription. Billing must handle provider products, rounding, tax, consent, renewals and failure handling separately.

## Validation

Eight PostgreSQL tests cover authorization, raw-table denial, allocation/retry, free precedence, scope isolation, invalid targets, the ten-slot limit and retention after church deletion. Frontend/type/lint/build checks run before release. Device verification pending.

Prior build 192 targeted tests are user-reported PASS: App Owner full church access; visitor restriction/invitation/acceptance (1–3); Deacon request/approval/management/publishing restriction (1–4); personal free-access grant/persistence (1–4). Free-access testing verifies entitlement records and current app behavior; billing bypass is not verified because paid gates are not active.

Hosted migration `20261128064046_founding_church_subscription_discount` applied. Allocation, idempotent retry, 50% subscription/0% translation and unauthorized access were verified in a transaction and rolled back. No recipient slots were assigned. TypeScript, language contract and production build pass; lint has zero errors and six existing warnings. The private table intentionally has deny-all RLS with no direct client grants. The two authenticated SECURITY DEFINER RPC advisories are intentional: both require the protected active App Owner role before reading or writing. See [Supabase RPC advisor](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). No new high-severity findings.
