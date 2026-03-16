import { createTRPCRouter } from "./init";
import { projectRouter } from "@/features/projects/server/router";

export const appRouter = createTRPCRouter({
  project: projectRouter,
});

export type AppRouter = typeof appRouter;
