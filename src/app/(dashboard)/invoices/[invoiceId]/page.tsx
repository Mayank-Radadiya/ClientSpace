// src/app/(dashboard)/invoices/[invoiceId]/page.tsx
// Invoice detail page — renders full invoice info with line items and status actions.

import { redirect } from "next/navigation";
import { createTRPCContext } from "@/lib/trpc/init";
import { getInvoiceDetail } from "@/features/invoices/server/queries";
import { InvoiceDetailPageClient } from "@/features/invoices/components/InvoiceDetailPageClient";

// FIX: Missing invoice detail page — no route existed for viewing individual invoices

export const metadata = { title: "Invoice Details" };

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  const ctx = await createTRPCContext();
  if (!ctx || !ctx.orgId) redirect("/onboarding");

  return <InvoiceDetailPageClient orgId={ctx.orgId} invoiceId={invoiceId} />;
}
