"use server";

import { revalidateTag } from "next/cache";
import { and, count, eq, gte } from "drizzle-orm";
import { invoices, organizations, clients, projects } from "@/db/schema";
import { withRLS } from "@/db/createDrizzleClient";
import { getSessionContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  calculateTotals,
  canTransition,
  createInvoiceSchema,
  type CreateInvoiceInput,
  type InvoiceStatus,
  updateInvoiceStatusSchema,
  type UpdateInvoiceStatusInput,
} from "../schemas";
import { createInvoiceInDb, updateInvoiceStatusInDb, deleteInvoicesInDb } from "./mutations";

export type ActionState<T = undefined> = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: T;
};

export type CreateInvoiceResult = {
  invoiceId: string;
  invoiceNumber: number;
  formattedNumber: string;
  totalCents: number;
};

/**
 * Server Action to atomically create a new invoice and trigger tag invalidation.
 */
export async function createInvoice(
  input: CreateInvoiceInput,
): Promise<ActionState<CreateInvoiceResult>> {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "You must be logged in." };
  if (ctx.role !== "owner" && ctx.role !== "admin") {
    return { error: "Only Admins and Owners can create invoices." };
  }

  const parsed = createInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const data = parsed.data;

  // Plan limit check & FK check
  const checkResult = await withRLS(ctx, async (tx) => {
    const org = await tx.query.organizations.findFirst({
      where: eq(organizations.id, ctx.orgId),
      columns: { plan: true },
    });

    if (org?.plan === "starter") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [countResult] = await tx
        .select({ value: count() })
        .from(invoices)
        .where(
          and(
            eq(invoices.orgId, ctx.orgId),
            gte(invoices.createdAt, startOfMonth),
          ),
        );

      if ((countResult?.value ?? 0) >= 5) {
        return {
          error: "You have reached the 5 invoice/month limit on the Starter plan. Upgrade to Pro to create more invoices.",
        };
      }
    }

    const client = await tx.query.clients.findFirst({
      where: and(eq(clients.id, data.clientId), eq(clients.orgId, ctx.orgId)),
      columns: { id: true },
    });
    if (!client) return { error: "Client not found in your organization." };

    if (data.projectId) {
      const project = await tx.query.projects.findFirst({
        where: and(eq(projects.id, data.projectId), eq(projects.orgId, ctx.orgId)),
        columns: { id: true },
      });
      if (!project) return { error: "Project not found in your organization." };
    }

    return null;
  });

  if (checkResult && checkResult.error) {
    return { error: checkResult.error };
  }

  try {
    const newInvoice = await createInvoiceInDb(ctx.orgId, {
      clientId: data.clientId,
      projectId: data.projectId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      currency: data.currency,
      taxRateBasisPoints: data.taxRateBasisPoints,
      notes: data.notes,
      items: data.items,
    });

    // Invalidate list queries
    revalidateTag(`org-${ctx.orgId}-invoices`, "max");

    return {
      success: true,
      data: {
        invoiceId: newInvoice.id,
        invoiceNumber: newInvoice.number,
        formattedNumber: `INV-${newInvoice.number}`,
        totalCents: newInvoice.amountCents,
      },
    };
  } catch (err: any) {
    console.error("[createInvoice] Action error:", err);
    return { error: err.message || "Failed to save invoice. Please try again." };
  }
}

/**
 * Server Action to transition invoice status, caching PDFs, and invalidating tags.
 */
export async function updateInvoiceStatus(
  input: UpdateInvoiceStatusInput,
): Promise<ActionState> {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "You must be logged in." };
  if (ctx.role !== "owner" && ctx.role !== "admin") {
    return { error: "Only Admins and Owners can update invoice status." };
  }

  const parsed = updateInvoiceStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input." };
  }
  const { invoiceId, status: newStatus } = parsed.data;

  // Validate state machine
  const validation = await withRLS(ctx, async (tx) => {
    const invoice = await tx.query.invoices.findFirst({
      where: and(eq(invoices.id, invoiceId), eq(invoices.orgId, ctx.orgId)),
      columns: { id: true, status: true, pdfUrl: true, number: true },
    });
    if (!invoice) return { error: "Invoice not found." };
    if (!canTransition(invoice.status as InvoiceStatus, newStatus)) {
      return { error: `Cannot transition invoice from "${invoice.status}" to "${newStatus}".` };
    }
    return { invoice };
  });

  if (validation.error || !validation.invoice) {
    return { error: validation.error };
  }
  const currentInvoice = validation.invoice;

  let pdfPath: string | undefined = undefined;

  // PDF caching on -> "sent"
  if (newStatus === "sent" && !currentInvoice.pdfUrl) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const targetPdfPath = `invoices/${ctx.orgId}/${invoiceId}.pdf`;

      const pdfResponse = await fetch(
        `${baseUrl}/api/invoices/${invoiceId}/pdf`,
        {
          headers: {
            "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
          },
          signal: AbortSignal.timeout(30_000),
        },
      );

      if (pdfResponse.ok) {
        const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
        const supabase = await createClient();
        const { error: uploadError } = await supabase.storage
          .from("project-files")
          .upload(targetPdfPath, pdfBuffer, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (!uploadError) {
          pdfPath = targetPdfPath;
        }
      }
    } catch (err) {
      console.error("[updateInvoiceStatus] PDF caching error:", err);
    }
  }

  try {
    await updateInvoiceStatusInDb(ctx.orgId, invoiceId, newStatus, pdfPath);

    // Revalidate list & detail cache
    revalidateTag(`org-${ctx.orgId}-invoices`, "max");
    revalidateTag(`org-${ctx.orgId}-invoice-${invoiceId}`, "max");

    return { success: true };
  } catch (error: any) {
    console.error("[updateInvoiceStatus] Mutation failed:", error);
    return { error: error.message || "Failed to update invoice status." };
  }
}

export async function bulkUpdateInvoiceStatus(input: {
  invoiceIds: string[];
  status: "sent" | "paid";
}): Promise<ActionState> {
  const { invoiceIds, status } = input;
  if (!invoiceIds.length) return { success: true };

  let allSuccess = true;
  for (const id of invoiceIds) {
    const res = await updateInvoiceStatus({ invoiceId: id, status });
    if (!res.success) {
      allSuccess = false;
      console.error(`Failed to update invoice ${id}:`, res.error);
    }
  }

  if (!allSuccess) {
    return { error: "Some invoices could not be updated." };
  }
  return { success: true };
}

/**
 * Server Action to delete invoices bulk/single.
 */
export async function deleteInvoices(invoiceIds: string[]): Promise<ActionState> {
  if (!invoiceIds.length) return { success: true };

  const ctx = await getSessionContext();
  if (!ctx) return { error: "You must be logged in." };
  if (ctx.role !== "owner" && ctx.role !== "admin") {
    return { error: "Only Admins and Owners can delete invoices." };
  }

  try {
    await deleteInvoicesInDb(ctx.orgId, invoiceIds);

    // Revalidate lists & detail caches
    revalidateTag(`org-${ctx.orgId}-invoices`, "max");
    for (const id of invoiceIds) {
      revalidateTag(`org-${ctx.orgId}-invoice-${id}`, "max");
    }

    return { success: true };
  } catch (error: any) {
    console.error("[deleteInvoices] Action error:", error);
    return { error: error.message || "Failed to delete invoices." };
  }
}
