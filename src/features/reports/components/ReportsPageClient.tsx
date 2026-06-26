"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  TrendingUp,
  Clock,
  DollarSign,
  UserCheck,
  Calendar,
  Download,
  Printer,
  ChevronDown,
  Building,
  ArrowRight,
  TrendingDown,
  BarChart as BarIcon
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { format, differenceInDays, parseISO, startOfMonth, endOfMonth, subDays } from "date-fns";
import { gooeyToast } from "goey-toast";

import { PageLayout } from "@/app/(dashboard)/_components/PageLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Client {
  id: string;
  companyName: string | null;
  contactName: string | null;
  email: string;
}

interface Invoice {
  id: string;
  number: number;
  clientId: string;
  projectId: string | null;
  status: string; // draft, sent, paid, overdue
  amountCents: number;
  currency: string;
  dueDate: string | null;
  createdAt: string;
  paidAt: string | null;
  client?: Client | null;
}

interface ReportsPageClientProps {
  clients: Client[];
  invoices: Invoice[];
}

export function ReportsPageClient({
  clients,
  invoices,
}: ReportsPageClientProps) {
  const [activeTab, setActiveTab] = useState<"revenue" | "aging" | "clients">("revenue");
  const [dateRange, setDateRange] = useState<"30" | "90" | "365" | "all">("all");
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter invoices by Date Range & Client
  const filteredInvoices = useMemo(() => {
    let list = [...invoices];

    // Filter by client
    if (selectedClientId !== "all") {
      list = list.filter(inv => inv.clientId === selectedClientId);
    }

    // Filter by date range
    if (dateRange !== "all") {
      const days = parseInt(dateRange);
      const cutoffDate = subDays(new Date(), days);
      list = list.filter(inv => new Date(inv.createdAt) >= cutoffDate);
    }

    return list;
  }, [invoices, dateRange, selectedClientId]);

  // ─── Stat Calculations ────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    let totalPaidCents = 0;
    let totalOutstandingCents = 0;
    let totalOverdueCents = 0;
    let totalInvoicedCents = 0;

    const paidInvoices = filteredInvoices.filter(inv => inv.status === "paid");
    const outstandingInvoices = filteredInvoices.filter(inv => inv.status === "sent" || inv.status === "overdue");
    const overdueInvoices = filteredInvoices.filter(inv => inv.status === "overdue");

    paidInvoices.forEach(inv => {
      totalPaidCents += inv.amountCents;
      totalInvoicedCents += inv.amountCents;
    });

    outstandingInvoices.forEach(inv => {
      totalOutstandingCents += inv.amountCents;
      totalInvoicedCents += inv.amountCents;
    });

    overdueInvoices.forEach(inv => {
      totalOverdueCents += inv.amountCents;
    });

    const avgInvoiceValueCents = filteredInvoices.length > 0 
      ? Math.round(totalInvoicedCents / filteredInvoices.length) 
      : 0;

    return {
      totalPaid: totalPaidCents / 100,
      totalOutstanding: totalOutstandingCents / 100,
      totalOverdue: totalOverdueCents / 100,
      avgInvoiceValue: avgInvoiceValueCents / 100,
      invoicesCount: filteredInvoices.length,
      paidCount: paidInvoices.length,
      outstandingCount: outstandingInvoices.length,
      overdueCount: overdueInvoices.length,
    };
  }, [filteredInvoices]);

  // ─── Revenue Over Time Chart Data ─────────────────────────────────────────────

  const chartData = useMemo(() => {
    const paidInvoices = filteredInvoices.filter(inv => inv.status === "paid" && inv.paidAt);
    
    // Group paid invoices by month
    const groups: Record<string, number> = {};
    
    paidInvoices.forEach(inv => {
      const date = parseISO(inv.paidAt!);
      const monthKey = format(date, "MMM yyyy");
      groups[monthKey] = (groups[monthKey] || 0) + (inv.amountCents / 100);
    });

    // Sort chronologically (assuming current year or standard order)
    return Object.entries(groups).map(([month, amount]) => ({
      name: month,
      revenue: parseFloat(amount.toFixed(2)),
    })).reverse(); // reverse if keys were added in chronological order
  }, [filteredInvoices]);

  // ─── Outstanding Aging Buckets ────────────────────────────────────────────────

  const agingBuckets = useMemo(() => {
    const outstanding = filteredInvoices.filter(inv => inv.status === "sent" || inv.status === "overdue");
    
    let bucket1 = 0; // 0-30 days
    let bucket2 = 0; // 31-60 days
    let bucket3 = 0; // 60+ days

    const today = new Date();

    outstanding.forEach(inv => {
      if (inv.dueDate) {
        const dueDate = parseISO(inv.dueDate);
        const daysPastDue = differenceInDays(today, dueDate);

        if (daysPastDue <= 30) {
          bucket1 += inv.amountCents;
        } else if (daysPastDue <= 60) {
          bucket2 += inv.amountCents;
        } else {
          bucket3 += inv.amountCents;
        }
      } else {
        // No due date, place in 0-30 days bucket
        bucket1 += inv.amountCents;
      }
    });

    const total = bucket1 + bucket2 + bucket3;

    return [
      { name: "0-30 Days Due", value: parseFloat((bucket1 / 100).toFixed(2)), percent: total > 0 ? (bucket1 / total) * 100 : 0 },
      { name: "31-60 Days Overdue", value: parseFloat((bucket2 / 100).toFixed(2)), percent: total > 0 ? (bucket2 / total) * 100 : 0 },
      { name: "60+ Days Overdue", value: parseFloat((bucket3 / 100).toFixed(2)), percent: total > 0 ? (bucket3 / total) * 100 : 0 },
    ];
  }, [filteredInvoices]);

  // ─── Client Billing Leaderboard ────────────────────────────────────────────────

  const clientLeaderboard = useMemo(() => {
    const clientsMap: Record<string, { name: string; paid: number; outstanding: number; total: number }> = {};

    filteredInvoices.forEach(inv => {
      const clientId = inv.clientId;
      const clientName = inv.client?.companyName || inv.client?.contactName || inv.client?.email || "Unknown Client";

      if (!clientsMap[clientId]) {
        clientsMap[clientId] = { name: clientName, paid: 0, outstanding: 0, total: 0 };
      }

      const amount = inv.amountCents / 100;
      clientsMap[clientId].total += amount;
      if (inv.status === "paid") {
        clientsMap[clientId].paid += amount;
      } else if (inv.status === "sent" || inv.status === "overdue") {
        clientsMap[clientId].outstanding += amount;
      }
    });

    return Object.values(clientsMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // top 10 clients
  }, [filteredInvoices]);

  // ─── Actions ──────────────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      gooeyToast.error("No data available to export.");
      return;
    }

    const headers = ["Invoice Number", "Client", "DueDate", "Status", "Amount", "Currency", "Paid Date"];
    const rows = filteredInvoices.map(inv => [
      `INV-${inv.number}`,
      inv.client?.companyName || inv.client?.contactName || inv.client?.email || "Unknown",
      inv.dueDate || "N/A",
      inv.status,
      (inv.amountCents / 100).toFixed(2),
      inv.currency,
      inv.paidAt ? format(parseISO(inv.paidAt), "yyyy-MM-dd") : "N/A"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    gooeyToast.success("Report data exported to CSV!");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageLayout bleed>
      {/* CSS print override styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div id="print-area" className="space-y-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--inv-divider)] pb-6 no-print">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--inv-text-primary)]">
              Financial Reports
            </h1>
            <p className="font-sans text-sm text-[var(--inv-text-muted)] mt-1">
              View agency revenue, outstanding aging balances, and client value rankings.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-9 rounded-xl border-[var(--inv-input-border)] text-xs text-[var(--inv-text-muted)] hover:bg-[var(--inv-surface-elevated)]"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Print Report
            </Button>
            <Button
              onClick={handleExportCSV}
              className="group from-primary shadow-primary/25 hover:shadow-primary/40 relative overflow-hidden rounded-xl bg-linear-to-br to-indigo-600 px-5 h-9 font-semibold text-xs tracking-wide text-white shadow-md transition-all hover:scale-[1.01] active:scale-95"
            >
              <Download className="h-3.5 w-3.5 mr-1.5 text-white" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Dynamic header for printing */}
        <div className="hidden print:block border-b border-zinc-200 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-zinc-950">ClientSpace Financial Report</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Generated on {format(new Date(), "MMMM d, yyyy")}
          </p>
        </div>

        {/* CONTROLS BAR */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-[var(--inv-modal-section)] p-4 rounded-2xl border border-[var(--inv-divider)] no-print">
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Selector */}
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-[var(--inv-text-muted)] uppercase">Date Range</Label>
              <Select value={dateRange} onValueChange={(val: any) => setDateRange(val)}>
                <SelectTrigger className="inv-input-focus font-dm-mono h-9 w-[150px] rounded-xl border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] text-xs text-[var(--inv-text-primary)]">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent className="font-dm-mono border-[var(--inv-divider)] bg-[var(--inv-modal-section)] text-xs shadow-xl">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="365">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client Selector */}
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-[var(--inv-text-muted)] uppercase">Filter by Client</Label>
              <Select value={selectedClientId} onValueChange={(val) => setSelectedClientId(val || "all")}>
                <SelectTrigger className="inv-input-focus font-dm-mono h-9 w-[180px] rounded-xl border-[var(--inv-input-border)] bg-[var(--inv-input-bg)] text-xs text-[var(--inv-text-primary)]">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent className="font-dm-mono border-[var(--inv-divider)] bg-[var(--inv-modal-section)] text-xs shadow-xl max-h-[200px]">
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName || c.contactName || c.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* METRICS CARDS GRID */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Revenue Paid Card */}
          <div className="rounded-2xl border border-[var(--inv-divider)] bg-[var(--inv-surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--inv-text-muted)] uppercase">Revenue Paid</span>
              <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-500">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="font-barlow-condensed text-2xl font-bold text-[var(--inv-text-primary)]">
                ${stats.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-[var(--inv-text-muted)] font-medium mt-1">
                From {stats.paidCount} settled invoices.
              </p>
            </div>
          </div>

          {/* Outstanding Balance Card */}
          <div className="rounded-2xl border border-[var(--inv-divider)] bg-[var(--inv-surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--inv-text-muted)] uppercase">Outstanding</span>
              <div className="rounded-lg bg-indigo-500/10 p-1.5 text-indigo-500">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="font-barlow-condensed text-2xl font-bold text-[var(--inv-text-primary)]">
                ${stats.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-[var(--inv-text-muted)] font-medium mt-1">
                From {stats.outstandingCount} outstanding invoices.
              </p>
            </div>
          </div>

          {/* Overdue Balance Card */}
          <div className="rounded-2xl border border-[var(--inv-divider)] bg-[var(--inv-surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--inv-text-muted)] uppercase">Overdue Balance</span>
              <div className="rounded-lg bg-rose-500/10 p-1.5 text-rose-500">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="font-barlow-condensed text-2xl font-bold text-[var(--inv-text-primary)]">
                ${stats.totalOverdue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-[var(--inv-text-muted)] font-medium mt-1">
                From {stats.overdueCount} overdue invoices.
              </p>
            </div>
          </div>

          {/* Average Invoice Value */}
          <div className="rounded-2xl border border-[var(--inv-divider)] bg-[var(--inv-surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--inv-text-muted)] uppercase">Avg Invoice</span>
              <div className="rounded-lg bg-sky-500/10 p-1.5 text-sky-500">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="font-barlow-condensed text-2xl font-bold text-[var(--inv-text-primary)]">
                ${stats.avgInvoiceValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-[var(--inv-text-muted)] font-medium mt-1">
                Calculated across {stats.invoicesCount} total invoices.
              </p>
            </div>
          </div>
        </div>

        {/* TABS BAR (no-print) */}
        <div className="flex gap-2 border-b border-[var(--inv-divider)] pb-2 overflow-x-auto hide-scrollbar no-print">
          <button
            onClick={() => setActiveTab("revenue")}
            className={cn(
              "px-4 py-2 text-xs font-semibold tracking-wide uppercase rounded-full border transition-all",
              activeTab === "revenue"
                ? "bg-[var(--inv-accent-primary)] text-white border-[var(--inv-accent-primary)] shadow-sm"
                : "border-[var(--inv-divider)] bg-[var(--inv-surface)] text-[var(--inv-text-muted)] hover:text-[var(--inv-text-primary)]"
            )}
          >
            Revenue Overview
          </button>
          <button
            onClick={() => setActiveTab("aging")}
            className={cn(
              "px-4 py-2 text-xs font-semibold tracking-wide uppercase rounded-full border transition-all",
              activeTab === "aging"
                ? "bg-[var(--inv-accent-primary)] text-white border-[var(--inv-accent-primary)] shadow-sm"
                : "border-[var(--inv-divider)] bg-[var(--inv-surface)] text-[var(--inv-text-muted)] hover:text-[var(--inv-text-primary)]"
            )}
          >
            Outstanding Aging
          </button>
          <button
            onClick={() => setActiveTab("clients")}
            className={cn(
              "px-4 py-2 text-xs font-semibold tracking-wide uppercase rounded-full border transition-all",
              activeTab === "clients"
                ? "bg-[var(--inv-accent-primary)] text-white border-[var(--inv-accent-primary)] shadow-sm"
                : "border-[var(--inv-divider)] bg-[var(--inv-surface)] text-[var(--inv-text-muted)] hover:text-[var(--inv-text-primary)]"
            )}
          >
            Client Rankings
          </button>
        </div>

        {/* REPORT CONTENT AREA */}
        <div className="bg-[var(--inv-surface)] border border-[var(--inv-divider)] rounded-2xl p-6 shadow-sm min-h-[300px]">
          {/* TAB 1: REVENUE OVERVIEW */}
          {activeTab === "revenue" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-[var(--inv-text-primary)]">
                  Revenue Collection (Paid Invoices)
                </h3>
              </div>

              {/* Chart */}
              {isMounted && chartData.length > 0 ? (
                <div className="h-64 w-full no-print">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                      <ChartTooltip
                        contentStyle={{
                          background: "var(--inv-surface-elevated)",
                          borderColor: "var(--inv-divider)",
                          borderRadius: "10px",
                          color: "var(--inv-text-primary)"
                        }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#6C63FF" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-xs text-[var(--inv-text-muted)]">
                  No historical revenue data to display.
                </div>
              )}

              {/* Detailed Paid Invoices List */}
              <div className="space-y-3">
                <h4 className="font-display text-xs font-semibold text-[var(--inv-text-primary)] uppercase tracking-wide">
                  Recent Paid Invoices
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--inv-divider)] text-[var(--inv-text-muted)] font-dm-mono uppercase">
                        <th className="py-2.5">Invoice</th>
                        <th className="py-2.5">Client</th>
                        <th className="py-2.5">Paid At</th>
                        <th className="py-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--inv-divider)] font-medium text-[var(--inv-text-primary)]">
                      {filteredInvoices
                        .filter(inv => inv.status === "paid")
                        .slice(0, 5)
                        .map(inv => (
                          <tr key={inv.id}>
                            <td className="py-3 font-dm-mono">INV-{inv.number}</td>
                            <td className="py-3 truncate max-w-[150px]">
                              {inv.client?.companyName || inv.client?.contactName || "—"}
                            </td>
                            <td className="py-3 text-[var(--inv-text-muted)]">
                              {inv.paidAt ? format(parseISO(inv.paidAt), "MMM d, yyyy") : "—"}
                            </td>
                            <td className="py-3 text-right font-dm-mono">
                              ${(inv.amountCents / 100).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      {filteredInvoices.filter(inv => inv.status === "paid").length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-[var(--inv-text-muted)]">
                            No paid invoices found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OUTSTANDING AGING */}
          {activeTab === "aging" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-sm font-bold text-[var(--inv-text-primary)]">
                  Outstanding Aging Summary
                </h3>
                <p className="text-xs text-[var(--inv-text-muted)] mt-1">
                  Outstanding invoices broken down by age past due.
                </p>
              </div>

              {/* Progress Meters */}
              <div className="space-y-4 max-w-xl">
                {agingBuckets.map(bucket => (
                  <div key={bucket.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[var(--inv-text-primary)]">{bucket.name}</span>
                      <span className="text-[var(--inv-text-muted)]">
                        ${bucket.value.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({bucket.percent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-3 w-full bg-[var(--inv-input-bg)] rounded-full overflow-hidden border border-[var(--inv-divider)]">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          bucket.name.includes("60+") 
                            ? "bg-rose-500" 
                            : bucket.name.includes("31-60") 
                              ? "bg-amber-500" 
                              : "bg-indigo-500"
                        )}
                        style={{ width: `${bucket.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Aging breakdown chart */}
              {isMounted && agingBuckets.some(b => b.value > 0) ? (
                <div className="h-56 w-full max-w-md no-print pt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agingBuckets}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {agingBuckets.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 2 ? "#f43f5e" : index === 1 ? "#f59e0b" : "#6C63FF"} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 3: CLIENT RANKINGS */}
          {activeTab === "clients" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-sm font-bold text-[var(--inv-text-primary)]">
                  Top Billing Clients
                </h3>
                <p className="text-xs text-[var(--inv-text-muted)] mt-1">
                  Clients ranked by total invoiced volume (Paid + Outstanding).
                </p>
              </div>

              {/* Leaderboard Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--inv-divider)] text-[var(--inv-text-muted)] font-dm-mono uppercase">
                      <th className="py-2.5">Rank</th>
                      <th className="py-2.5">Client</th>
                      <th className="py-2.5 text-right">Paid</th>
                      <th className="py-2.5 text-right">Outstanding</th>
                      <th className="py-2.5 text-right">Total Invoiced</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--inv-divider)] font-medium text-[var(--inv-text-primary)]">
                    {clientLeaderboard.map((item, index) => (
                      <tr key={item.name}>
                        <td className="py-3.5 font-dm-mono text-[var(--inv-text-muted)]">
                          #{index + 1}
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <Building className="h-3.5 w-3.5 text-[var(--inv-text-muted)]" />
                            <span className="font-semibold">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-right text-emerald-500 font-dm-mono">
                          ${item.paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 text-right text-indigo-500 font-dm-mono">
                          ${item.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 text-right font-bold font-dm-mono">
                          ${item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    {clientLeaderboard.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-[var(--inv-text-muted)]">
                          No client data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
