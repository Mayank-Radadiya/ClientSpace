"use client";

import { LayoutGrid, List, Download, Upload, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCents } from "../utils/formatters";

type ClientsHeaderProps = {
  view: "grid" | "list";
  setView: (view: "grid" | "list") => void;
  search: string;
  setSearch: (s: string) => void;
  onAddClient: () => void;
  onExport?: () => void;
  role: "owner" | "admin" | "member" | "client";
  stats: { totalClients: number; activeClients: number; outstandingInvoicesCents: number };
};

export function ClientsHeader({
  view,
  setView,
  search,
  setSearch,
  onAddClient,
  onExport,
  role,
  stats,
}: ClientsHeaderProps) {
  const canManage = role === "owner" || role === "admin";

  return (
    <header className="mb-6">
      {/* Title row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[44px] font-[var(--font-display)] font-extrabold tracking-[-0.02em] text-[#0D0D14] dark:text-[#F2F2F5] leading-none">
            Clients
          </h1>
          <p className="mt-2 text-[13px] font-[var(--font-data)] text-[#6B6B7E]">
            {String(stats.totalClients).padStart(2, "0")} clients · {String(stats.activeClients).padStart(2, "0")} active · {formatCents(stats.outstandingInvoicesCents)} outstanding
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export */}
          {canManage && onExport && (
            <button
              onClick={onExport}
              className="flex h-9 items-center gap-1.5 rounded-full border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] bg-transparent px-4 text-[11px] font-[var(--font-data)] tracking-wide text-[#6B6B7E] transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#0D0D14] dark:hover:text-[#F2F2F5]"
              title="Export clients"
            >
              Export <Download className="h-3.5 w-3.5" />
            </button>
          )}


          {/* Add Client — primary CTA */}
          {canManage && (
            <button
              id="add-client-btn"
              onClick={onAddClient}
              className="group relative ml-4 flex h-9 items-center gap-2 overflow-hidden rounded-[10px] bg-[#3B6FEF] dark:bg-[#4F7FFF] px-4 text-[11px] font-[var(--font-data)] font-bold uppercase tracking-[0.12em] text-white shadow-[0_4px_14px_rgba(79,127,255,0.2)] transition-all hover:bg-[#2B5FDF] dark:hover:bg-[#6B95FF] active:scale-95"
            >
              <Plus className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-[2px]" />
              <span className="relative z-10">Add Client</span>
            </button>
          )}
        </div>
      </div>

      {/* Search + View toggle row */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="group relative flex-1 max-w-sm">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6B7E] transition-colors group-focus-within:text-[#3B6FEF] dark:group-focus-within:text-[#4F7FFF]"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M7 13A6 6 0 1 0 7 1a6 6 0 0 0 0 12zM13 13l2 2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            id="client-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="h-[42px] w-full rounded-[10px] border border-[rgba(0,0,0,0.10)] dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[rgba(255,255,255,0.05)] pl-9 pr-14 text-[13px] font-[var(--font-data)] text-[#0D0D14] dark:text-[#F2F2F5] placeholder-[#6B6B7E] shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-none outline-none transition-all duration-150 focus:border-[#4F7FFF] focus:ring-[3px] focus:ring-[rgba(79,127,255,0.15)]"
          />
          {!search && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B6B7E] transition-opacity group-focus-within:opacity-0">
              <span className="rounded-[4px] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] bg-black/5 dark:bg-white/5 px-1.5 py-0.5 text-[10px] font-bold font-[var(--font-data)]">
                ⌘K
              </span>
            </div>
          )}
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#6B6B7E] transition-colors hover:bg-black/5 hover:text-[#0D0D14] dark:hover:bg-white/5 dark:hover:text-[#F2F2F5]"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1 rounded-xl border border-border bg-muted/50 p-1">
          <button
            id="view-grid-btn"
            onClick={() => setView("grid")}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150",
              view === "grid"
                ? "bg-[rgba(79,127,255,0.15)] text-[#4F7FFF]"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            id="view-list-btn"
            onClick={() => setView("list")}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150",
              view === "list"
                ? "bg-[rgba(79,127,255,0.15)] text-[#4F7FFF]"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
