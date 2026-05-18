"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  LayoutGrid,
  List,
  Download,
  Plus,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  PROJECT_STATUSES,
  PROJECT_PRIORITIES,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from "../schemas";

export type FilterState = {
  search: string;
  status: (typeof PROJECT_STATUSES)[number][];
  priority: (typeof PROJECT_PRIORITIES)[number][];
};

type StatusCounts = Record<string, number>;

type ProjectsHeaderProps = {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  totalCount: number;
  filteredCount: number;
  activeCount: number;
  overdueCount: number;
  statusCounts: StatusCounts;
  onCreateClick: () => void;
};

/* ─── Status / Priority pill color mapping ──────────────────────────── */

const STATUS_COLORS: Record<string, string> = {
  not_started: "#6B6B7E",
  in_progress: "#4F7FFF",
  review: "#F59E0B",
  completed: "#22C55E",
  on_hold: "#F59E0B",
  archived: "#6B6B7E",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "#22C55E",
  medium: "#F59E0B",
  high: "#EF4444",
  urgent: "#EF4444",
};

/* ─── Filter Tab config ─────────────────────────────────────────────── */

type FilterTab = {
  key: string;
  label: string;
};

const FILTER_TABS: FilterTab[] = [
  { key: "all", label: "All" },
  { key: "not_started", label: "Not Started" },
  { key: "in_progress", label: "In Progress" },
  { key: "on_hold", label: "On Hold" },
  { key: "completed", label: "Completed" },
  { key: "overdue", label: "Overdue" },
];

/* ─── Component ─────────────────────────────────────────────────────── */

