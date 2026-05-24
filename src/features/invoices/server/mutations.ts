import { createDrizzleClient } from "@/db/createDrizzleClient";
import { sql, and, eq, inArray } from "drizzle-orm";
import { invoices, invoiceLineItems, organizations } from "@/db/schema";

/**
 * Creates a new invoice, assigning a sequential invoice number atomically
 * protected by a transaction-local Postgres advisory lock on the organization.
 */
export async function createInvoiceInDb(
  orgId: string,
  input: {
    clientId: string;
    projectId?: string | null;
    dueDate?: Date | null;
    currency: "USD" | "EUR" | "GBP" | "CAD" | "AUD";
    taxRateBasisPoints?: number;
    notes?: string | null;
    items: Array<{
      description: string;
      quantity: number;
      unitPriceCents: number;
    }>;
  }
) {
  try {
    const db = await createDrizzleClient();

    // Run lock and insert inside securing transaction wrapper
    return await db.transaction(async (tx) => {
      // 1. Acquire transaction-local advisory lock for the organization's invoice numbering
      const lockKey = `invoice_numbering_${orgId}`;
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`);

      // 2. Fetch the current organization billing limits/settings
      const org = await tx.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
        columns: { nextInvoiceNumber: true },
      });
      if (!org) throw new Error("Organization not found.");

      const claimedNumber = org.nextInvoiceNumber;

      // 3. Increment the next invoice number atomically
      await tx
        .update(organizations)
        .set({ nextInvoiceNumber: claimedNumber + 1 })
        .where(eq(organizations.id, orgId));

      // 4. Calculate total cents basis
      const totalCents = input.items.reduce((sum, item) => {
        const itemTotal = Math.round(item.quantity * item.unitPriceCents);
        return sum + itemTotal;
      }, 0);

      const taxAmount = Math.round((totalCents * (input.taxRateBasisPoints ?? 0)) / 10000);
      const grandTotalCents = totalCents + taxAmount;

      const toDateString = (date: Date): string => {
        return date.toISOString().split("T")[0]!;
      };

      // 5. Insert invoice
      const [newInvoice] = await tx
        .insert(invoices)
        .values({
          orgId,
          clientId: input.clientId,
          projectId: input.projectId ?? null,
          number: claimedNumber,
          status: "draft",
          dueDate: input.dueDate ? toDateString(input.dueDate) : null,
          currency: input.currency,
          amountCents: grandTotalCents,
          taxRateBasisPoints: input.taxRateBasisPoints ?? 0,
          notes: input.notes ?? null,
        })
        .returning({
          id: invoices.id,
          orgId: invoices.orgId,
          clientId: invoices.clientId,
          projectId: invoices.projectId,
          number: invoices.number,
          status: invoices.status,
          dueDate: invoices.dueDate,
          currency: invoices.currency,
          amountCents: invoices.amountCents,
          taxRateBasisPoints: invoices.taxRateBasisPoints,
          notes: invoices.notes,
          pdfUrl: invoices.pdfUrl,
          createdAt: invoices.createdAt,
          updatedAt: invoices.updatedAt,
        });

      if (!newInvoice) throw new Error("Failed to insert invoice.");

      // 6. Insert line items
      await tx.insert(invoiceLineItems).values(
        input.items.map((item) => ({
          invoiceId: newInvoice.id,
          description: item.description,
          quantity: item.quantity.toString(),
          unitPriceCents: item.unitPriceCents,
        }))
      );

      return newInvoice;
    });
  } catch (error) {
    console.error("[createInvoiceInDb] Database insert failed:", error);
    throw error;
  }
}

/**
 * Updates an invoice's status and logs paidAt timestamp if status -> paid.
 */
export async function updateInvoiceStatusInDb(
  orgId: string,
  invoiceId: string,
  newStatus: "draft" | "sent" | "paid" | "overdue",
  pdfUrl?: string | null
) {
  try {
    const db = await createDrizzleClient();
    const updateValues: Record<string, any> = {
      status: newStatus,
      updatedAt: new Date(),
    };
    if (newStatus === "paid") {
      updateValues.paidAt = new Date();
    }
    if (pdfUrl !== undefined) {
      updateValues.pdfUrl = pdfUrl;
    }

    const [updated] = await db
      .update(invoices)
      .set(updateValues)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.orgId, orgId)))
      .returning({
        id: invoices.id,
        orgId: invoices.orgId,
        clientId: invoices.clientId,
        projectId: invoices.projectId,
        number: invoices.number,
        status: invoices.status,
        dueDate: invoices.dueDate,
        currency: invoices.currency,
        amountCents: invoices.amountCents,
        taxRateBasisPoints: invoices.taxRateBasisPoints,
        notes: invoices.notes,
        pdfUrl: invoices.pdfUrl,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
      });

    if (!updated) {
      throw new Error("Invoice not found or update failed.");
    }
    return updated;
  } catch (error) {
    console.error("[updateInvoiceStatusInDb] Database update failed:", error);
    throw error;
  }
}

/**
 * Deletes invoices bulk/single.
 */
export async function deleteInvoicesInDb(orgId: string, invoiceIds: string[]) {
  try {
    const db = await createDrizzleClient();
    return await db.transaction(async (tx) => {
      // Delete line items first
      await tx
        .delete(invoiceLineItems)
        .where(inArray(invoiceLineItems.invoiceId, invoiceIds));

      // Delete invoices
      const deleted = await tx
        .delete(invoices)
        .where(and(inArray(invoices.id, invoiceIds), eq(invoices.orgId, orgId)))
        .returning({ id: invoices.id });

      return deleted;
    });
  } catch (error) {
    console.error("[deleteInvoicesInDb] Database delete failed:", error);
    throw error;
  }
}
