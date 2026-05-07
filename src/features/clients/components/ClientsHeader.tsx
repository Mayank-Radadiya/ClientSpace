"use client";

import { LayoutGrid, List, Download, Upload, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type ClientsHeaderProps = {
  view: "grid" | "list";
  setView: (view: "grid" | "list") => void;
  search: string;
  setSearch: (s: string) => void;
  onAddClient: () => void;
  onInviteClient: () => void;
  onExport?: () => void;
  role: "owner" | "admin" | "member" | "client";
};

export function ClientsHeader({
  view,
  setView,
  search,
  setSearch,
  onAddClient,
  onInviteClient,
  onExport,
  role,
}: ClientsHeaderProps) {
  const canManage = role === "owner" || role === "admin";

  return (
    <header className="mb-6">
      {/* Title row */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground font-[var(--font-display)]">
            Clients
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground font-[var(--font-data)]">
            Manage your client relationships, projects, and invoices
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export */}
          {canManage && onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-1.5 rounded-xl border border-[rgba(255,255,255,0.08)] px-3.5 py-2 text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground transition-all hover:border-[rgba(255,255,255,0.15)] hover:text-foreground font-[var(--font-data)]"
              title="Export clients"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          )}

          {/* Invite */}
          {canManage && (
            <button
              onClick={onInviteClient}
              className="flex items-center gap-1.5 rounded-xl border border-[rgba(255,255,255,0.08)] px-3.5 py-2 text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground transition-all hover:border-[rgba(255,255,255,0.15)] hover:text-foreground font-[var(--font-data)]"
              title="Invite by email"
            >
              <Upload className="h-3.5 w-3.5" />
              Invite
            </button>
          )}

          {/* Add Client — primary CTA */}
          {canManage && (
            <button
              id="add-client-btn"
              onClick={onAddClient}
              className="group relative overflow-hidden flex items-center gap-2 rounded-xl bg-[#4F7FFF] px-5 py-2.5 text-[12px] font-bold tracking-[0.12em] uppercase text-white shadow-lg shadow-[rgba(79,127,255,0.25)] transition-all hover:bg-[#6B95FF] hover:shadow-[rgba(79,127,255,0.35)] hover:scale-[1.02] active:scale-95 font-[var(--font-data)]"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
              <Plus className="h-4 w-4" />
              <span className="relative z-10">Add Client</span>
            </button>
          )}
        </div>
      </div>

      {/* Search + View toggle row */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
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
            className="h-10 w-full rounded-xl border border-border bg-muted/50 pl-10 pr-4 text-sm font-[var(--font-data)] text-foreground placeholder-muted-foreground outline-none transition-all focus:border-[#4F7FFF] focus:bg-[rgba(79,127,255,0.04)] focus:ring-0"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
