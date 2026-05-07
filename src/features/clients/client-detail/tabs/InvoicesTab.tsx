"use client";

import { cn } from "@/lib/utils";
import { formatCents } from "../../utils/formatters";

const STATUS_COLOR: Record<string, { text: string; bg: string }> = {
  draft: { text: "text-[#6B6B7E]", bg: "bg-[rgba(107,107,126,0.1)]" },
  sent: { text: "text-[#4F7FFF]", bg: "bg-[rgba(79,127,255,0.1)]" },
  paid: { text: "text-[#22C55E]", bg: "bg-[rgba(34,197,94,0.1)]" },
  overdue: { text: "text-[#EF4444]", bg: "bg-[rgba(239,68,68,0.1)]" },
  cancelled: { text: "text-[#3D3D4E]", bg: "bg-[rgba(61,61,78,0.1)]" },
};

type Invoice = { id: string; number: number; amountCents: number; status: string; dueDate: Date | string | null };

type InvoicesTabProps = {
  clientId: string;
  query: { data?: Invoice[] | null; isLoading?: boolean };
};

export function InvoicesTab({ query }: InvoicesTabProps) {
  const invoices = query.data ?? [];

  if (query.isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>;
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16">
        <p className="text-[13px] font-medium text-muted-foreground font-[var(--font-data)]">No invoices yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-[rgba(255,255,255,0.01)]">
            <th className="px-5 py-3 text-left text-[9px] font-bold tracking-[0.22em] text-muted-foreground uppercase font-[var(--font-data)]">Invoice</th>
            <th className="px-5 py-3 text-left text-[9px] font-bold tracking-[0.22em] text-muted-foreground uppercase font-[var(--font-data)]">Status</th>
            <th className="px-5 py-3 text-right text-[9px] font-bold tracking-[0.22em] text-muted-foreground uppercase font-[var(--font-data)]">Amount</th>
            <th className="px-5 py-3 text-left text-[9px] font-bold tracking-[0.22em] text-muted-foreground uppercase font-[var(--font-data)]">Due</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const s = STATUS_COLOR[inv.status] ?? { text: "text-muted-foreground", bg: "bg-muted/30" };
            const dueDateStr = inv.dueDate
              ? (inv.dueDate instanceof Date ? inv.dueDate.toLocaleDateString() : new Date(inv.dueDate).toLocaleDateString())
              : "—";
            return (
              <tr key={inv.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                <td className="px-5 py-3 text-[13px] font-medium text-foreground font-[var(--font-data)]">
                  INV-{String(inv.number).padStart(4, "0")}
                </td>
                <td className="px-5 py-3">
                  <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase font-[var(--font-data)]", s.text, s.bg)}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-[14px] font-[var(--font-metrics)] text-foreground">
                  {formatCents(inv.amountCents)}
                </td>
                <td className="px-5 py-3 text-[11px] text-muted-foreground font-[var(--font-data)]">{dueDateStr}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
