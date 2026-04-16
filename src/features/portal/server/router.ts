import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, exists, inArray, isNull, ne, sql } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { withRLS } from "@/db/createDrizzleClient";
import { createClient } from "@/lib/supabase/server";
import { pool } from "@/db/pool";
import {
  activityLogs,
  assets,
  clients,
  fileVersions,
  folders,
  invoices,
  organizations,
  projects,
} from "@/db/schema";

const CLIENT_VISIBLE_EVENTS = [
  "project_created",
  "status_changed",
  "file_uploaded",
  "file_approved",
  "changes_requested",
  "invoice_created",
  "invoice_status_changed",
  "milestone_completed",
] as const;

async function getSignedPdfUrl(
  storagePath: string | null,
): Promise<string | null> {
  if (!storagePath) return null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.storage
      .from("project-files")
      .createSignedUrl(storagePath, 3600);

    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

async function resolveClient(userId: string, orgId: string) {
  // 1. Direct search by userId across all orgs (bypassing RLS)
  console.info(`[resolveClient] Searching by userId: ${userId}`);
  const rows = await pool`
    SELECT id, org_id, email, contact_name, status, user_id
    FROM clients 
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  let client = rows[0];

  if (!client) {
    console.warn(
      `[resolveClient] No record found by userId: ${userId}. Trying email fallback...`,
    );

    // 2. Fetch user's email to try email-based lookup (in case of unlinked record)
    const userRows =
      await pool`SELECT email FROM users WHERE id = ${userId} LIMIT 1`;
    const userEmail = userRows[0]?.email;

    if (userEmail) {
      console.info(`[resolveClient] Searching by user email: ${userEmail}`);
      const emailRows = await pool`
        SELECT id, org_id, email, contact_name, status, user_id
        FROM clients 
        WHERE LOWER(email) = LOWER(${userEmail})
        LIMIT 1
      `;
      client = emailRows[0];

      if (client) {
        console.warn(
          `[resolveClient] Found client by email (${userEmail}) but userId was ${client.user_id === null ? "NULL" : "DIFFERENT"}. Linking might be broken.`,
        );
      }
    }
  }

  if (!client) {
    console.error(
      `[resolveClient] ABSOLUTELY NO client record found for user: ${userId}`,
    );
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
  }

  if (client.status !== "active") {
    console.error(
      `[resolveClient] Client record found but status is ${client.status} for user: ${userId}`,
    );
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied. Your account is not active.",
    });
  }

  console.info(
    `[resolveClient] Success: Resolved to client ${client.id} in org ${client.org_id}`,
  );
  return {
    id: client.id as string,
    orgId: client.org_id as string,
    email: client.email as string,
    contactName: client.contact_name as string | null,
  };
}

export const portalRouter = createTRPCRouter({
  orgBranding: protectedProcedure.query(async ({ ctx }) => {
    const client = await resolveClient(ctx.userId, ctx.orgId);

    return withRLS({ userId: ctx.userId, orgId: client.orgId }, async (tx) => {
      return (
        (await tx.query.organizations.findFirst({
          where: eq(organizations.id, client.orgId),
          columns: { name: true, logoUrl: true, accentColor: true, plan: true },
        })) ?? null
      );
    });
  }),

  activeProjects: protectedProcedure.query(async ({ ctx }) => {
    const client = await resolveClient(ctx.userId, ctx.orgId);

    return withRLS({ userId: ctx.userId, orgId: client.orgId }, async (tx) => {
      return tx.query.projects.findMany({
        where: and(
          eq(projects.clientId, client.id),
          ne(projects.status, "archived"),
        ),
        orderBy: [desc(projects.updatedAt)],
        with: { milestones: true },
      });
    });
  }),

  openInvoices: protectedProcedure.query(async ({ ctx }) => {
    const client = await resolveClient(ctx.userId, ctx.orgId);

    return withRLS({ userId: ctx.userId, orgId: client.orgId }, async (tx) => {
      const rows = await tx.query.invoices.findMany({
        where: and(
          eq(invoices.clientId, client.id),
          inArray(invoices.status, ["sent", "overdue"]),
        ),
        orderBy: [desc(invoices.dueDate), desc(invoices.createdAt)],
      });

      return Promise.all(
        rows.map(async (invoice) => ({
          ...invoice,
          pdfSignedUrl: await getSignedPdfUrl(invoice.pdfUrl),
        })),
      );
    });
  }),

  allInvoices: protectedProcedure.query(async ({ ctx }) => {
    const client = await resolveClient(ctx.userId, ctx.orgId);

    return withRLS({ userId: ctx.userId, orgId: client.orgId }, async (tx) => {
      const rows = await tx.query.invoices.findMany({
        where: eq(invoices.clientId, client.id),
        orderBy: [desc(invoices.createdAt)],
      });

      return Promise.all(
        rows.map(async (invoice) => ({
          ...invoice,
          pdfSignedUrl: await getSignedPdfUrl(invoice.pdfUrl),
        })),
      );
    });
  }),

  recentActivity: protectedProcedure.query(async ({ ctx }) => {
    const client = await resolveClient(ctx.userId, ctx.orgId);

    return withRLS({ userId: ctx.userId, orgId: client.orgId }, async (tx) => {
      return tx
        .select({
          id: activityLogs.id,
          projectId: activityLogs.projectId,
          actorId: activityLogs.actorId,
          eventType: activityLogs.eventType,
          metadata: activityLogs.metadata,
          createdAt: activityLogs.createdAt,
        })
        .from(activityLogs)
        .where(
          and(
            inArray(activityLogs.eventType, [...CLIENT_VISIBLE_EVENTS]),
            exists(
              tx
                .select({ one: sql`1` })
                .from(projects)
                .where(
                  and(
                    eq(projects.id, activityLogs.projectId),
                    eq(projects.clientId, client.id),
                  ),
                ),
            ),
          ),
        )
        .orderBy(desc(activityLogs.createdAt))
        .limit(10);
    });
  }),

  projectById: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const client = await resolveClient(ctx.userId, ctx.orgId);

      return withRLS(
        { userId: ctx.userId, orgId: client.orgId },
        async (tx) => {
          const project = await tx.query.projects.findFirst({
            where: and(
              eq(projects.id, input.projectId),
              eq(projects.clientId, client.id),
            ),
            with: {
              milestones: true,
              members: { with: { user: true } },
            },
          });

          if (!project) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Project not found.",
            });
          }

          return project;
        },
      );
    }),

  projectAssets: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const client = await resolveClient(ctx.userId, ctx.orgId);

      return withRLS(
        { userId: ctx.userId, orgId: client.orgId },
        async (tx) => {
          const project = await tx.query.projects.findFirst({
            where: and(
              eq(projects.id, input.projectId),
              eq(projects.clientId, client.id),
            ),
            columns: { id: true },
          });

          if (!project) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Access denied.",
            });
          }

          return tx
            .select({
              id: assets.id,
              orgId: assets.orgId,
              projectId: assets.projectId,
              folderId: assets.folderId,
              name: assets.name,
              type: assets.type,
              currentVersionId: assets.currentVersionId,
              approvalStatus: assets.approvalStatus,
              autoApproveAt: assets.autoApproveAt,
              deletedAt: assets.deletedAt,
              createdAt: assets.createdAt,
              updatedAt: assets.updatedAt,
              currentVersion: {
                id: fileVersions.id,
                versionNumber: fileVersions.versionNumber,
                storagePath: fileVersions.storagePath,
                size: fileVersions.size,
                uploadedBy: fileVersions.uploadedBy,
                createdAt: fileVersions.createdAt,
              },
              folder: {
                id: folders.id,
                name: folders.name,
                parentId: folders.parentId,
              },
            })
            .from(assets)
            .leftJoin(
              fileVersions,
              eq(assets.currentVersionId, fileVersions.id),
            )
            .leftJoin(folders, eq(assets.folderId, folders.id))
            .where(
              and(
                eq(assets.projectId, input.projectId),
                isNull(assets.deletedAt),
              ),
            )
            .orderBy(desc(assets.updatedAt));
        },
      );
    }),
});
