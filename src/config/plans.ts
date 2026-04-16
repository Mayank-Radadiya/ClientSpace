export type PlanTier = "starter" | "pro" | "growth" | "business";

/**
 * Single source of truth for plan-gated limits.
 * Never hardcode plan limits elsewhere.
 */
export const PLAN_LIMITS = {
  starter: { maxUploadSizeBytes: 50 * 1024 * 1024 },
  pro: { maxUploadSizeBytes: 250 * 1024 * 1024 },
  growth: { maxUploadSizeBytes: 500 * 1024 * 1024 },
  business: { maxUploadSizeBytes: 1024 * 1024 * 1024 },
} as const satisfies Record<PlanTier, { maxUploadSizeBytes: number }>;
