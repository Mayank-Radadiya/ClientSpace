"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import type { Invoice } from "../../types";
import { formatCurrency } from "../../../utils/formatters";

function statusStyle(s: string) {
  switch (s) {
    case "paid": return { color: "var(--pd-status-done)", bg: "var(--pd-status-done-bg)", label: "Paid" };
    case "sent": return { color: "var(--pd-status-progress)", bg: "var(--pd-status-progress-bg)", label: "Sent" };
    case "draft": return { color: "var(--pd-status-hold)", bg: "var(--pd-status-hold-bg)", label: "Draft" };
    case "overdue": return { color: "var(--pd-status-overdue)", bg: "var(--pd-status-overdue-bg)", label: "Overdue" };
    default: return { color: "var(--pd-text-muted)", bg: "var(--pd-status-hold-bg)", label: s };
  }
}

interface InvoicesDetailTabProps {
  invoices: Invoice[];
  onCreateInvoice: () => void;
}

export function InvoicesDetailTab({ invoices, onCreateInvoice }: InvoicesDetailTabProps) {
  const stats = useMemo(() => {
    const total = invoices.reduce((a, i) => a + i.amount_cents, 0);
    const paid = invoices.filter((i) => i.status === "paid").reduce((a, i) => a + i.amount_cents, 0);
    const outstanding = total - paid;
    return { total, paid, outstanding };
  }, [invoices]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--pd-text-primary)" }}>Invoices</h2>
        <button onClick={onCreateInvoice} className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-all"
          style={{ background: "var(--pd-accent)", color: "#fff", fontFamily: "var(--font-data)", fontSize: 13, fontWeight: 500 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--pd-accent-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--pd-accent)"; }}>
          <Plus size={14} />Create Invoice
        </button>
      </div>

      {/* Stats mini-row */}
      <div className="mb-5 flex gap-4">
        {[
          { label: "Total Invoiced", value: formatCurrency(stats.total) },
          { label: "Paid", value: formatCurrency(stats.paid) },
          { label: "Outstanding", value: formatCurrency(stats.outstanding) },
        ].map((s) => (
          <div key={s.label} className="flex-1 rounded-xl px-4 py-3" style={{ background: "var(--pd-elevated)", border: "1px solid var(--pd-border)" }}>
            <p style={{ fontFamily: "var(--font-data)", fontSize: 11, color: "var(--pd-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
            <p style={{ fontFamily: "var(--font-metrics)", fontSize: 24, fontWeight: 600, color: "var(--pd-text-primary)", marginTop: 2 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p style={{ fontFamily: "var(--font-data)", fontSize: 14, color: "var(--pd-text-secondary)", marginBottom: 8 }}>No invoices for this project</p>
          <button onClick={onCreateInvoice} className="rounded-full px-4 py-1.5"
            style={{ background: "var(--pd-accent)", color: "#fff", fontFamily: "var(--font-data)", fontSize: 13 }}>Create Invoice</button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--pd-border)" }}>
          {/* Header */}
          <div className="grid grid-cols-6 gap-2 px-4 py-2.5" style={{ background: "var(--pd-elevated)", borderBottom: "1px solid var(--pd-border)" }}>
            {["Invoice #", "Issued", "Due", "Amount", "Status", ""].map((h) => (
              <span key={h} style={{ fontFamily: "var(--font-data)", fontSize: 11, color: "var(--pd-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
            ))}
          </div>
          {/* Rows */}
          {invoices.map((inv) => {
            const st = statusStyle(inv.status);
            return (
              <div key={inv.id} className="grid grid-cols-6 items-center gap-2 px-4 py-3 transition-colors"
                style={{ borderBottom: "1px solid var(--pd-divider)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--pd-accent-subtle)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <span style={{ fontFamily: "var(--font-data)", fontSize: 13, color: "var(--pd-accent)", fontWeight: 500 }}>INV-{inv.number}</span>
                <span style={{ fontFamily: "var(--font-data)", fontSize: 13, color: "var(--pd-text-secondary)" }}>
                  {new Date(inv.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span style={{ fontFamily: "var(--font-data)", fontSize: 13, color: "var(--pd-text-secondary)" }}>
                  {inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                </span>
                <span style={{ fontFamily: "var(--font-data)", fontSize: 13, color: "var(--pd-text-primary)", fontWeight: 500 }}>{formatCurrency(inv.amount_cents)}</span>
                <span className="inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5"
                  style={{ background: st.bg, color: st.color, fontFamily: "var(--font-data)", fontSize: 11 }}>
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: st.color }} />
                  {st.label}
                </span>
                <span />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
