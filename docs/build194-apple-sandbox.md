# Build 194 — Apple subscription sandbox checkout

Version 0.3.1. Owner-only diagnostic flow; production checkout and paid entitlement enforcement remain disabled.

## Included
- Admin Approval Center → Apple subscription testing, in English and Spanish.
- StoreKit 2 products, trial purchase, refresh, explicit Restore Purchases, and Manage subscription.
- Native AppTransaction verification requires the SOLAPATH bundle in Apple's sandbox before opening any purchase sheet. iOS 16+ required.
- Only the four configured Plus/Family products are accepted. Checkout requires a currently eligible one-week free introductory offer; StoreKit supplies the localized price.
- Account UUID is sent as appAccountToken. Server authenticates the user, checks APP_OWNER, verifies Apple's JWS chain/signature/OCSP, and checks sandbox, bundle, product, ownership and account binding.
- Finish only after successful server acknowledgement. Failed verification leaves unfinished transactions available for Refresh/Restore retry. Canceled and pending purchases do not produce a successful sample.
- Signed samples never grant paid access or modify free grants. No receipt/account-token logging, no database writes, no service-role key in the app.
- TestFlight renewals can run on Apple's accelerated schedule. Signed snapshots are diagnostic, not authoritative current subscription status.

## Automated verification
- Nine executable receipt-policy/client tests: wrong account, production/bundle/product/ownership rejection, expiration/revocation/upgrade classification, Apple root fingerprint, forged-signature rejection, non-owner/non-iOS gating, canceled/pending outcomes, finish-after-verification and retry behavior.
- Typecheck, lint (existing warnings), language contract, production web build and Capacitor iOS sync.
- Deno backend typecheck passed using installed npm dependencies. Deployed endpoint rejected missing authorization at the gateway and anonymous credentials inside the function (401).
- Codemagic index 220 finished successfully: native Swift compiled, signed IPA version 0.3.1 build 194 passed version/entitlement checks, and upload to Apple succeeded. Actual device checkout remains unverified.
- GitHub Validate SOLAPATH run 46126978255 passed all steps.
- Apple upload warning 90725 is a future SDK requirement (April 2027), not an upload blocker.
- Paid Apps Agreement is currently New / unsigned; account holder action required before purchase testing.

Build: https://codemagic.io/app/6a873baf8b77c8db0eea5054/build/6b0a93e19491bc104972aaaa

## Device checks after installing 194
1. Sign in as app owner. Admin Approval Center → Apple subscription testing → Load Apple plans. Confirm four plans and Apple-provided prices; eligible plans show seven days free.
2. Review a trial, open Apple's sandbox purchase sheet, then cancel. Return to the panel: canceled, no successful sample.
3. Start an eligible trial and confirm the sandbox sheet. Expect “Apple transaction verified by the server. Access is unchanged.” Never proceed with a real-money purchase sheet.
4. Relaunch and use Refresh purchases, then Restore Purchases. Both should verify the same account's sandbox purchase. Your existing owner/free access must remain unchanged.
5. Manage subscription should open Apple's management sheet. Other SOLAPATH users must not see the test panel. Confirm English/Spanish text and readable controls.

If Apple returns no products, check Paid Apps agreement and product availability in App Store Connect. Do not treat empty product results as a passed checkout test. A used introductory offer may require a fresh Apple sandbox account for another trial test.

## Remaining before paid launch
App Store product availability/agreement checks; successful native build and device checkout; server-side persistent subscription ownership/entitlements; verified App Store Server Notifications and status reconciliation; expiration, renewal, grace period, refund/revocation and restore tests; app-managed two-adult Family access; production paywall and free-grant precedence; review assets and Apple review. Church subscriptions and metered translation billing are not enabled by this build.
