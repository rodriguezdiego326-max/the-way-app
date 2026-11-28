# SOLAPATH subscription launch specification

Updated: 2026-11-28. Pricing and plan scope approved by the app owner.
Trial before charging requested by the owner; durations below are implementation defaults selected for this request.

## Status

Specification only. No checkout, paid entitlement gates, StoreKit products, trial timers, or automated charges have been enabled. Complimentary access and founding church eligibility already exist, but do not themselves control an external subscription.

## US launch catalog

| Plan | Monthly USD | Annual USD (billed annually) | Introductory trial |
| --- | ---: | ---: | --- |
| Free | 0 | 0 | No expiration |
| Personal Plus | 5.99 | 49.99 | 7 days |
| Family | 9.99 | 89.99 | 7 days |
| Church | 29.00 | 290.00 | 14 days |
| Founding Church (10 assigned churches maximum) | 14.50 | 145.00 | 14 days |

Free: Bible reading, personal prayer, manual sermon notes, and participation in features provided by the user's church.
Personal Plus: personalized discipleship, Ask, advanced study, and REACH.
Family: Plus for two adults, shared family discipleship, catechism, and parent-guided child profiles.
Church: church studies, shared prayer, small groups and administration, up to 100 approved members.
Usage allowances for AI and sermon processing remain to be defined before paid launch; do not advertise unlimited usage.
Translation is separate and excluded from these paid subscription trials and the founding subscription discount.

## Trial and renewal requirements

- A trial starts only after explicit subscription checkout confirmation, never on account creation, download, or opening a feature.
- Offer the same trial duration on monthly and annual billing options.
- Display actual localized provider price, billing interval, trial duration, first scheduled charge date, automatic renewal terms, and cancellation instructions before confirmation. Annual price must be shown as the total annual charge.
- Only advertise a trial when provider-confirmed eligibility permits it. Apple introductory offers are limited to one per subscription group, including switches between products in that group.
- Use provider-verified transaction status and expiry dates on the server. Device clocks, client flags, reinstalling, and account switching must not reset trials.
- Cancellation and renewal follow provider rules; provide a working Manage Subscription route and Restore Purchases.
- Do not erase user data on expiry. Restore Free access while retaining saved data; church membership authorization remains independent of subscription entitlement.
- Payment details are collected by the payment provider, not stored as raw card data in SOLAPATH.

## Complimentary access and founding churches

- Active complimentary grants bypass starting a paid subscription for the covered scope. Selected pastors' personal grants and church grants remain distinct.
- Free access is not a trial and has no automatic conversion to paid access.
- A new grant does not cancel or refund an existing Apple subscription. Existing subscribers must be clearly directed to manage/cancel it.
- Ten assigned founding churches receive 50% off their church subscription for life. At the approved launch prices this is $14.50 monthly or $145 annually after the 14-day trial.
- Resolve active free access before a founding discount. Never stack discounts or apply a church discount to members' personal subscriptions or translation.
- Provider configuration must preserve the intended lifetime discount; it must not be modeled as a temporary introductory price.

## Implementation sequence and launch checks

1. Configure Personal Plus and Family monthly/annual products, subscription group, and seven-day free introductory offers in App Store Connect.
2. Connect native purchases, server verification/notifications, restore and subscription management. Product identifiers and provider configuration are not yet verified.
3. Choose and validate the organizational Church billing route before implementing its 14-day trial and lifetime discount. Do not assume the exact church price points or organizational purchase flow are already available in Apple.
4. Verify sandbox trial eligibility, explicit checkout consent, cancellation, expiry/renewal, restore, duplicate notification handling, family access, complimentary access, and founding discount behavior.
5. Enable paid launch only after those checks pass. No production charge should be initiated by an admin access grant.

Apple reference (checked 2026-11-28):
https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-introductory-offers-for-auto-renewable-subscriptions/
Apple supports one- and two-week free introductory offers for monthly and annual subscriptions and limits redemption to one introductory offer per subscription group.
