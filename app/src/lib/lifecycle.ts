// Lifecycle stage metadata shared across the CRM.

export const LIFECYCLE_STAGES = [
  "lead",
  "discovery",
  "proposal",
  "active",
  "alumni",
] as const;

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const STAGE_LABELS: Record<LifecycleStage, string> = {
  lead: "Lead",
  discovery: "Discovery",
  proposal: "Proposal",
  active: "Active",
  alumni: "Alumni",
};

// Tailwind utility classes for badges; uses existing palette tokens.
export const STAGE_BADGE_CLASS: Record<LifecycleStage, string> = {
  lead:      "bg-c-blue-dim text-c-blue",
  discovery: "bg-c-purple-dim text-c-purple",
  proposal:  "bg-c-amber-dim text-c-amber",
  active:    "bg-accent-lt text-accent",
  alumni:    "bg-surface-3 text-text-3",
};

export const SOURCE_OPTIONS = [
  "referral",
  "website",
  "linkedin",
  "instagram",
  "event",
  "other",
] as const;
export type ClientSource = (typeof SOURCE_OPTIONS)[number];

export const SOURCE_LABELS: Record<ClientSource, string> = {
  referral: "Referral",
  website: "Website",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  event: "Event",
  other: "Other",
};

export function isLifecycleStage(v: string | null | undefined): v is LifecycleStage {
  return !!v && (LIFECYCLE_STAGES as readonly string[]).includes(v);
}

export function isClientSource(v: string | null | undefined): v is ClientSource {
  return !!v && (SOURCE_OPTIONS as readonly string[]).includes(v);
}

// Returns the next stage in the lifecycle order, or null at the end.
export function nextStage(stage: LifecycleStage): LifecycleStage | null {
  const i = LIFECYCLE_STAGES.indexOf(stage);
  if (i < 0 || i >= LIFECYCLE_STAGES.length - 1) return null;
  return LIFECYCLE_STAGES[i + 1];
}

export function daysSince(iso: string | null | undefined): number {
  if (!iso) return 0;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  const ms = Date.now() - then;
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}
