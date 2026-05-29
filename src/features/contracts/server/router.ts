// src/features/contracts/server/router.ts
// tRPC router for the contract management system (agency side).
//
// Security:
//   - All mutations are owner/admin only
//   - signingToken is a UUID — unguessable. Security model: "link = consent"
//   - Status regressions (e.g. signed → sent) are rejected with FORBIDDEN
//
// Performance:
//   - createDrizzleClient(ctx) is always called WITH ctx so it reuses the
//     already-resolved tRPC session and skips the redundant Supabase
//     auth.getUser() + membership DB query that (no-args) would trigger.

import { createTRPCRouter, protectedProcedure, rateLimitedProcedure } from "@/lib/trpc/init";
import { TRPCError } from "@trpc/server";
import { createDrizzleClient } from "@/db/createDrizzleClient";
import { contracts, clients, projects } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { inngest } from "@/inngest/client";
import {
  createContractSchema,
  updateContractSchema,
  listContractsSchema,
  contractIdSchema,
  sendContractSchema,
  voidContractSchema,
  htmlToPlainText,
} from "../schemas";

// ─── Status ordering for regression guard ────────────────────────────────────
const STATUS_ORDER: Record<string, number> = {
  draft: 0,
  sent: 1,
  viewed: 2,
  signed: 3,
  declined: 3,
  expired: 2,
};

