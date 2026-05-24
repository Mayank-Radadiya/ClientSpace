// src/features/projects/lib/healthScore.ts
// Pure functions — no side effects, no imports beyond types.
// Fully unit-testable.

export interface HealthScoreProject {
  start_date: string | null;
  deadline: string;
  budget: number | null;
}

export interface HealthScoreMilestone {
  completed: boolean;
  due_date?: string | null;
}

export interface HealthScoreInvoice {
  status: "draft" | "sent" | "paid" | "overdue";
  amount_cents: number;
}

/**
 * Composite health score 0–100.
 * Formula:
 *   milestone_completion_rate × 0.5
 *   + days_remaining_ratio × 0.3
 *   + invoice_health_ratio × 0.2
 */
export function computeHealthScore(
  project: HealthScoreProject,
  milestones: HealthScoreMilestone[],
  invoices: HealthScoreInvoice[],
): number {
  // 1. Milestone completion rate (0–1)
  const completionRate =
    milestones.length === 0
      ? 0
      : milestones.filter((m) => m.completed).length / milestones.length;

  // 2. Days remaining ratio (0–1, clamped)
  let daysRemainingRatio = 0.5; // neutral if no dates
  if (project.start_date && project.deadline) {
    const startMs = new Date(project.start_date).getTime();
    const deadlineMs = new Date(project.deadline).getTime();
    const nowMs = Date.now();
    const totalDays = (deadlineMs - startMs) / (1000 * 60 * 60 * 24);
    if (totalDays > 0) {
      const remainingDays = (deadlineMs - nowMs) / (1000 * 60 * 60 * 24);
      daysRemainingRatio = Math.max(0, Math.min(1, remainingDays / totalDays));
    }
  } else if (project.deadline) {
    const remainingDays =
      (new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    daysRemainingRatio = remainingDays > 14 ? 1 : remainingDays > 0 ? 0.5 : 0;
  }

  // 3. Invoice health ratio (0–1): paid / total, penalise overdue
  let invoiceHealthRatio = 1; // healthy by default (no invoices)
  if (invoices.length > 0) {
    const totalCents = invoices.reduce((s, i) => s + i.amount_cents, 0);
    if (totalCents > 0) {
      const paidCents = invoices
        .filter((i) => i.status === "paid")
        .reduce((s, i) => s + i.amount_cents, 0);
      const overdueCents = invoices
        .filter((i) => i.status === "overdue")
        .reduce((s, i) => s + i.amount_cents, 0);
      invoiceHealthRatio = (paidCents - overdueCents * 0.5) / totalCents;
      invoiceHealthRatio = Math.max(0, Math.min(1, invoiceHealthRatio));
    }
  }

  const raw =
    completionRate * 0.5 + daysRemainingRatio * 0.3 + invoiceHealthRatio * 0.2;

  return Math.round(raw * 100);
}

/**
 * Risk level based on milestone completion and time remaining.
 * HIGH:   < 30% complete AND < 14 days to deadline
 * MEDIUM: < 50% complete AND < 21 days to deadline
 * LOW:    anything else
 */
export function computeRiskLevel(
  project: Pick<HealthScoreProject, "deadline">,
  milestones: HealthScoreMilestone[],
): "high" | "medium" | "low" {
  if (!project.deadline) return "low";

  const daysRemaining =
    (new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);

  const completionRate =
    milestones.length === 0
      ? 1 // no milestones = nothing to miss
      : milestones.filter((m) => m.completed).length / milestones.length;

  if (completionRate < 0.3 && daysRemaining < 14) return "high";
  if (completionRate < 0.5 && daysRemaining < 21) return "medium";
  return "low";
}

/** Number of overdue milestones (past due_date, not completed). */
export function countOverdueMilestones(
  milestones: Array<{ completed: boolean; due_date?: string | null }>,
): number {
  const now = Date.now();
  return milestones.filter(
    (m) => !m.completed && m.due_date && new Date(m.due_date).getTime() < now,
  ).length;
}
