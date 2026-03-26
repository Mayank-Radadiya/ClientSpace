import { createTRPCRouter } from "./init";
import { projectRouter } from "@/features/projects/server/router";
import { authRouter } from "@/features/auth/server/router";

export const appRouter = createTRPCRouter({
  project: projectRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
