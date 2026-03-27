import { createTRPCRouter } from "./init";
import { projectRouter } from "@/features/projects/server/router";
import { authRouter } from "@/features/auth/server/router";
import { fileRouter } from "@/features/files/server/router";

export const appRouter = createTRPCRouter({
  project: projectRouter,
  auth: authRouter,
  file: fileRouter,
});

export type AppRouter = typeof appRouter;
