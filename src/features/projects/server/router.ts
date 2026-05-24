import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { projectSchema, updateProjectSchema } from "../schemas";
import { projectsRouter } from "./projectsRouter";
import { withRLS } from "@/db/createDrizzleClient";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";

export const projectRouter = createTRPCRouter({
  create: protectedProcedure
    .input(projectSchema)
    .mutation(async ({ ctx, input }) => {
      const caller = projectsRouter.createCaller(ctx);
      return caller.create(input);
    }),

  getAll: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.array(z.string()).optional(),
        priority: z.array(z.string()).optional(),
        limit: z.number().int().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const caller = projectsRouter.createCaller(ctx);
      const result = await caller.list({
        cursor: input.cursor,
        limit: input.limit,
      });
      return {
        projects: result.items,
        nextCursor: result.nextCursor,
      };
    }),

  getBootstrap: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.array(z.string()).optional(),
        priority: z.array(z.string()).optional(),
        limit: z.number().int().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const caller = projectsRouter.createCaller(ctx);
      const [orgClients, firstPage] = await Promise.all([
        withRLS(ctx, async (tx) =>
          tx
            .select({
              id: clients.id,
              companyName: clients.companyName,
              email: clients.email,
            })
            .from(clients)
            .where(eq(clients.orgId, ctx.orgId))
        ),
        caller.list({
          cursor: input.cursor,
          limit: input.limit,
        }),
      ]);

      return {
        clients: orgClients,
        firstPage: {
          projects: firstPage.items,
          nextCursor: firstPage.nextCursor,
        },
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const caller = projectsRouter.createCaller(ctx);
      return caller.byId({ id: input.id });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const caller = projectsRouter.createCaller(ctx);
      return caller.delete({ id: input.id });
    }),
});
