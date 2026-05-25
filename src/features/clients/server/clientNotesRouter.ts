import { z } from "zod";
import { and, desc, eq, lt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { withRLS } from "@/db/createDrizzleClient";
import { clientNotes, clients, users } from "@/db/schema";

// ─── Input schemas ────────────────────────────────────────────────────────────

const listSchema = z.object({
  clientId: z.string().uuid(),
  cursor: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

const createSchema = z.object({
  clientId: z.string().uuid(),
  content: z.string().trim().min(1).max(10_000),
});

const updateSchema = z.object({
  noteId: z.string().uuid(),
  content: z.string().trim().min(1).max(10_000),
});

const noteIdSchema = z.object({
  noteId: z.string().uuid(),
});

// ─── Router ───────────────────────────────────────────────────────────────────

export const clientNotesRouter = createTRPCRouter({
  /** Cursor-paginated list of notes for a client, newest first. */
  list: protectedProcedure
    .input(listSchema)
    .query(async ({ ctx, input }) => {
      // client role must never see team notes
      if (ctx.role === "client" || ctx.role === "guest") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
      }

      return withRLS(ctx, async (tx) => {
        // Resolve cursor timestamp first, then use it in the main query
        let cursorCreatedAt: Date | undefined;
        if (input.cursor) {
          const cursorRow = await tx.query.clientNotes.findFirst({
            where: eq(clientNotes.id, input.cursor),
            columns: { createdAt: true },
          });
          cursorCreatedAt = cursorRow?.createdAt;
        }

        const rows = await tx
          .select({
            id: clientNotes.id,
            content: clientNotes.content,
            isPinned: clientNotes.isPinned,
            createdAt: clientNotes.createdAt,
            updatedAt: clientNotes.updatedAt,
            authorId: clientNotes.authorId,
            authorName: users.name,
            authorAvatarUrl: users.avatarUrl,
          })
          .from(clientNotes)
          .innerJoin(users, eq(clientNotes.authorId, users.id))
          .where(
            and(
              eq(clientNotes.orgId, ctx.orgId),
              eq(clientNotes.clientId, input.clientId),
              cursorCreatedAt
                ? lt(clientNotes.createdAt, cursorCreatedAt)
                : undefined,
            ),
          )
          .orderBy(desc(clientNotes.isPinned), desc(clientNotes.createdAt))
          .limit(input.limit + 1);

        const hasMore = rows.length > input.limit;
        const items = hasMore ? rows.slice(0, input.limit) : rows;
        const nextCursor = hasMore ? items[items.length - 1]?.id : null;

        return {
          items: items.map((r) => ({
            ...r,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          })),
          nextCursor,
        };
      });
    }),


  /** Create a new client note. */
  create: protectedProcedure
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "client" || ctx.role === "guest") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
      }

      return withRLS(ctx, async (tx) => {
        // Verify client belongs to this org
        const clientExists = await tx.query.clients.findFirst({
          where: and(
            eq(clients.id, input.clientId),
            eq(clients.orgId, ctx.orgId),
          ),
          columns: { id: true },
        });

        if (!clientExists) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Client not found." });
        }

        const [note] = await tx
          .insert(clientNotes)
          .values({
            orgId: ctx.orgId,
            clientId: input.clientId,
            authorId: ctx.userId,
            content: input.content,
          })
          .returning();

        return note;
      });
    }),

  /** Update the content of an existing note. Only the author or an admin/owner can edit. */
  update: protectedProcedure
    .input(updateSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "client" || ctx.role === "guest") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
      }

      return withRLS(ctx, async (tx) => {
        const existing = await tx.query.clientNotes.findFirst({
          where: and(
            eq(clientNotes.id, input.noteId),
            eq(clientNotes.orgId, ctx.orgId),
          ),
          columns: { id: true, authorId: true },
        });

        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Note not found." });
        }

        // Members can only edit their own notes; owner/admin can edit any
        if (
          ctx.role === "member" &&
          existing.authorId !== ctx.userId
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only edit your own notes.",
          });
        }

        const [updated] = await tx
          .update(clientNotes)
          .set({ content: input.content, updatedAt: new Date() })
          .where(eq(clientNotes.id, input.noteId))
          .returning();

        return updated;
      });
    }),

  /** Delete a note. Same authorship rules as update. */
  delete: protectedProcedure
    .input(noteIdSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role === "client" || ctx.role === "guest") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
      }

      return withRLS(ctx, async (tx) => {
        const existing = await tx.query.clientNotes.findFirst({
          where: and(
            eq(clientNotes.id, input.noteId),
            eq(clientNotes.orgId, ctx.orgId),
          ),
          columns: { id: true, authorId: true },
        });

        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Note not found." });
        }

        if (
          ctx.role === "member" &&
          existing.authorId !== ctx.userId
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only delete your own notes.",
          });
        }

        await tx.delete(clientNotes).where(eq(clientNotes.id, input.noteId));
        return { id: input.noteId };
      });
    }),

  /** Toggle the pinned state of a note. Owner/admin only. */
  togglePin: protectedProcedure
    .input(noteIdSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "owner" && ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owner/admin can pin notes.",
        });
      }

      return withRLS(ctx, async (tx) => {
        const existing = await tx.query.clientNotes.findFirst({
          where: and(
            eq(clientNotes.id, input.noteId),
            eq(clientNotes.orgId, ctx.orgId),
          ),
          columns: { id: true, isPinned: true },
        });

        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Note not found." });
        }

        const [updated] = await tx
          .update(clientNotes)
          .set({ isPinned: !existing.isPinned })
          .where(eq(clientNotes.id, input.noteId))
          .returning({ id: clientNotes.id, isPinned: clientNotes.isPinned });

        return updated;
      });
    }),
});
