"use client";

import { Calendar, ChevronDown, Download, Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InvoiceFilterStatus } from "../hooks/useInvoiceFilters";
import { STATUS_LABELS } from "../schemas";
import { motion } from "motion/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

type InvoiceUiStatus = InvoiceFilterStatus;

interface StatusCount {
  key: InvoiceUiStatus;
  label: string;
  count: number;
  disabled?: boolean;
}

interface InvoiceToolbarProps {
  title?: string;
  subtitle?: string;
  search: string;
  onSearchChange: (value: string) => void;
  status: InvoiceFilterStatus;
  onStatusChange: (value: InvoiceFilterStatus) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  totalCount?: number;
  filteredCount?: number;
  statusCounts?: StatusCount[];
  sortBy?: "number" | "issued" | "due" | "amount";
  sortDir?: "asc" | "desc";
  onSortByChange?: (value: "number" | "issued" | "due" | "amount") => void;
  onExportCSV?: () => void;
  children?: React.ReactNode;
}

function renderSortText(sortBy: "number" | "issued" | "due" | "amount") {
  if (sortBy === "number") return "Number";
  if (sortBy === "issued") return "Issued";
  if (sortBy === "due") return "Due";
  return "Amount";
}

export function InvoiceToolbar({
  title = "Invoices",
  subtitle,
  search,
  onSearchChange,
  status,
  onStatusChange,
  hasActiveFilters,
  onResetFilters,
  totalCount = 0,
  filteredCount = 0,
  statusCounts = [
    { key: "all", label: "All", count: totalCount },
    { key: "draft", label: "Draft", count: 0 },
    { key: "sent", label: "Sent", count: 0 },
    { key: "paid", label: "Paid", count: 0 },
    { key: "overdue", label: "Overdue", count: 0 },
  ],
  sortBy = "due",
  sortDir = "desc",
  onSortByChange,
  onExportCSV,
  children,
}: InvoiceToolbarProps) {
  const resolvedSubtitle =
    subtitle ??
    `${String(totalCount).padStart(2, "0")} invoice${totalCount !== 1 ? "s" : ""}`;
  const [dateRange, setDateRange] = useState("This month");
  const [isSortOpen, setIsSortOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[42px] leading-none font-extrabold tracking-tight text-[var(--inv-text-primary)]">
            {title}
          </h1>
          <p className="font-data mt-2 text-sm text-[var(--inv-text-muted)]">
            {resolvedSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 border-(--inv-border) bg-[var(--inv-surface)] text-(--inv-text-secondary) hover:bg-[var(--inv-surface-elevated)]"
              >
                <Download className="h-4 w-4" />
                <span className="sr-only">Export Invoices</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 border-(--inv-border) bg-[var(--inv-surface)]"
            >
              <DropdownMenuItem
                className="cursor-pointer text-[var(--inv-text-primary)] focus:bg-[var(--inv-accent-subtle)] focus:text-(--inv-accent-primary)"
                onClick={onExportCSV}
              >
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-[var(--inv-text-primary)] focus:bg-[var(--inv-accent-subtle)] focus:text-(--inv-accent-primary)">
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-[var(--inv-text-primary)] focus:bg-[var(--inv-accent-subtle)] focus:text-(--inv-accent-primary)">
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {children && <div className="shrink-0">{children}</div>}
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="hide-scrollbar relative flex overflow-x-auto rounded-full border border-(--inv-border) bg-[var(--inv-surface)] p-1">
          {statusCounts.map((item) => {
            const isAll = item.key === "all";
            const isKnownStatus = ["draft", "sent", "paid", "overdue"].includes(
              item.key,
            );
            const isActive = item.key === status;
            const disabled =
              item.disabled || (item.count === 0 && !isAll) || !isKnownStatus;

            return (
              <button
                key={item.key}
                type="button"
                disabled={disabled}
                onClick={() => onStatusChange(item.key as InvoiceFilterStatus)}
                className={cn(
                  "relative flex items-center gap-2 rounded-full px-5 py-2 text-sm transition-colors duration-250 ease-out",
                  isActive
                    ? "text-white"
                    : "text-(--inv-text-secondary) hover:text-[var(--inv-text-primary)]",
                  disabled &&
                    "cursor-not-allowed opacity-40 hover:text-(--inv-text-secondary)",
                )}
                aria-label={`${item.label} (${item.count})`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 rounded-full bg-[var(--inv-accent-primary)]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 font-medium">
                  {item.key === "all"
                    ? "All"
                    : (STATUS_LABELS[item.key as keyof typeof STATUS_LABELS] ??
                      item.label)}
                </span>
                <span
                  className={cn(
                    "font-data relative z-10 -mt-1 align-super text-[10px] tabular-nums",
                  )}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-1 items-center justify-end gap-3 lg:max-w-xl">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--inv-text-muted)]" />
            <Input
              type="text"
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="font-data h-10 w-full border-(--inv-border) bg-white/40 pr-4 pl-9 text-sm text-[var(--inv-text-primary)] placeholder:text-[var(--inv-text-muted)] focus:border-[var(--inv-accent-primary)] focus:ring-1 focus:ring-[var(--inv-accent-primary)] dark:bg-white/5"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 border-(--inv-border) bg-[var(--inv-surface)] px-3 text-(--inv-text-secondary) hover:bg-[var(--inv-surface-elevated)]"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange}
                <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 border-(--inv-border) bg-[var(--inv-surface)]"
            >
              {["This week", "This month", "This quarter", "Custom range"].map(
                (range) => (
                  <DropdownMenuItem
                    key={range}
                    onClick={() => setDateRange(range)}
                    className="cursor-pointer text-[var(--inv-text-primary)] focus:bg-[var(--inv-accent-subtle)] focus:text-(--inv-accent-primary)"
                  >
                    {range}
                    {dateRange === range && (
                      <Check className="ml-auto h-4 w-4 text-(--inv-accent-primary)" />
                    )}
                  </DropdownMenuItem>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu onOpenChange={setIsSortOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 rounded-full border-(--inv-border) bg-[var(--inv-surface)] px-4 text-(--inv-text-secondary) hover:bg-[var(--inv-surface-elevated)]"
              >
                Sort: {renderSortText(sortBy)} (
                {sortDir === "asc" ? "ASC" : "DESC"})
                <ChevronDown
                  className={cn(
                    "ml-2 h-3 w-3 transition-transform duration-200",
                    isSortOpen && "rotate-180",
                  )}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 border-(--inv-border) bg-[var(--inv-surface)] p-1"
            >
              {(["number", "issued", "due", "amount"] as const).map((key) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onSortByChange?.(key)}
                  className="cursor-pointer rounded-md text-[var(--inv-text-primary)] focus:bg-[var(--inv-accent-subtle)] focus:text-(--inv-accent-primary)"
                >
                  <span className="flex-1">{renderSortText(key)}</span>
                  {sortBy === key && (
                    <Check className="h-4 w-4 text-(--inv-accent-primary)" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export type { StatusCount, InvoiceUiStatus };
