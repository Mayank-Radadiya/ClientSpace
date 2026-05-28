"use client";
// src/features/projects/components/tabs/InvoicesTab.tsx
// Invoices list for a project with status badges and totals.

import { useMemo } from "react";
import { motion } from "framer-motion";
import { DollarSign, ExternalLink, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  draft:   { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", label: "Draft" },
  sent:    { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-400", label: "Sent" },
  paid:    { bg: "bg-green-50 dark:bg-green-950/40", text: "text-green-700 dark:text-green-400", label: "Paid" },
  overdue: { bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-700 dark:text-red-400", label: "Overdue" },
} as const;

interface InvoicesTabProps {
  projectId: string;
  currency?: string;
}

export function InvoicesTab({ projectId, currency = "USD" }: InvoicesTabProps) {
  const { data, isLoading } = trpc.invoices.list.useQuery(
    { projectId },
    { staleTime: Infinity, gcTime: 10 * 60 * 1000 },
  );

  const invoices = data?.items ?? [];

  const totals = useMemo(() => {
    const total = invoices.reduce((s, i) => s + i.amountCents, 0);
    const paid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amountCents, 0);
    const overdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amountCents, 0);
    return { total, paid, outstanding: total - paid, overdue };
  }, [invoices]);

  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(cents / 100);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" />
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <DollarSign size={32} className="opacity-30" />
        <p className="text-sm">No invoices for this project.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Total", value: fmt(totals.total), color: "text-foreground" },
          { label: "Paid", value: fmt(totals.paid), color: "text-green-600" },
          { label: "Outstanding", value: fmt(totals.outstanding), color: "text-amber-600" },
          ...(totals.overdue > 0
            ? [{ label: "Overdue", value: fmt(totals.overdue), color: "text-red-600" }]
            : []),
        ].map((chip) => (
          <div key={chip.label} className="flex flex-col rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm">
            <span className="text-[11px] text-muted-foreground">{chip.label}</span>
            <span className={cn("text-base font-semibold tabular-nums", chip.color)}>{chip.value}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm" aria-label="Project invoices">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["#", "Status", "Due", "Amount", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((inv, i) => {
              const st = STATUS_STYLES[inv.status];
              return (
                <motion.tr
                  key={inv.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3 tabular-nums text-foreground">
                    #{inv.number}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        st.bg,
                        st.text,
                      )}
                    >
                      {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {inv.dueDate
                      ? new Date(inv.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium tabular-nums text-foreground">
                    {fmt(inv.amountCents)}
                  </td>
                  <td className="px-4 py-3">
                    {inv.pdfUrl && (
                      <a
                        href={inv.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        aria-label={`View invoice #${inv.number} PDF`}
                      >
                        PDF <ExternalLink size={11} />
                      </a>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
