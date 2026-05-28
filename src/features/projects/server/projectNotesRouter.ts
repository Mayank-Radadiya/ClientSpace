// src/features/projects/server/projectNotesRouter.ts
// tRPC router for per-project internal team notes.
// Notes are internal only — client role cannot read or write.

import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { TRPCError } from "@trpc/server";
import { withRLS } from "@/db/createDrizzleClient";
import { projectNotes } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { projectIdSchema, upsertProjectNotesSchema } from "../schemas";

export const projectNotesRouter = createTRPCRouter({
  /** Get team notes for a project. Returns empty content if none exist. */
  get: protectedProcedure
    .input(projectIdSchema)
    .query(async ({ ctx, input }) => {
      if (ctx.role === "client") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Clients cannot view internal notes.",
        });
      }
      const result = await withRLS(ctx, async (tx) =>
        tx
          .select()
          .from(projectNotes)
          .where(
            and(
              eq(projectNotes.orgId, ctx.orgId),
              eq(projectNotes.projectId, input.projectId),
            ),
          )
          .limit(1),
      );
      return result[0] ?? { projectId: input.projectId, content: "", updatedAt: null };
    }),

  /** Upsert team notes content (auto-save on debounced keystroke). */
  upsert: protectedProcedure
    .input(upsertProjectNotesSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "client") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Clients cannot edit internal notes.",
        });
      }
      return withRLS(ctx, async (tx) => {
        const [upserted] = await tx
          .insert(projectNotes)
          .values({
            orgId: ctx.orgId,
            projectId: input.projectId,
            content: input.content,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: projectNotes.projectId,
            set: {
              content: input.content,
              updatedAt: new Date(),
            },
          })
          .returning();
        return upserted;
      });
    }),
});
