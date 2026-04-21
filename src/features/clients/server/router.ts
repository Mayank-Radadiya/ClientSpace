import { z } from "zod";
import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { withRLS } from "@/db/createDrizzleClient";
import {
  clients,
  invitations,
  invoices,
  projects,
  activityLogs,
} from "@/db/schema";
import type {
  ClientBootstrapStats,
  ClientDisplayStatus,
  ClientListItem,
} from "../client.types";

const updateClientSchema = z.object({
  clientId: z.string().uuid(),
  companyName: z.string().trim().min(1).max(120),
  contactName: z.string().trim().min(1).max(120),
});

function deriveDisplayStatus(input: {
  dbStatus: "active" | "revoked";
  pendingInvite: boolean;
  activeProjectCount: number;
  outstandingAmountCents: number;
  lastActivityAt: Date | null;
}): ClientDisplayStatus {
  if (input.dbStatus === "revoked") return "archived";
  if (input.pendingInvite) return "pending";

  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const isInactiveByActivity =
    !input.lastActivityAt || input.lastActivityAt < sixtyDaysAgo;

  if (
    input.activeProjectCount === 0 &&
    input.outstandingAmountCents === 0 &&
    isInactiveByActivity
  ) {
    return "inactive";
  }

  return "active";
}

export const clientRouter = createTRPCRouter({
  getBootstrap: protectedProcedure.query(async ({ ctx }) => {
    return withRLS(ctx, async (tx) => {
      const clientRows = await tx
        .select({
          id: clients.id,
          companyName: clients.companyName,
          contactName: clients.contactName,
          email: clients.email,
          dbStatus: clients.status,
          invitedAt: clients.invitedAt,
        })
        .from(clients)
        .where(eq(clients.orgId, ctx.orgId))
        .orderBy(desc(clients.invitedAt));

      const clientIds = clientRows.map((c) => c.id);
      if (clientIds.length === 0) {
        const emptyStats: ClientBootstrapStats = {
          totalClients: 0,
          activeClients: 0,
          activeProjects: 0,
          outstandingInvoicesCents: 0,
        };
        return { clients: [] as ClientListItem[], stats: emptyStats };
      }

      const now = new Date();

      const [
        pendingInvites,
        projectAgg,
        outstandingAgg,
        revenueAgg,
        activityAgg,
        orgStats,
      ] = await Promise.all([
        tx
          .select({ clientId: invitations.clientId })
          .from(invitations)
          .where(
            and(
              eq(invitations.orgId, ctx.orgId),
              inArray(invitations.clientId, clientIds),
              eq(invitations.status, "pending"),
              gt(invitations.expiresAt, now),
            ),
          ),

        tx
          .select({
            clientId: projects.clientId,
            count: sql<number>`count(*)`,
          })
          .from(projects)
          .where(
            and(
              eq(projects.orgId, ctx.orgId),
              inArray(projects.clientId, clientIds),
              inArray(projects.status, ["in_progress", "review"]),
            ),
          )
          .groupBy(projects.clientId),

        tx
          .select({
            clientId: invoices.clientId,
            amount: sql<number>`coalesce(sum(${invoices.amountCents}), 0)`,
          })
          .from(invoices)
          .where(
            and(
              eq(invoices.orgId, ctx.orgId),
              inArray(invoices.clientId, clientIds),
              inArray(invoices.status, ["sent", "overdue"]),
            ),
          )
          .groupBy(invoices.clientId),

        tx
          .select({
            clientId: invoices.clientId,
            amount: sql<number>`coalesce(sum(${invoices.amountCents}), 0)`,
          })
          .from(invoices)
          .where(
            and(
              eq(invoices.orgId, ctx.orgId),
              inArray(invoices.clientId, clientIds),
              eq(invoices.status, "paid"),
            ),
          )
          .groupBy(invoices.clientId),

        tx
          .select({
            clientId: projects.clientId,
            lastAt: sql<Date>`max(${activityLogs.createdAt})`,
          })
          .from(activityLogs)
          .innerJoin(projects, eq(activityLogs.projectId, projects.id))
          .where(
            and(
              eq(activityLogs.orgId, ctx.orgId),
              inArray(projects.clientId, clientIds),
            ),
          )
          .groupBy(projects.clientId),

        Promise.all([
          tx
            .select({ count: sql<number>`count(*)` })
            .from(projects)
            .where(
              and(
                eq(projects.orgId, ctx.orgId),
                inArray(projects.status, ["in_progress", "review"]),
              ),
            ),
          tx
            .select({
              amount: sql<number>`coalesce(sum(${invoices.amountCents}), 0)`,
            })
            .from(invoices)
            .where(
              and(
                eq(invoices.orgId, ctx.orgId),
                inArray(invoices.status, ["sent", "overdue"]),
              ),
            ),
        ]),
      ]);

      const pendingSet = new Set(pendingInvites.map((x) => x.clientId));
      const projectMap = new Map(
        projectAgg.map((x) => [x.clientId, Number(x.count)]),
      );
      const outstandingMap = new Map(
        outstandingAgg.map((x) => [x.clientId, Number(x.amount)]),
      );
      const revenueMap = new Map(
        revenueAgg.map((x) => [x.clientId, Number(x.amount)]),
      );
      const activityMap = new Map(
        activityAgg.map((x) => [x.clientId, x.lastAt ?? null]),
      );

      const list: ClientListItem[] = clientRows.map((row) => {
        const activeProjectCount = projectMap.get(row.id) ?? 0;
        const outstandingAmountCents = outstandingMap.get(row.id) ?? 0;
        const totalRevenueCents = revenueMap.get(row.id) ?? 0;
        const pendingInvite = pendingSet.has(row.id);
        const lastActivityAt = activityMap.get(row.id) ?? null;

        const displayStatus = deriveDisplayStatus({
          dbStatus: row.dbStatus,
          pendingInvite,
          activeProjectCount,
          outstandingAmountCents,
          lastActivityAt,
        });

        return {
          id: row.id,
          companyName: row.companyName,
          contactName: row.contactName,
          email: row.email,
          dbStatus: row.dbStatus,
          displayStatus,
          invitedAt: row.invitedAt?.toISOString() ?? null,
          activeProjectCount,
          outstandingAmountCents,
          totalRevenueCents,
          pendingInvite,
          lastActivityAt: lastActivityAt?.toISOString() ?? null,
        };
      });

      const activeClients = list.filter(
        (c) => c.displayStatus === "active",
      ).length;

      const stats: ClientBootstrapStats = {
        totalClients: list.length,
        activeClients,
        activeProjects: Number(orgStats[0][0]?.count ?? 0),
        outstandingInvoicesCents: Number(orgStats[1][0]?.amount ?? 0),
      };

      return { clients: list, stats };
    });
  }),

  getClientProjects: protectedProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        return tx
          .select({
            id: projects.id,
            name: projects.name,
            status: projects.status,
            priority: projects.priority,
            updatedAt: projects.updatedAt,
          })
          .from(projects)
          .where(
            and(eq(projects.orgId, ctx.orgId), eq(projects.clientId, input.clientId)),
          )
          .orderBy(desc(projects.updatedAt));
      });
    }),

  getClientInvoices: protectedProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        return tx
          .select({
            id: invoices.id,
            number: invoices.number,
            status: invoices.status,
            amountCents: invoices.amountCents,
            dueDate: invoices.dueDate,
            updatedAt: invoices.updatedAt,
          })
          .from(invoices)
          .where(
            and(eq(invoices.orgId, ctx.orgId), eq(invoices.clientId, input.clientId)),
          )
          .orderBy(desc(invoices.updatedAt));
      });
    }),

  getClientActivity: protectedProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        return tx
          .select({
            id: activityLogs.id,
            eventType: activityLogs.eventType,
            metadata: activityLogs.metadata,
            createdAt: activityLogs.createdAt,
          })
          .from(activityLogs)
          .innerJoin(projects, eq(activityLogs.projectId, projects.id))
          .where(
            and(eq(activityLogs.orgId, ctx.orgId), eq(projects.clientId, input.clientId)),
          )
          .orderBy(desc(activityLogs.createdAt))
          .limit(100);
      });
    }),

  updateClient: protectedProcedure
    .input(updateClientSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "owner" && ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owner/admin can update client records.",
        });
      }

      return withRLS(ctx, async (tx) => {
        const existing = await tx.query.clients.findFirst({
          where: and(eq(clients.id, input.clientId), eq(clients.orgId, ctx.orgId)),
          columns: { id: true },
        });

        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Client not found." });
        }

        const [updated] = await tx
          .update(clients)
          .set({
            companyName: input.companyName,
            contactName: input.contactName,
          })
          .where(eq(clients.id, input.clientId))
          .returning({
            id: clients.id,
            companyName: clients.companyName,
            contactName: clients.contactName,
          });

        return updated;
      });
    }),
});
