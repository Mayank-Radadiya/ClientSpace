import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, exists, inArray, isNull, ne, sql } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { withRLS } from "@/db/createDrizzleClient";
import { createClient } from "@/lib/supabase/server";
import { pool } from "@/db/pool";
import { stripe } from "@/lib/stripe/server";
import { inngest } from "@/inngest/client";
import {
  activityLogs,
  assets,
  clients,
  fileVersions,
  folders,
  invoices,
  milestones,
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
  // 1. Direct search by userId and orgId (bypassing RLS)
  console.info(
    `[resolveClient] Searching by userId: ${userId} in org: ${orgId}`,
  );
  const rows = await pool`
    SELECT id, org_id, email, contact_name, status, user_id
    FROM clients 
    WHERE user_id = ${userId} AND org_id = ${orgId}
    LIMIT 1
  `;

  let client = rows[0];

  if (!client) {
    console.warn(
      `[resolveClient] No record found by userId: ${userId} in org: ${orgId}. Trying email fallback...`,
    );

    // 2. Fetch user's email to try email-based lookup (in case of unlinked record)
    const userRows =
      await pool`SELECT email FROM users WHERE id = ${userId} LIMIT 1`;
    const userEmail = userRows[0]?.email;

    if (userEmail) {
      console.info(
        `[resolveClient] Searching by user email: ${userEmail} in org: ${orgId}`,
      );
      const emailRows = await pool`
        SELECT id, org_id, email, contact_name, status, user_id
        FROM clients 
        WHERE LOWER(email) = LOWER(${userEmail}) AND org_id = ${orgId}
        LIMIT 1
      `;
      client = emailRows[0];

      if (client && client.user_id !== userId) {
        console.warn(
          `[resolveClient] Found client by email (${userEmail}) in org ${orgId} but userId was ${client.user_id === null ? "NULL" : "DIFFERENT"}. Fixing link now.`,
        );
        try {
          await pool`UPDATE clients SET user_id = ${userId} WHERE id = ${client.id}`;
        } catch (e) {
          console.error(`[resolveClient] Failed to fix client link:`, e);
        }
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

          const rows = await tx
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
              )
            )
            .orderBy(desc(assets.updatedAt));

          // Fetch annotations counts and signed urls in parallel
          return Promise.all(
            rows.map(async (row) => {
              const signedUrl = row.currentVersion?.storagePath
                ? await getSignedPdfUrl(row.currentVersion.storagePath)
                : null;

              const commentsModule = await import("@/db/schema");

              const openCountRes = await tx
                .select({ count: sql<number>`count(*)::int` })
                .from(commentsModule.comments)
                .where(
                  and(
                    eq(commentsModule.comments.assetId, row.id),
                    isNull(commentsModule.comments.parentId),
                    eq(commentsModule.comments.resolved, false)
                  )
                );

              const totalCountRes = await tx
                .select({ count: sql<number>`count(*)::int` })
                .from(commentsModule.comments)
                .where(
                  and(
                    eq(commentsModule.comments.assetId, row.id),
                    isNull(commentsModule.comments.parentId)
                  )
                );

              const annotationsList = await tx.query.comments.findMany({
                where: and(
                  eq(commentsModule.comments.assetId, row.id),
                  isNull(commentsModule.comments.parentId),
                  eq(commentsModule.comments.resolved, false)
                ),
                with: {
                  author: {
                    columns: {
                      id: true,
                      name: true,
                      avatarUrl: true,
                      email: true,
                    },
                  },
                  replies: {
                    with: {
                      author: {
                        columns: {
                          id: true,
                          name: true,
                          avatarUrl: true,
                          email: true,
                        },
                      },
                    },
                    orderBy: [asc(commentsModule.comments.createdAt)],
                  },
                },
              });

              // Resolve roles
              const authorIds = new Set<string>();
              for (const c of annotationsList) {
                authorIds.add(c.authorId);
                if (c.replies) {
                  for (const r of c.replies) {
                    authorIds.add(r.authorId);
                  }
                }
              }

              const authorIdsArr = Array.from(authorIds);
              const memberships =
                authorIdsArr.length > 0
                  ? await tx.query.orgMemberships.findMany({
                      where: and(
                        eq(commentsModule.orgMemberships.orgId, row.orgId),
                        inArray(commentsModule.orgMemberships.userId, authorIdsArr),
                      ),
                      columns: { userId: true, role: true },
                    })
                  : [];
              const roleByUserId = new Map(memberships.map((m) => [m.userId, m.role]));

              const formatUser = (u: any, id: string) => ({
                ...u,
                role: roleByUserId.get(id) ?? null,
              });

              const sortedAnnotations = annotationsList.map((c) => ({
                ...c,
                author: formatUser(c.author, c.authorId),
                replies: c.replies.map((r) => ({
                  ...r,
                  author: formatUser(r.author, r.authorId),
                })),
              }));

              sortedAnnotations.sort((a, b) => {
                const pinA = (a.metadata as any)?.pinNumber ?? 0;
                const pinB = (b.metadata as any)?.pinNumber ?? 0;
                return pinA - pinB;
              });

              return {
                ...row,
                signedUrl,
                openAnnotationsCount: openCountRes[0]?.count ?? 0,
                hasAnnotations: (totalCountRes[0]?.count ?? 0) > 0,
                initialAnnotations: sortedAnnotations,
              };
            })
          );
        },
      );
    }),

  /**
   * Creates a Stripe PaymentIntent on behalf of the connected account.
   * Security: validates invoice ownership (clientId match) before creating.
   * Amount is always in integer cents — never floats.
   * Idempotency key scoped to the invoice ID prevents duplicate charges.
   */
  createPaymentIntent: protectedProcedure
    .input(z.object({ invoiceId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Resolve the calling client — throws FORBIDDEN if not found/active
      const client = await resolveClient(ctx.userId, ctx.orgId);

      // 2. Fetch invoice + org Stripe details within RLS scope
      const result = await withRLS(
        { userId: ctx.userId, orgId: client.orgId },
        async (tx) => {
          const invoice = await tx.query.invoices.findFirst({
            where: eq(invoices.id, input.invoiceId),
            columns: {
              id: true,
              clientId: true,
              orgId: true,
              amountCents: true,
              currency: true,
              status: true,
              stripePaymentIntentId: true,
              number: true,
            },
          });

          if (!invoice) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found." });
          }

          const org = await tx.query.organizations.findFirst({
            where: eq(organizations.id, invoice.orgId),
            columns: {
              stripeAccountId: true,
              stripeOnboardingComplete: true,
              stripeDefaultCurrency: true,
            },
          });

          return { invoice, org };
        },
      );

      const { invoice, org } = result;

      // 3. Ownership check — client must own this invoice
      if (invoice.clientId !== client.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this invoice.",
        });
      }

      // 4. Guard: invoice must be unpaid
      if (invoice.status === "paid") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invoice has already been paid.",
        });
      }

      // 5. Guard: org must have Stripe connected
      if (!org?.stripeAccountId || !org.stripeOnboardingComplete) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "This organization has not connected a payment account yet.",
        });
      }

      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Stripe is not configured on this server.",
        });
      }

      // 6. Reuse existing PaymentIntent if already created (idempotency)
      if (invoice.stripePaymentIntentId) {
        try {
          const existing = await stripe.paymentIntents.retrieve(
            invoice.stripePaymentIntentId,
            {},
            { stripeAccount: org.stripeAccountId },
          );
          if (existing.client_secret && existing.status !== "succeeded") {
            return {
              clientSecret: existing.client_secret,
              publishableKey,
              amount: invoice.amountCents,
              currency: invoice.currency.toLowerCase(),
            };
          }
        } catch {
          // PaymentIntent not found — fall through to create a new one
        }
      }

      // 7. Create a new PaymentIntent via Stripe Connect
      // Amount in smallest currency unit (cents) — never floats
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: invoice.amountCents,
          currency: invoice.currency.toLowerCase(),
          // Platform charges on behalf of the connected account
          on_behalf_of: org.stripeAccountId,
          transfer_data: {
            destination: org.stripeAccountId,
          },
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: String(invoice.number),
            orgId: invoice.orgId,
            clientId: client.id,
          },
          // Enable all relevant payment methods via automatic_payment_methods
          automatic_payment_methods: { enabled: true },
        },
        // Idempotency key — prevents duplicate charges on retries
        { idempotencyKey: `inv_pi_${invoice.id}` },
      );

      if (!paymentIntent.client_secret) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create payment intent.",
        });
      }

      // 8. Persist the PaymentIntent ID to the invoice record
      await withRLS({ userId: ctx.userId, orgId: client.orgId }, async (tx) => {
        await tx
          .update(invoices)
          .set({ stripePaymentIntentId: paymentIntent.id })
          .where(eq(invoices.id, invoice.id));
      });

      return {
        clientSecret: paymentIntent.client_secret,
        publishableKey,
        amount: invoice.amountCents,
        currency: invoice.currency.toLowerCase(),
      };
    }),

  /**
   * Bulk-approves all eligible assets for a project (pending_review + changes_requested).
   * Also marks the first active milestone as completed and fires the
   * 'project/milestone.completed' Inngest event for downstream invoice triggering.
   *
   * Security:
   *   - Resolves the calling client via resolveClient() — throws FORBIDDEN if not active
   *   - Verifies projectId belongs to that client within RLS scope
   *   - idempotent: re-approving already-approved assets is a no-op (filtered out)
   */
  bulkApproveForProject: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const client = await resolveClient(ctx.userId, ctx.orgId);

      return withRLS(
        { userId: ctx.userId, orgId: client.orgId },
        async (tx) => {
          // 1. Verify project belongs to this client
          const project = await tx.query.projects.findFirst({
            where: and(
              eq(projects.id, input.projectId),
              eq(projects.clientId, client.id),
            ),
            columns: { id: true, name: true, orgId: true },
          });

          if (!project) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Access denied.",
            });
          }

          // 2. Fetch all non-deleted assets for the project
          const projectAssets = await tx.query.assets.findMany({
            where: and(
              eq(assets.projectId, input.projectId),
              isNull(assets.deletedAt),
            ),
            columns: { id: true, name: true, approvalStatus: true },
          });

          // Guard: must have at least one approvable asset
          const approvable = projectAssets.filter(
            (a) =>
              a.approvalStatus === "pending_review" ||
              a.approvalStatus === "changes_requested",
          );

          if (approvable.length === 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "No assets are pending approval.",
            });
          }

          // 3. Bulk-update eligible assets → approved
          await tx.transaction(async (trx) => {
            await trx
              .update(assets)
              .set({ approvalStatus: "approved", updatedAt: new Date() })
              .where(
                and(
                  eq(assets.projectId, input.projectId),
                  inArray(assets.approvalStatus, [
                    "pending_review",
                    "changes_requested",
                  ]),
                ),
              );

            // 4. Write activity log
            const actor = await trx.query.clients.findFirst({
              where: eq(clients.id, client.id),
              columns: { contactName: true, email: true },
            });

            await trx.insert(activityLogs).values({
              orgId: client.orgId,
              projectId: input.projectId,
              actorId: ctx.userId,
              eventType: "milestone_completed",
              metadata: {
                event: "milestone.completed",
                title: `All assets approved by client`,
              },
            });

            // 5. Find the first incomplete milestone and mark it done
            const nextMilestone = await trx.query.milestones.findFirst({
              where: and(
                eq(milestones.projectId, input.projectId),
                eq(milestones.completed, false),
              ),
              orderBy: [milestones.order],
              columns: { id: true, title: true },
            });

            if (nextMilestone) {
              await trx
                .update(milestones)
                .set({
                  completed: true,
                  status: "done",
                  completedAt: new Date(),
                })
                .where(eq(milestones.id, nextMilestone.id));
            }
          });

          // 6. Fire Inngest event for downstream invoice triggering (outside the DB tx)
          try {
            await inngest.send({
              name: "project/milestone.completed",
              data: {
                projectId: input.projectId,
                orgId: client.orgId,
                clientId: client.id,
                approvedAssetCount: approvable.length,
              },
            });
          } catch (err) {
            // Inngest is best-effort — don't fail the mutation if event send fails
            console.error(
              "[bulkApproveForProject] Inngest event send failed:",
              err,
            );
          }

          return { success: true, approvedCount: approvable.length };
        },
      );
    }),
});