function isStatusRegression(from: string, to: string): boolean {
  return (STATUS_ORDER[to] ?? -1) < (STATUS_ORDER[from] ?? -1);
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const contractsRouter = createTRPCRouter({
  /** List all contracts for the org, optionally filtered by project or client. */
  list: protectedProcedure
    .input(listContractsSchema)
    .query(async ({ ctx, input }) => {
      const db = await createDrizzleClient(ctx); // ← ctx: reuses resolved session

      const rows = await db.query.contracts.findMany({
        where: and(
          eq(contracts.orgId, ctx.orgId),
          input.projectId ? eq(contracts.projectId, input.projectId) : undefined,
          input.clientId ? eq(contracts.clientId, input.clientId) : undefined,
          input.status ? eq(contracts.status, input.status) : undefined,
        ),
        columns: {
          id: true,
          title: true,
          status: true,
          clientId: true,
          projectId: true,
          createdAt: true,
          signedAt: true,
          viewedAt: true,
          signingToken: true,
          pdfUrl: true,
          updatedAt: true,
        },
        with: {
          client: { columns: { id: true, contactName: true, companyName: true, email: true } },
          project: { columns: { id: true, name: true } },
        },
        orderBy: [desc(contracts.createdAt)],
      });

      return rows;
    }),

  /** Get a single contract by ID. Enforces org isolation. */
  getById: protectedProcedure
    .input(contractIdSchema)
    .query(async ({ ctx, input }) => {
      const db = await createDrizzleClient(ctx);

      const contract = await db.query.contracts.findFirst({
        where: and(
          eq(contracts.id, input.contractId),
          eq(contracts.orgId, ctx.orgId),
        ),
        with: {
          client: { columns: { id: true, contactName: true, companyName: true, email: true } },
          project: { columns: { id: true, name: true } },
          organization: { columns: { id: true, name: true, logoUrl: true } },
        },
      });

      if (!contract) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found." });
      }

      return contract;
    }),

  /** Create a new contract draft. Owner/admin only. */
  create: rateLimitedProcedure
    .input(createContractSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "owner" && ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Admins and Owners can create contracts.",
        });
      }

      const db = await createDrizzleClient(ctx);

      // Verify client belongs to this org
      const client = await db.query.clients.findFirst({
        where: and(eq(clients.id, input.clientId), eq(clients.orgId, ctx.orgId)),
        columns: { id: true },
      });
      if (!client) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Client not found." });
      }

      // Verify project (if provided) belongs to this org
      if (input.projectId) {
        const project = await db.query.projects.findFirst({
          where: and(eq(projects.id, input.projectId), eq(projects.orgId, ctx.orgId)),
          columns: { id: true },
        });
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
        }
      }

      const [newContract] = await db
        .insert(contracts)
        .values({
          orgId: ctx.orgId,
          clientId: input.clientId,
          projectId: input.projectId ?? null,
          title: input.title,
          bodyHtml: input.bodyHtml,
          bodyPlainText: htmlToPlainText(input.bodyHtml),
          status: "draft",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: contracts.id });

      return newContract!;
    }),

  /** Update a draft contract's content or title. Owner/admin only. */
  update: rateLimitedProcedure
    .input(updateContractSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "owner" && ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Admins and Owners can update contracts.",
        });
      }

      const db = await createDrizzleClient(ctx);

      const existing = await db.query.contracts.findFirst({
        where: and(
          eq(contracts.id, input.contractId),
          eq(contracts.orgId, ctx.orgId),
        ),
        columns: { id: true, status: true },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found." });
      }

      if (existing.status !== "draft") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only draft contracts can be edited.",
        });
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (input.title !== undefined) updateData.title = input.title;
      if (input.bodyHtml !== undefined) {
        updateData.bodyHtml = input.bodyHtml;
        updateData.bodyPlainText = htmlToPlainText(input.bodyHtml);
      }

      await db
        .update(contracts)
        .set(updateData)
        .where(and(eq(contracts.id, input.contractId), eq(contracts.orgId, ctx.orgId)));

      return { ok: true };
    }),

  /**
   * Send a contract to the client for signing.
   * Generates a signing token, sets expiry, dispatches email via Inngest.
   * Owner/admin only.
   */
  sendToClient: rateLimitedProcedure
    .input(sendContractSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "owner" && ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Admins and Owners can send contracts.",
        });
      }

      const db = await createDrizzleClient(ctx);

      const contract = await db.query.contracts.findFirst({
        where: and(
          eq(contracts.id, input.contractId),
          eq(contracts.orgId, ctx.orgId),
        ),
        columns: { id: true, status: true, title: true },
      });

      if (!contract) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found." });
      }

      if (contract.status !== "draft") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Cannot send a contract with status '${contract.status}'. Only drafts can be sent.`,
        });
      }

      // Generate signing token — UUID is unguessable, security model: "link = consent"
      const signingToken = crypto.randomUUID();
      const signingTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await db
        .update(contracts)
        .set({
          status: "sent",
          signingToken,
          signingTokenExpiresAt,
          updatedAt: new Date(),
        })
        .where(and(eq(contracts.id, input.contractId), eq(contracts.orgId, ctx.orgId)));

      // Dispatch Inngest event — sends signing request email to client
      await inngest.send({
        name: "contracts/send.requested",
        data: { contractId: input.contractId, orgId: ctx.orgId },
      });

      const signingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign/${signingToken}`;

      return { ok: true, signingUrl, signingToken };
    }),

  /**
   * Void a sent (but not yet signed) contract.
   * Status: 'sent' | 'viewed' → 'expired'. Cannot void signed contracts.
   */
  voidContract: rateLimitedProcedure
    .input(voidContractSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "owner" && ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Admins and Owners can void contracts.",
        });
      }

      const db = await createDrizzleClient(ctx);

      const contract = await db.query.contracts.findFirst({
        where: and(
          eq(contracts.id, input.contractId),
          eq(contracts.orgId, ctx.orgId),
        ),
        columns: { id: true, status: true },
      });

      if (!contract) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found." });
      }

      const voidableStatuses = ["sent", "viewed"];
      if (!voidableStatuses.includes(contract.status)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Cannot void a contract with status '${contract.status}'. Only sent or viewed contracts can be voided.`,
        });
      }

      await db
        .update(contracts)
        .set({ status: "expired", updatedAt: new Date() })
        .where(and(eq(contracts.id, input.contractId), eq(contracts.orgId, ctx.orgId)));

      return { ok: true };
    }),
});
