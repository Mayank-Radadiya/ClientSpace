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
import {
  clientIdSchema,
  updateClientSchema,
  updateLifecycleSchema,
} from "../schemas";

export type ClientLifecycleStatus =
  | "prospect"
  | "active"
  | "on_hold"
  | "churned"
  | "archived";

function deriveDisplayStatus(input: {
  dbStatus: "active" | "revoked";
  pendingInvite: boolean;
  hasAccount: boolean;
  activeProjectCount: number;
  outstandingAmountCents: number;
  lastActivityAt: Date | null;
}): ClientDisplayStatus {
  if (input.dbStatus === "revoked") return "archived";
  if (input.pendingInvite) return "pending";
  // Client was added but never signed up — treat as inactive
  if (!input.hasAccount) return "inactive";

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
          userId: clients.userId,
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
              inArray(projects.status, [
                "not_started",
                "in_progress",
                "review",
              ]),
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
                inArray(projects.status, [
                  "not_started",
                  "in_progress",
                  "review",
                ]),
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
          hasAccount: row.userId !== null,
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
    .input(clientIdSchema)
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
            and(
              eq(projects.orgId, ctx.orgId),
              eq(projects.clientId, input.clientId),
            ),
          )
          .orderBy(desc(projects.updatedAt));
      });
    }),

  getClientInvoices: protectedProcedure
    .input(clientIdSchema)
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
            and(
              eq(invoices.orgId, ctx.orgId),
              eq(invoices.clientId, input.clientId),
            ),
          )
          .orderBy(desc(invoices.updatedAt));
      });
    }),

  getClientActivity: protectedProcedure
    .input(clientIdSchema)
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
            and(
              eq(activityLogs.orgId, ctx.orgId),
              eq(projects.clientId, input.clientId),
            ),
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
          where: and(
            eq(clients.id, input.clientId),
            eq(clients.orgId, ctx.orgId),
          ),
          columns: { id: true },
        });

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found.",
          });
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

  archiveClient: protectedProcedure
    .input(clientIdSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "owner" && ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owner/admin can archive client records.",
        });
      }

      return withRLS(ctx, async (tx) => {
        const existing = await tx.query.clients.findFirst({
          where: and(
            eq(clients.id, input.clientId),
            eq(clients.orgId, ctx.orgId),
          ),
          columns: { id: true },
        });

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found.",
          });
        }

        const [archived] = await tx
          .update(clients)
          .set({ status: "revoked" })
          .where(eq(clients.id, input.clientId))
          .returning({ id: clients.id });

        return archived;
      });
    }),

  unarchiveClient: protectedProcedure
    .input(clientIdSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "owner" && ctx.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owner/admin can unarchive client records." });
      }
      return withRLS(ctx, async (tx) => {
        const existing = await tx.query.clients.findFirst({
          where: and(eq(clients.id, input.clientId), eq(clients.orgId, ctx.orgId)),
          columns: { id: true },
        });
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found." });
        const [updated] = await tx
          .update(clients)
          .set({ status: "active" })
          .where(eq(clients.id, input.clientId))
          .returning({ id: clients.id });
        return updated;
      });
    }),

  deleteClient: protectedProcedure
    .input(clientIdSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "owner" && ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owner/admin can delete client records.",
        });
      }

      return withRLS(ctx, async (tx) => {
        const existing = await tx.query.clients.findFirst({
          where: and(
            eq(clients.id, input.clientId),
            eq(clients.orgId, ctx.orgId),
          ),
          columns: { id: true },
        });

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Client not found.",
          });
        }

        await tx.delete(clients).where(eq(clients.id, input.clientId));
        return { id: input.clientId };
      });
    }),

  getClientById: protectedProcedure
    .input(clientIdSchema)
    .query(async ({ ctx, input }) => {
      return withRLS(ctx, async (tx) => {
        const row = await tx.query.clients.findFirst({
          where: and(
            eq(clients.id, input.clientId),
            eq(clients.orgId, ctx.orgId),
          ),
        });

        if (!row) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Client not found." });
        }

        const now = new Date();
        const [pendingInvites, projectAgg, outstandingAgg, revenueAgg, activityAgg] =
          await Promise.all([
            tx.select({ clientId: invitations.clientId })
              .from(invitations)
              .where(and(
                eq(invitations.orgId, ctx.orgId),
                eq(invitations.clientId, row.id),
                eq(invitations.status, "pending"),
                gt(invitations.expiresAt, now),
              )),
            tx.select({ count: sql<number>`count(*)` })
              .from(projects)
              .where(and(
                eq(projects.orgId, ctx.orgId),
                eq(projects.clientId, row.id),
                inArray(projects.status, ["not_started", "in_progress", "review"]),
              )),
            tx.select({ amount: sql<number>`coalesce(sum(${invoices.amountCents}), 0)` })
              .from(invoices)
              .where(and(
                eq(invoices.orgId, ctx.orgId),
                eq(invoices.clientId, row.id),
                inArray(invoices.status, ["sent", "overdue"]),
              )),
            tx.select({ amount: sql<number>`coalesce(sum(${invoices.amountCents}), 0)` })
              .from(invoices)
              .where(and(
                eq(invoices.orgId, ctx.orgId),
                eq(invoices.clientId, row.id),
                eq(invoices.status, "paid"),
              )),
            tx.select({ lastAt: sql<Date>`max(${activityLogs.createdAt})` })
              .from(activityLogs)
              .innerJoin(projects, eq(activityLogs.projectId, projects.id))
              .where(and(
                eq(activityLogs.orgId, ctx.orgId),
                eq(projects.clientId, row.id),
              )),
          ]);

        const pendingInvite = pendingInvites.length > 0;
        const activeProjectCount = Number(projectAgg[0]?.count ?? 0);
        const outstandingAmountCents = Number(outstandingAgg[0]?.amount ?? 0);
        const totalRevenueCents = Number(revenueAgg[0]?.amount ?? 0);
        const lastActivityAt = activityAgg[0]?.lastAt ?? null;

        const displayStatus = (() => {
          if (row.status === "revoked") return "archived" as const;
          if (pendingInvite) return "pending" as const;
          if (!row.userId) return "inactive" as const;
          const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
          if (activeProjectCount === 0 && outstandingAmountCents === 0 && (!lastActivityAt || lastActivityAt < sixtyDaysAgo)) return "inactive" as const;
          return "active" as const;
        })();

        return {
          id: row.id,
          companyName: row.companyName,
          contactName: row.contactName,
          email: row.email,
          dbStatus: row.status,
          displayStatus,
          lifecycleStatus: row.lifecycleStatus,
          invitedAt: row.invitedAt?.toISOString() ?? null,
          activeProjectCount,
          outstandingAmountCents,
          totalRevenueCents,
          pendingInvite,
          lastActivityAt: lastActivityAt?.toISOString() ?? null,
        };
      });
    }),

  /** Update the lifecycle status (prospect → active → on_hold → churned → archived). */
  updateLifecycle: protectedProcedure
    .input(updateLifecycleSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "owner" && ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owner/admin can change client lifecycle status.",
        });
      }

      return withRLS(ctx, async (tx) => {
        const existing = await tx.query.clients.findFirst({
          where: and(
            eq(clients.id, input.clientId),
            eq(clients.orgId, ctx.orgId),
          ),
          columns: { id: true, lifecycleStatus: true },
        });

        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Client not found." });
        }

        // Keep legacy status in sync: archived → revoked, everything else → active
        const legacyStatus =
          input.lifecycleStatus === "archived" ? "revoked" : "active";

        const [updated] = await tx
          .update(clients)
          .set({
            lifecycleStatus: input.lifecycleStatus,
            status: legacyStatus,
          })
          .where(eq(clients.id, input.clientId))
          .returning({
            id: clients.id,
            lifecycleStatus: clients.lifecycleStatus,
          });

        return { ...updated, previousStatus: existing.lifecycleStatus };
      });
    }),
});
