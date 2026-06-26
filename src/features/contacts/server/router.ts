import { z } from "zod";
import { and, eq, desc } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { withRLS } from "@/db/createDrizzleClient";
import { contacts } from "@/db/schema";

export const contactsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return withRLS(ctx, async (tx) => {
      return await tx.query.contacts.findMany({
        where: eq(contacts.orgId, ctx.orgId),
        with: {
          client: {
            columns: {
              id: true,
              companyName: true,
              contactName: true,
              email: true,
            },
          },
        },
        orderBy: [desc(contacts.createdAt)],
      });
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required").max(100),
        email: z.string().email("Invalid email address").max(150),
        phone: z.string().max(30).optional().nullable(),
        company: z.string().max(100).optional().nullable(),
        category: z.enum(["lead", "vendor", "partner", "other"]),
        clientId: z.string().uuid().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        const [newContact] = await tx
          .insert(contacts)
          .values({
            orgId: ctx.orgId,
            clientId: input.clientId || null,
            name: input.name,
            email: input.email,
            phone: input.phone || null,
            company: input.company || null,
            category: input.category,
          })
          .returning();
        
        return newContact;
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1, "Name is required").max(100),
        email: z.string().email("Invalid email address").max(150),
        phone: z.string().max(30).optional().nullable(),
        company: z.string().max(100).optional().nullable(),
        category: z.enum(["lead", "vendor", "partner", "other"]),
        clientId: z.string().uuid().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        const [updatedContact] = await tx
          .update(contacts)
          .set({
            clientId: input.clientId || null,
            name: input.name,
            email: input.email,
            phone: input.phone || null,
            company: input.company || null,
            category: input.category,
            updatedAt: new Date(),
          })
          .where(and(eq(contacts.id, input.id), eq(contacts.orgId, ctx.orgId)))
          .returning();

        if (!updatedContact) {
          throw new Error("Contact not found or unauthorized.");
        }
        return updatedContact;
      });
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        const [deleted] = await tx
          .delete(contacts)
          .where(and(eq(contacts.id, input.id), eq(contacts.orgId, ctx.orgId)))
          .returning({ id: contacts.id });

        if (!deleted) {
          throw new Error("Contact not found or unauthorized.");
        }
        return deleted;
      });
    }),
});
