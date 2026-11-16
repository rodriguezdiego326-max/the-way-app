// Metadata-only notification copy. Built solely from the event type and
// the already-authorized actor and scope labels. Never reads source content.

export const PUSH_TITLE = "SOLAPATH";
export const PUSH_FALLBACK_BODY = "You have new activity.";

const ACTOR_FALLBACK = "A member";
const CIRCLE_SCOPE_FALLBACK = "your Circle";
const ACTOR_MAX = 40;
const SCOPE_MAX = 60;

export type PushCopyInput = {
  eventType: string;
  actorLabel: unknown;
  scopeLabel: unknown;
};

export function sanitizeLabel(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value
    .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength - 1).trimEnd()}…` : cleaned;
}

export function buildActivityPushBody(input: PushCopyInput): string {
  const actor = sanitizeLabel(input.actorLabel, ACTOR_MAX) ?? ACTOR_FALLBACK;
  const circleScope = sanitizeLabel(input.scopeLabel, SCOPE_MAX) ?? CIRCLE_SCOPE_FALLBACK;

  switch (input.eventType) {
    case "family_prayer_added":
      return `${actor} added a Family prayer.`;
    case "family_prayer_updated":
      return `${actor} added an update to a Family prayer.`;
    case "family_sermon_discussion_added":
      return `${actor} shared a sermon discussion with your Family.`;
    case "family_member_joined":
      return `${actor} joined your Family.`;
    case "circle_prayer_added":
      return `${actor} shared a prayer in ${circleScope}.`;
    case "circle_checkin_added":
      return `${actor} posted a Check-In in ${circleScope}.`;
    case "circle_encouragement_received":
      return `${actor} sent you an encouragement in ${circleScope}.`;
    case "circle_sermon_discussion_added":
      return `${actor} shared a sermon discussion in ${circleScope}.`;
    case "circle_member_joined":
      return `${actor} joined ${circleScope}.`;
    default:
      return PUSH_FALLBACK_BODY;
  }
}