export function ProjectsHeader({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  totalCount,
  filteredCount,
  activeCount,
  overdueCount,
  statusCounts,
  onCreateClick,
}: ProjectsHeaderProps) {
  const [localSearch, setLocalSearch] = useState(filters.search);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Active filter tab derived from status filter
  const activeTab = useMemo(() => {
    if (filters.status.length === 1) return filters.status[0];
    return "all";
  }, [filters.status]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFiltersChange({ ...filters, search: localSearch });
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  // ⌘K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        searchRef.current?.blur();
        setFiltersOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleTabClick = (tabKey: string) => {
    if (tabKey === "all") {
      onFiltersChange({ ...filters, status: [] });
    } else if (tabKey === "overdue") {
      // Overdue is special — not a real status, handled in ProjectList
      onFiltersChange({ ...filters, status: [] });
    } else {
      onFiltersChange({
        ...filters,
        status: [tabKey as (typeof PROJECT_STATUSES)[number]],
      });
    }
  };

  const handlePriorityToggle = (
    priority: (typeof PROJECT_PRIORITIES)[number],
  ) => {
    const newPriorities = filters.priority.includes(priority)
      ? filters.priority.filter((p) => p !== priority)
      : [...filters.priority, priority];
    onFiltersChange({ ...filters, priority: newPriorities });
  };

  const clearFilters = () => {
    onFiltersChange({ search: "", status: [], priority: [] });
    setLocalSearch("");
  };

  const activeFilterCount = filters.status.length + filters.priority.length;

  const getTabCount = (tabKey: string): number => {
    if (tabKey === "all") return totalCount;
    if (tabKey === "overdue") return overdueCount;
    return statusCounts[tabKey] ?? 0;
  };

  return (
    <div className="space-y-5">
      {/* ─── Title Row ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="font-(--font-display) text-[38px] font-[800] leading-none tracking-[-0.02em] text-[#0D0D14] dark:text-[#F2F2F5]">
            Projects
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.04, duration: 0.25 }}
            className="font-(--font-data) mt-2 text-[13px] text-[#6B6B7E]"
          >
            {totalCount} {totalCount === 1 ? "project" : "projects"} ·{" "}
            {activeCount} active
            {overdueCount > 0 ? (
              <>
                {" · "}
                <span className="text-[#EF4444]">
                  {overdueCount} overdue
                </span>
              </>
            ) : (
              <> · 0 overdue</>
            )}
          </motion.p>
        </div>

        {/* Right action group */}
        <div className="flex items-center gap-3">
          {/* Export button */}
          <button
            type="button"
            className={cn(
              "flex h-[40px] items-center gap-2 rounded-[10px] border px-4",
              "font-(--font-data) text-[12px] tracking-[0.04em] uppercase",
              "transition-all duration-180",
              "border-[#E2E2EA] bg-white text-[#6B6B7E] shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
              "hover:bg-[#FAFAFA] hover:text-[#0D0D14]",
              "dark:border-[rgba(255,255,255,0.10)] dark:bg-[#16161F] dark:shadow-none",
              "dark:hover:bg-[#1A1A26] dark:hover:text-[#F2F2F5]",
            )}
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>

          {/* New Project CTA */}
          <button
            type="button"
            onClick={onCreateClick}
            className={cn(
              "group/cta flex h-[40px] items-center gap-2 rounded-[10px] px-5",
              "font-(--font-data) text-[12px] tracking-[0.04em] uppercase",
              "transition-all duration-180",
              "bg-[#3B6FEF] text-white shadow-[0_2px_8px_rgba(59,111,239,0.30)]",
              "hover:bg-[#4F7FFF] hover:shadow-[0_4px_16px_rgba(59,111,239,0.35)]",
              "dark:bg-[#4F7FFF] dark:shadow-[0_2px_8px_rgba(79,127,255,0.25)]",
              "dark:hover:bg-[#6B95FF]",
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            New Project
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-180 group-hover/cta:translate-x-[3px]" />
          </button>
        </div>
      </motion.div>

      {/* ─── Search + Filter + Toggle Row ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        {/* Search bar */}
        <div className="group relative flex-1">
          <Search
            className={cn(
              "pointer-events-none absolute top-1/2 left-4 z-20 h-4 w-4 -translate-y-1/2 transition-colors duration-180",
              searchFocused ? "text-[#4F7FFF]" : "text-[#6B6B7E]",
            )}
          />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search by name, client, or tag..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              "h-[42px] w-full rounded-[10px] border pl-11 pr-16",
              "font-(--font-data) text-[13px] text-[#0D0D14] placeholder:text-[#9B9BA8] dark:text-[#F2F2F5]",
              "transition-all duration-180 outline-none",
              "bg-white border-[#E2E2EA] shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
              "dark:bg-[#111118] dark:border-[rgba(255,255,255,0.08)] dark:shadow-none",
              searchFocused &&
                "border-[#4F7FFF] shadow-[0_0_0_2px_rgba(79,127,255,0.15)] dark:border-[#4F7FFF]",
            )}
          />
          <div className="absolute top-1/2 right-3 -translate-y-1/2">
            {localSearch ? (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch("");
                  onFiltersChange({ ...filters, search: "" });
                }}
                className="rounded-md p-1 text-[#6B6B7E] transition-colors hover:text-[#0D0D14] dark:hover:text-[#F2F2F5]"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              !searchFocused && (
                <span className="font-(--font-data) rounded border border-[#E2E2EA] px-1.5 py-0.5 text-[10px] text-[#9B9BA8] dark:border-[rgba(255,255,255,0.08)]">
                  ⌘K
                </span>
              )
            )}
          </div>
        </div>

        {/* Filters + View toggle */}
        <div className="flex items-center gap-2">
          {/* Filters button */}
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(
              "flex h-[42px] items-center gap-2 rounded-[10px] border px-4",
              "font-(--font-data) text-[12px] tracking-[0.04em] uppercase",
              "transition-all duration-180",
              filtersOpen || activeFilterCount > 0
                ? "border-[#4F7FFF] bg-[rgba(79,127,255,0.08)] text-[#4F7FFF]"
                : cn(
                    "border-[#E2E2EA] bg-white text-[#6B6B7E] shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
                    "hover:border-[rgba(79,127,255,0.3)]",
                    "dark:border-[rgba(255,255,255,0.08)] dark:bg-[#111118] dark:shadow-none",
                  ),
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#4F7FFF] px-1 font-(--font-data) text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Grid / List toggle */}
          <div
            className={cn(
              "flex h-[42px] items-center rounded-[10px] border p-1",
              "border-[#E2E2EA] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
              "dark:border-[rgba(255,255,255,0.08)] dark:bg-[#111118] dark:shadow-none",
            )}
          >
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={cn(
                "rounded-[8px] p-2 transition-all duration-180",
                viewMode === "grid"
                  ? "bg-[#F0F0F5] text-[#0D0D14] shadow-[0_1px_4px_rgba(0,0,0,0.10)] dark:bg-[#16161F] dark:text-[#F2F2F5]"
                  : "text-[#6B6B7E] hover:text-[#0D0D14] dark:hover:text-[#F2F2F5]",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={cn(
                "rounded-[8px] p-2 transition-all duration-180",
                viewMode === "list"
                  ? "bg-[#F0F0F5] text-[#0D0D14] shadow-[0_1px_4px_rgba(0,0,0,0.10)] dark:bg-[#16161F] dark:text-[#F2F2F5]"
                  : "text-[#6B6B7E] hover:text-[#0D0D14] dark:hover:text-[#F2F2F5]",
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ─── Filter Tabs ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "inline-flex items-center rounded-[10px] border p-1",
          "border-[#EBEBF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]",
          "dark:border-[rgba(255,255,255,0.06)] dark:bg-[#111118] dark:shadow-none",
        )}
      >
        {FILTER_TABS.map((tab) => {
          const isActive = activeTab === tab.key || (tab.key === "all" && activeTab === "all");
          const count = getTabCount(tab.key);

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabClick(tab.key)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-[8px] px-3 py-1.5",
                "font-(--font-data) text-[13px]",
                "transition-all duration-200",
                isActive
                  ? cn(
                      "bg-white text-[#0D0D14] shadow-[0_1px_4px_rgba(0,0,0,0.10)]",
                      "dark:bg-[#16161F] dark:text-[#F2F2F5] dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)]",
                    )
                  : "text-[#6B6B7E] hover:text-[#0D0D14] hover:bg-[rgba(0,0,0,0.03)] dark:hover:text-[#F2F2F5] dark:hover:bg-[rgba(255,255,255,0.04)]",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "font-(--font-data) text-[11px]",
                  isActive ? "text-[#4F7FFF]" : "text-[#9B9BA8]",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* ─── Priority Filter Panel (expandable) ─────────────────── */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "rounded-[12px] border p-5",
                "border-[#EBEBF0] bg-[#FAFAFA]",
                "dark:border-[rgba(255,255,255,0.06)] dark:bg-[#16161F]",
              )}
            >
              <div className="space-y-4">
                {/* Priority pills */}
                <div>
                  <p className="font-(--font-data) mb-2 text-[11px] tracking-[0.08em] text-[#6B6B7E] uppercase">
                    Priority
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PROJECT_PRIORITIES.map((priority) => {
                      const isSelected = filters.priority.includes(priority);
                      const color = PRIORITY_COLORS[priority] || "#6B6B7E";
                      return (
                        <button
                          key={priority}
                          type="button"
                          onClick={() => handlePriorityToggle(priority)}
                          className={cn(
                            "rounded-full border px-3 py-1.5",
                            "font-(--font-data) text-[11px] tracking-[0.04em]",
                            "transition-all duration-180",
                            isSelected
                              ? "border-transparent text-white"
                              : "border-[#EBEBF0] text-[#6B6B7E] hover:border-[rgba(79,127,255,0.3)] dark:border-[rgba(255,255,255,0.08)]",
                          )}
                          style={
                            isSelected
                              ? { backgroundColor: color }
                              : undefined
                          }
                        >
                          {PRIORITY_LABELS[priority]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Clear */}
                {activeFilterCount > 0 && (
                  <div className="flex items-center justify-between border-t border-[#EBEBF0] pt-3 dark:border-[rgba(255,255,255,0.06)]">
                    <span className="font-(--font-data) text-[12px] text-[#6B6B7E]">
                      {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                    </span>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="font-(--font-data) text-[12px] text-[#EF4444] transition-colors hover:text-[#EF4444]/80"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
