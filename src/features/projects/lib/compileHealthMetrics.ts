// src/features/projects/lib/compileHealthMetrics.ts
// Compiles health metrics for a single project — used by both nightly cron
// and on-demand analysis. All queries run in parallel for performance.

import { eq, and, count, desc, lt, gte, isNotNull, sql } from "drizzle-orm";
import {
  projects,
  clients,
  milestones,
  comments,
  assets,
  activityLogs,
  invoices,
} from "@/db/schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProjectHealthMetrics {
  projectId: string;
  projectName: string;
  clientName: string;
  daysUntilDeadline: number | null;
  totalMilestones: number;
  completedMilestones: number;
  overdueMilestones: number;
  milestoneCompletionRate: number;
  unresolvedAnnotations: number;
  openChangeRequests: number;
  pendingApprovals: number;
  lastActivityDaysAgo: number;
  velocityLast7Days: number;
  velocityPrev7Days: number;
  velocityTrend: "improving" | "stable" | "declining";
  invoiceStatus: "none" | "draft" | "sent" | "overdue" | "paid";
  daysSinceLastClientLogin: number | null;
}

// ─── DB type ─────────────────────────────────────────────────────────────────
// Accept any Drizzle database instance (bare `db` from Inngest or RLS-scoped tx)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDB = any;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

const now = () => new Date();

// ─── Main ────────────────────────────────────────────────────────────────────

export async function compileHealthMetrics(
  projectId: string,
  db: DrizzleDB,
): Promise<ProjectHealthMetrics> {
  const today = now();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
  const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD for date columns

  // ── All queries in parallel ──────────────────────────────────────────────

  const [
    projectData,
    milestoneStats,
    overdueResult,
    unresolvedResult,
    changeRequestResult,
    pendingApprovalResult,
    lastActivityResult,
    velocityLast7Result,
    velocityPrev7Result,
    latestInvoiceResult,
  ] = await Promise.all([
    // 1. Project + client name
    db
      .select({
        name: projects.name,
        deadline: projects.deadline,
        clientId: projects.clientId,
        clientName: clients.companyName,
        clientContactName: clients.contactName,
        clientUserId: clients.userId,
      })
      .from(projects)
      .innerJoin(clients, eq(projects.clientId, clients.id))
      .where(eq(projects.id, projectId))
      .limit(1),

    // 2. Milestone stats: total + completed
    db
      .select({
        total: count(),
        completed: count(milestones.completedAt),
      })
      .from(milestones)
      .where(eq(milestones.projectId, projectId)),

    // 3. Overdue milestones: not completed AND due_date < today
    db
      .select({ cnt: count() })
      .from(milestones)
      .where(
        and(
          eq(milestones.projectId, projectId),
          eq(milestones.completed, false),
          isNotNull(milestones.dueDate),
          lt(milestones.dueDate, todayStr),
        ),
      ),

    // 4. Unresolved annotations (comments with metadata and resolved = false)
    db
      .select({ cnt: count() })
      .from(comments)
      .where(
        and(
          eq(comments.projectId, projectId),
          eq(comments.resolved, false),
          isNotNull(comments.metadata),
        ),
      ),

    // 5. Open change requests (assets with approvalStatus = 'changes_requested')
    db
      .select({ cnt: count() })
      .from(assets)
      .where(
        and(
          eq(assets.projectId, projectId),
          eq(assets.approvalStatus, "changes_requested"),
        ),
      ),

    // 6. Pending approvals (assets with approvalStatus = 'pending_review')
    db
      .select({ cnt: count() })
      .from(assets)
      .where(
        and(
          eq(assets.projectId, projectId),
          eq(assets.approvalStatus, "pending_review"),
        ),
      ),

    // 7. Last activity
    db
      .select({ createdAt: activityLogs.createdAt })
      .from(activityLogs)
      .where(eq(activityLogs.projectId, projectId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(1),

    // 8. Velocity: milestones completed in last 7 days
    db
      .select({ cnt: count() })
      .from(milestones)
      .where(
        and(
          eq(milestones.projectId, projectId),
          eq(milestones.completed, true),
          isNotNull(milestones.completedAt),
          gte(milestones.completedAt, sevenDaysAgo),
        ),
      ),

    // 9. Velocity: milestones completed in prev 7 days (day -14 to day -7)
    db
      .select({ cnt: count() })
      .from(milestones)
      .where(
        and(
          eq(milestones.projectId, projectId),
          eq(milestones.completed, true),
          isNotNull(milestones.completedAt),
          gte(milestones.completedAt, fourteenDaysAgo),
          lt(milestones.completedAt, sevenDaysAgo),
        ),
      ),

    // 10. Latest invoice status for this project
    db
      .select({ status: invoices.status })
      .from(invoices)
      .where(eq(invoices.projectId, projectId))
      .orderBy(desc(invoices.createdAt))
      .limit(1),
  ]);

  // ── Compute derived values ───────────────────────────────────────────────

  const project = projectData[0];
  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  const daysUntilDeadline = project.deadline
    ? daysBetween(today, new Date(project.deadline))
    : null;

  const totalMilestones = Number(milestoneStats[0]?.total ?? 0);
  const completedMilestones = Number(milestoneStats[0]?.completed ?? 0);
  const milestoneCompletionRate =
    totalMilestones > 0 ? completedMilestones / totalMilestones : 0;

  const overdueMilestones = Number(overdueResult[0]?.cnt ?? 0);
  const unresolvedAnnotations = Number(unresolvedResult[0]?.cnt ?? 0);
  const openChangeRequests = Number(changeRequestResult[0]?.cnt ?? 0);
  const pendingApprovals = Number(pendingApprovalResult[0]?.cnt ?? 0);

  const lastActivity = lastActivityResult[0]?.createdAt;
  const lastActivityDaysAgo = lastActivity
    ? daysBetween(new Date(lastActivity), today)
    : 999; // No activity = treat as very stale

  const velocityLast7Days = Number(velocityLast7Result[0]?.cnt ?? 0);
  const velocityPrev7Days = Number(velocityPrev7Result[0]?.cnt ?? 0);

  // Velocity trend
  let velocityTrend: "improving" | "stable" | "declining" = "stable";
  if (velocityLast7Days > velocityPrev7Days) velocityTrend = "improving";
  else if (velocityLast7Days < velocityPrev7Days) velocityTrend = "declining";

  // Invoice status
  const rawInvoiceStatus = latestInvoiceResult[0]?.status;
  const invoiceStatus: ProjectHealthMetrics["invoiceStatus"] =
    rawInvoiceStatus && ["draft", "sent", "overdue", "paid"].includes(rawInvoiceStatus)
      ? (rawInvoiceStatus as "draft" | "sent" | "overdue" | "paid")
      : "none";

  // Days since last client login — query Supabase auth.users via the client's userId
  // NOTE: We cannot query auth.users from Drizzle (it's in the auth schema, not public).
  // We fall back to null here. If needed, this can be enhanced with a Supabase admin call.
  const daysSinceLastClientLogin: number | null = null;

  const clientName =
    project.clientName ?? project.clientContactName ?? "Unknown";

  return {
    projectId,
    projectName: project.name,
    clientName,
    daysUntilDeadline,
    totalMilestones,
    completedMilestones,
    overdueMilestones,
    milestoneCompletionRate,
    unresolvedAnnotations,
    openChangeRequests,
    pendingApprovals,
    lastActivityDaysAgo,
    velocityLast7Days,
    velocityPrev7Days,
    velocityTrend,
    invoiceStatus,
    daysSinceLastClientLogin,
  };
}
