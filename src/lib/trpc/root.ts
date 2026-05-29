import { createTRPCRouter } from "./init";
import { projectRouter } from "@/features/projects/server/router";
import { authRouter } from "@/features/auth/server/router";
import { fileRouter } from "@/features/files/server/router";
import { invoiceRouter } from "@/features/invoices/server/router";
import { dashboardRouter } from "@/features/dashboard/server/router";
import { portalRouter } from "@/features/portal/server/router";
import { activityRouter } from "@/features/activity/server/router";
import { commentsRouter } from "@/features/comments/server/router";
import { analyticsRouter } from "@/features/analytics/server/router";
import { clientRouter } from "@/features/clients/server/router";
import { clientNotesRouter } from "@/features/clients/server/clientNotesRouter";
import { billingRouter } from "@/features/billing/server/router";
import { contractsRouter } from "@/features/contracts/server/router";
import { organizationsRouter } from "@/features/settings/server/organizationsRouter";
import { notificationsRouter } from "@/features/notifications/server/router";

// Pluralized cached routers
import { projectsRouter } from "@/features/projects/server/projectsRouter";
import { filesRouter } from "@/features/files/server/filesRouter";
import { invoicesRouter } from "@/features/invoices/server/invoicesRouter";

// v4 routers
import { milestonesRouter } from "@/features/projects/server/milestonesRouter";
import { projectNotesRouter } from "@/features/projects/server/projectNotesRouter";

export const appRouter = createTRPCRouter({
  // Pluralized cached routers
  projects: projectsRouter,
  files: filesRouter,
  invoices: invoicesRouter,

  // v4 feature routers
  milestones: milestonesRouter,
  projectNotes: projectNotesRouter,

  // Compatibility singular stubs delegating to plurals
  project: projectRouter,
  file: fileRouter,
  invoice: invoiceRouter,

  auth: authRouter,
  dashboard: dashboardRouter,
  portal: portalRouter,
  activity: activityRouter,
  comments: commentsRouter,
  analytics: analyticsRouter,
  clients: clientRouter,
  clientNotes: clientNotesRouter,
  billing: billingRouter,
  contracts: contractsRouter,
  organizations: organizationsRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
