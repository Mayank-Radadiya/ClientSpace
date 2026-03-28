import { createTRPCRouter } from "./init";
import { projectRouter } from "@/features/projects/server/router";
import { authRouter } from "@/features/auth/server/router";
import { fileRouter } from "@/features/files/server/router";
import { invoiceRouter } from "@/features/invoices/server/router";
import { dashboardRouter } from "@/features/dashboard/server/router";

export const appRouter = createTRPCRouter({
  project: projectRouter,
  auth: authRouter,
  file: fileRouter,
  invoice: invoiceRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
