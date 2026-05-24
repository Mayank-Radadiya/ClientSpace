// src/features/projects/project-detail/lib/healthScore.ts
// Pure function — no React, no hooks, no side effects.
// Returns a 0–100 composite health score with contribution breakdown.

export interface HealthScoreResult {
  /** Composite score 0–100 */
  score: number;
  /** Human-readable label */
  status: "On track" | "Needs attention" | "At risk";
  /** CSS color for the score zone */
  color: string;
  /** Individual contributions for tooltip breakdown */
  scheduleContribution: number;
  budgetContribution: number;
  velocityContribution: number;
}

export interface HealthScoreInput {
  /** 0–100, milestones completed / total * 100 */
  completionPct: number;
  /** Days until project deadline. Negative = overdue. null = no deadline. */
  daysRemaining: number | null;
  /** Total project duration in days. null = unknown. */
  totalDays: number | null;
  /** Total amount invoiced/spent in cents */
  budgetUsed: number;
  /** Total budget cap in cents. null = no budget. */
  budgetTotal: number | null;
}

/**
 * Compute a composite project health score.
 *
 * Three dimensions weighted equally (33.3 each, max 100):
 * 1. Schedule: Is the project on pace to finish by its deadline?
 * 2. Budget: Is spending within the budget envelope?
 * 3. Velocity: Is the completion rate on track?
 */
export function computeHealthScore(input: HealthScoreInput): HealthScoreResult {
  const schedule = computeScheduleScore(input);
  const budget = computeBudgetScore(input);
  const velocity = computeVelocityScore(input);

  // Weighted composite — 40% schedule, 30% budget, 30% velocity
  const score = Math.round(
    schedule * 0.4 + budget * 0.3 + velocity * 0.3,
  );

  const clampedScore = Math.max(0, Math.min(100, score));

  let status: HealthScoreResult["status"];
  let color: string;

  if (clampedScore >= 70) {
    status = "On track";
    color = "hsl(152, 68%, 45%)"; // green
  } else if (clampedScore >= 40) {
    status = "Needs attention";
    color = "hsl(38, 92%, 50%)"; // amber
  } else {
    status = "At risk";
    color = "hsl(0, 72%, 58%)"; // red
  }

  return {
    score: clampedScore,
    status,
    color,
    scheduleContribution: Math.round(schedule),
    budgetContribution: Math.round(budget),
    velocityContribution: Math.round(velocity),
  };
}

/** Schedule dimension: 0–100 */
function computeScheduleScore(input: HealthScoreInput): number {
  const { daysRemaining } = input;

  // No deadline → neutral score
  if (daysRemaining === null) return 60;

  // Overdue
  if (daysRemaining < 0) {
    // Progressively worse: -1 day = 30, -7 days = 16, -14+ days = ~0
    return Math.max(0, 30 + daysRemaining * 2);
  }

  // Tight deadline (< 7 days) — warning zone
  if (daysRemaining < 7) return 40 + daysRemaining * 5; // 40–75

  // Comfortable (≥ 7 days)
  return Math.min(100, 70 + daysRemaining);
}

/** Budget dimension: 0–100 */
function computeBudgetScore(input: HealthScoreInput): number {
  const { budgetUsed, budgetTotal } = input;

  // No budget → neutral score
  if (budgetTotal === null || budgetTotal === 0) return 60;

  const ratio = budgetUsed / budgetTotal;

  // Under budget — healthy
  if (ratio <= 0.7) return 100;
  if (ratio <= 0.9) return 80;
  if (ratio <= 1.0) return 60;

  // Over budget — progressively worse
  return Math.max(0, 60 - (ratio - 1) * 200);
}

/** Velocity dimension: 0–100 */
function computeVelocityScore(input: HealthScoreInput): number {
  const { completionPct, daysRemaining, totalDays } = input;

  // No deadline or no total days → base it on completion alone
  if (daysRemaining === null || totalDays === null || totalDays === 0) {
    return Math.min(100, completionPct + 20);
  }

  // Expected completion by now
  const elapsed = totalDays - Math.max(0, daysRemaining);
  const expectedPct = Math.min(100, (elapsed / totalDays) * 100);

  // Ahead of schedule → great
  if (completionPct >= expectedPct) return 100;

  // Behind schedule — gap determines severity
  const gap = expectedPct - completionPct;
  if (gap <= 10) return 80;
  if (gap <= 25) return 55;
  return Math.max(0, 40 - gap);
}
