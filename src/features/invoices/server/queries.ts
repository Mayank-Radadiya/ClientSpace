import { createDrizzleClient } from "@/db/createDrizzleClient";
import { unstable_cache } from "next/cache";
import { and, eq, desc, sql } from "drizzle-orm";
import { invoices } from "@/db/schema";

/**
 * Queries a list of invoices for an organization.
 * 
 * Cache Tag: `org-{orgId}-invoices`
 * Invalidation: Invalidated by invoice creations or status updates.
 */
export const getInvoiceList = (orgId: string, userId: string, status?: string, clientId?: string, projectId?: string) =>
  unstable_cache(
    async () => {
      try {
        const db = await createDrizzleClient({ orgId, userId });
        return await db.query.invoices.findMany({
          where: and(
            eq(invoices.orgId, orgId),
            status ? eq(invoices.status, status as any) : undefined,
            clientId ? eq(invoices.clientId, clientId) : undefined,
            projectId ? eq(invoices.projectId, projectId) : undefined
          ),
          columns: {
            id: true,
            orgId: true,
            clientId: true,
            projectId: true,
            number: true,
            status: true,
            dueDate: true,
            currency: true,
            amountCents: true,
            taxRateBasisPoints: true,
            pdfUrl: true,
            createdAt: true,
            updatedAt: true,
          },
          with: {
            client: {
              columns: {
                id: true,
                companyName: true,
                email: true,
                contactName: true,
              },
            },
          },
          orderBy: [desc(invoices.createdAt)],
          limit: 100,
        });
      } catch (error) {
        console.error("[getInvoiceList] Database read failed:", error);
        throw new Error("Failed to fetch invoices list.");
      }
    },
    ["invoices-list", orgId, status ?? "all", clientId ?? "all", projectId ?? "all"],
    { tags: [`org-${orgId}-invoices`], revalidate: false }
  )();

/**
 * Queries a single invoice by ID with line items.
 * 
 * Cache Tag: `org-{orgId}-invoice-{invoiceId}`
 * Invalidation: Invalidated by updating status or deleting the invoice.
 */
export const getInvoiceDetail = (orgId: string, userId: string, invoiceId: string) =>
  unstable_cache(
    async () => {
      try {
        const db = await createDrizzleClient({ orgId, userId });
        const invoice = await db.query.invoices.findFirst({
          where: and(
            eq(invoices.id, invoiceId),
            eq(invoices.orgId, orgId)
          ),
          columns: {
            id: true,
            orgId: true,
            clientId: true,
            projectId: true,
            number: true,
            status: true,
            dueDate: true,
            currency: true,
            amountCents: true,
            taxRateBasisPoints: true,
            notes: true,
            pdfUrl: true,
            createdAt: true,
            updatedAt: true,
          },
          with: {
            client: {
              columns: {
                id: true,
                companyName: true,
                email: true,
                contactName: true,
              },
            },
            lineItems: {
              columns: {
                id: true,
                description: true,
                quantity: true,
                unitPriceCents: true,
              },
            },
          },
        });
        return invoice ?? null;
      } catch (error) {
        console.error("[getInvoiceDetail] Database read failed:", error);
        throw new Error("Failed to fetch invoice details.");
      }
    },
    ["invoice-detail", orgId, invoiceId],
    { tags: [`org-${orgId}-invoice-${invoiceId}`], revalidate: false }
  )();

/**
 * Queries financial summary for a project.
 * 
 * Cache Tag: `org-{orgId}-invoices`
 * Invalidation: Invalidated by invoice creations, status updates, or deletions.
 */
export const getProjectFinancialsCached = (orgId: string, userId: string, projectId: string) =>
  unstable_cache(
    async () => {
      try {
        const db = await createDrizzleClient({ orgId, userId });
        const [aggregate] = await db
          .select({
            totalBilled: sql<number>`COALESCE(SUM(${invoices.amountCents}), 0)`,
            totalPaid: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.amountCents} ELSE 0 END), 0)`,
            outstanding: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} IN ('sent', 'overdue') THEN ${invoices.amountCents} ELSE 0 END), 0)`,
            overdueAmount: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'overdue' THEN ${invoices.amountCents} ELSE 0 END), 0)`,
            invoiceCount: sql<number>`COUNT(*)`,
          })
          .from(invoices)
          .where(
            and(
              eq(invoices.orgId, orgId),
              eq(invoices.projectId, projectId)
            )
          );

        return {
          totalBilled: Number(aggregate?.totalBilled ?? 0),
          totalPaid: Number(aggregate?.totalPaid ?? 0),
          outstanding: Number(aggregate?.outstanding ?? 0),
          overdueAmount: Number(aggregate?.overdueAmount ?? 0),
          invoiceCount: Number(aggregate?.invoiceCount ?? 0),
        };
      } catch (error) {
        console.error("[getProjectFinancialsCached] Database read failed:", error);
        throw new Error("Failed to fetch project financials.");
      }
    },
    ["project-financials", orgId, projectId],
    { tags: [`org-${orgId}-invoices`], revalidate: false }
  )();
