import { createTRPCRouter } from "./init";
import { projectRouter } from "@/features/projects/server/router";
import { authRouter } from "@/features/auth/server/router";
import { fileRouter } from "@/features/files/server/router";
import { invoiceRouter } from "@/features/invoices/server/router";
import { dashboardRouter } from "@/features/dashboard/server/router";
import { portalRouter } from "@/features/portal/server/router";
import { activityRouter } from "@/features/activity/server/router";

export const appRouter = createTRPCRouter({
  project: projectRouter,
  auth: authRouter,
  file: fileRouter,
  invoice: invoiceRouter,
  dashboard: dashboardRouter,
  portal: portalRouter,
  activity: activityRouter,
});

export type AppRouter = typeof appRouter;
