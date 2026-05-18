"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  Download,
  Plus,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  PROJECT_STATUSES,
  PROJECT_PRIORITIES,
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

/* ─── Priority pill color mapping ────────────────────────────────────── */

const PRIORITY_COLORS: Record<string, string> = {
  low: "#34D399",
  medium: "#F59E0B",
  high: "#EF4444",
  urgent: "#EF4444",
};

/* ─── Filter Tab config ──────────────────────────────────────────────── */

type FilterTab = {
  key: string;
  label: string;
};

const FILTER_TABS: FilterTab[] = [
  { key: "all", label: "ALL" },
  { key: "not_started", label: "NOT STARTED" },
  { key: "in_progress", label: "ACTIVE" },
  { key: "on_hold", label: "ON HOLD" },
  { key: "completed", label: "DONE" },
  { key: "overdue", label: "OVERDUE" },
];

/* ─── Component ──────────────────────────────────────────────────────── */

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
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="text-[38px] leading-none font-[800] tracking-[-0.02em] text-[#0D0D14] dark:text-gray-50">
            Projects
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="mt-2.5 text-[11px] font-(--font-data) tracking-widest text-[#6B6B7E] uppercase dark:text-gray-400"
          >
            {totalCount} {totalCount === 1 ? "project" : "projects"} ·{" "}
            {activeCount} active
            {overdueCount > 0 ? (
              <>
                {" · "}
                <span className="text-[#EF4444]">{overdueCount} overdue</span>
              </>
            ) : (
              <> · 0 overdue</>
            )}
          </motion.p>
        </div>

        {/* Right action group */}
        <div className="flex items-center gap-3">
          {/* Export ghost button */}
          <button
            type="button"
            className={cn(
              "flex h-[40px] items-center gap-2 rounded-[10px] border px-4",
              "text-[11px] font-(--font-data) tracking-widest uppercase",
              "transition-all duration-200",
              "border-[#EBEBF0] bg-white text-[#6B6B7E] shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
              "hover:bg-[#FAFAFA] hover:text-[#0D0D14]",
              "dark:border-white/5 dark:bg-transparent dark:text-gray-400 dark:shadow-none",
              "dark:hover:border-white/10 dark:hover:bg-transparent dark:hover:text-gray-50",
            )}
          >
            <Download className="h-3.5 w-3.5" />
            Export ↓
          </button>

          {/* + New Project CTA — gradient works both themes */}
          <button
            type="button"
            onClick={onCreateClick}
            className={cn(
              "group/cta flex h-[40px] items-center gap-2 rounded-[10px] px-5",
              "text-[12px] font-bold tracking-wide",
              "transition-all duration-200",
              "bg-gradient-to-r from-[#00F7FF] to-[#0090FF] text-black",
              "shadow-[0_2px_12px_rgba(0,144,255,0.30)]",
              "hover:shadow-[0_4px_20px_rgba(0,144,255,0.45)]",
              "hover:brightness-110",
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            New Project
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/cta:translate-x-[3px]" />
          </button>
        </div>
      </motion.div>

      {/* ─── Search + Filter Row ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 20,
          delay: 0.05,
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        {/* Search bar */}
        <div className="group relative flex-1">
          <Search
            className={cn(
              "pointer-events-none absolute top-1/2 left-4 z-20 h-4 w-4 -translate-y-1/2 transition-colors duration-200",
              searchFocused
                ? "text-[#0090FF]"
                : "text-[#9B9BA8] dark:text-gray-500",
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
              "h-[42px] w-full rounded-[10px] border pr-16 pl-11",
              "text-[12px] font-(--font-data)",
              "text-[#0D0D14] placeholder:text-[#9B9BA8]",
              "dark:text-gray-50 dark:placeholder:text-gray-600",
              "transition-all duration-200 outline-none",
              "border-[#EBEBF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
              "dark:border-transparent dark:bg-white/[0.03] dark:shadow-none",
              searchFocused &&
                "border-[#0090FF] shadow-[0_0_0_2px_rgba(0,144,255,0.12)] dark:border-[#00F7FF]/40 dark:shadow-[0_0_0_1px_rgba(0,247,255,0.15)]",
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
                className="rounded-md p-1 text-[#6B6B7E] transition-colors hover:text-[#0D0D14] dark:text-gray-500 dark:hover:text-gray-50"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              !searchFocused && (
                <span className="rounded border border-[#EBEBF0] px-1.5 py-0.5 text-[10px] font-(--font-data) text-[#9B9BA8] dark:border-white/5 dark:text-gray-500">
                  ⌘K
                </span>
              )
            )}
          </div>
        </div>

        {/* Filters button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(
              "flex h-[42px] items-center gap-2 rounded-[10px] border px-4",
              "text-[11px] font-(--font-data) tracking-widest uppercase",
              "transition-all duration-200",
              filtersOpen || activeFilterCount > 0
                ? "border-[#0090FF]/30 bg-[rgba(0,144,255,0.08)] text-[#0090FF] dark:text-[#00C8FF]"
                : cn(
                    "border-[#EBEBF0] bg-white text-[#6B6B7E] shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
                    "hover:border-[rgba(0,144,255,0.3)]",
                    "dark:border-white/5 dark:bg-transparent dark:text-gray-400 dark:shadow-none",
                    "dark:hover:border-white/10 dark:hover:text-gray-50",
                  ),
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#0090FF] px-1 text-[10px] font-(--font-data) font-bold text-white dark:text-black">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </motion.div>

      {/* ─── Filter Tabs (Translucent Pill Container) ────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
        className={cn(
          "inline-flex items-center rounded-xl border p-1",
          "border-[#EBEBF0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]",
          "dark:border-white/5 dark:bg-white/[0.02] dark:shadow-none dark:backdrop-blur-sm",
        )}
      >
        {FILTER_TABS.map((tab) => {
          const isActive =
            activeTab === tab.key || (tab.key === "all" && activeTab === "all");
          const count = getTabCount(tab.key);

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabClick(tab.key)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-[8px] px-3 py-1.5",
                "text-[11px] font-(--font-data) tracking-widest uppercase",
                "transition-all duration-200",
                isActive
                  ? cn(
                      "bg-[#F0F0F5] text-[#0D0D14] shadow-[0_1px_4px_rgba(0,0,0,0.08)]",
                      "dark:bg-white/10 dark:text-gray-50 dark:shadow-none",
                    )
                  : cn(
                      "text-[#6B6B7E] hover:bg-[rgba(0,0,0,0.03)] hover:text-[#0D0D14]",
                      "dark:text-gray-500 dark:hover:bg-white/[0.03] dark:hover:text-gray-300",
                    ),
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "text-[10px] font-(--font-data)",
                  isActive
                    ? "text-[#0090FF] dark:text-[#00C8FF]"
                    : "text-[#9B9BA8] dark:text-gray-600",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* ─── Priority Filter Panel (expandable) ───────────────────── */}
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
                "rounded-xl border p-5",
                "border-[#EBEBF0] bg-[#FAFAFA]",
                "dark:border-white/5 dark:bg-[#1A1D27]/50 dark:backdrop-blur-md",
              )}
            >
              <div className="space-y-4">
                {/* Priority pills */}
                <div>
                  <p className="mb-2 text-[11px] font-(--font-data) tracking-widest text-[#6B6B7E] uppercase dark:text-gray-400">
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
                            "text-[11px] font-(--font-data) tracking-widest uppercase",
                            "transition-all duration-200",
                            isSelected
                              ? "border-transparent font-bold text-black"
                              : cn(
                                  "border-[#EBEBF0] text-[#6B6B7E] hover:border-[rgba(0,144,255,0.3)]",
                                  "dark:border-white/5 dark:text-gray-400 dark:hover:border-white/10",
                                ),
                          )}
                          style={
                            isSelected ? { backgroundColor: color } : undefined
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
                  <div className="flex items-center justify-between border-t border-[#EBEBF0] pt-3 dark:border-white/5">
                    <span className="text-[11px] font-(--font-data) tracking-widest text-[#6B6B7E] uppercase dark:text-gray-400">
                      {activeFilterCount} filter
                      {activeFilterCount > 1 ? "s" : ""} active
                    </span>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-[11px] font-(--font-data) tracking-widest text-[#EF4444] uppercase transition-colors hover:text-[#EF4444]/80"
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
