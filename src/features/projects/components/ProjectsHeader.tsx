"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  Download,
  Plus,
  ArrowRight,
  LayoutGrid,
  List,
  Sparkles,
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

/* ─── Filter Tab config ──────────────────────────────────────────────── */

type FilterTab = { key: string; label: string; color?: string };

const FILTER_TABS: FilterTab[] = [
  { key: "all", label: "All" },
  { key: "not_started", label: "Not Started" },
  { key: "in_progress", label: "Active", color: "#6C63FF" },
  { key: "on_hold", label: "On Hold", color: "#F59E0B" },
  { key: "completed", label: "Done", color: "#34D399" },
  { key: "overdue", label: "Overdue", color: "#FF4D6D" },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: "#34D399",
  medium: "#F59E0B",
  high: "#FF4D6D",
  urgent: "#FF4D6D",
};

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
  const [ctaHovered, setCtaHovered] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const activeTab = useMemo(() => {
    if (filters.status.length === 1) return filters.status[0];
    return "all";
  }, [filters.status]);

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
    if (tabKey === "all" || tabKey === "overdue") {
      onFiltersChange({ ...filters, status: [] });
    } else {
      onFiltersChange({
        ...filters,
        status: [tabKey as (typeof PROJECT_STATUSES)[number]],
      });
    }
  };

  const handlePriorityToggle = (priority: (typeof PROJECT_PRIORITIES)[number]) => {
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
      {/* ─── Hero Title Row ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          {/* Title with gradient */}
          <h1
            className="leading-none font-black tracking-tight text-gray-900 dark:text-transparent dark:bg-clip-text"
            style={{
              fontSize: "clamp(36px, 5vw, 52px)",
              backgroundImage: "var(--title-gradient)",
            }}
          >
            <style>{`
              :root { --title-gradient: none; }
              .dark { --title-gradient: linear-gradient(135deg, #F4F4FF 30%, rgba(108,99,255,0.8) 100%); }
            `}</style>
            Projects
          </h1>

          {/* Live stats line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mt-2.5 flex items-center gap-3"
          >
            <span
              className="text-[11px] tracking-[0.08em] uppercase text-gray-500 dark:text-white/45"
              style={{
                fontFamily: "var(--font-data, monospace)",
              }}
            >
              {totalCount} {totalCount === 1 ? "project" : "projects"}
            </span>
            <span className="text-gray-400 dark:text-white/15">·</span>
            <span
              className="flex items-center gap-1.5 text-[11px] tracking-[0.08em] uppercase"
              style={{
                color: "#6C63FF",
                fontFamily: "var(--font-data, monospace)",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full animate-pulse"
                style={{ background: "#6C63FF" }}
              />
              {activeCount} active
            </span>
            {overdueCount > 0 && (
              <>
                <span className="text-gray-400 dark:text-white/15">·</span>
                <span
                  className="text-[11px] tracking-[0.08em] uppercase"
                  style={{
                    color: "#FF4D6D",
                    fontFamily: "var(--font-data, monospace)",
                  }}
                >
                  {overdueCount} overdue
                </span>
              </>
            )}
          </motion.div>
        </div>

        {/* Action group */}
        <div className="flex items-center gap-3">
          {/* Export button */}
          <button
            type="button"
            className="flex h-[40px] items-center gap-2 rounded-xl px-4 text-[11px] tracking-[0.08em] uppercase transition-all duration-200 border border-black/10 dark:border-white/[0.08] bg-black/5 dark:bg-white/[0.04] text-gray-500 dark:text-white/45 hover:border-black/20 hover:text-gray-900 hover:bg-black/10 dark:hover:border-white/15 dark:hover:text-white dark:hover:bg-white/[0.07]"
            style={{
              fontFamily: "var(--font-data, monospace)",
            }}
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>

          {/* New Project CTA */}
          <button
            type="button"
            id="new-project-btn"
            onClick={onCreateClick}
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
            className="group relative flex h-[40px] items-center gap-2 overflow-hidden rounded-xl px-5 text-[12px] font-bold tracking-wide transition-all duration-300"
            style={{
              background: ctaHovered
                ? "linear-gradient(135deg, #7C73FF, #6C63FF)"
                : "linear-gradient(135deg, #6C63FF, #5B54EE)",
              color: "#fff",
              boxShadow: ctaHovered
                ? "0 0 0 1px rgba(108,99,255,0.5), 0 8px 32px rgba(108,99,255,0.45)"
                : "0 0 0 1px rgba(108,99,255,0.3), 0 4px 16px rgba(108,99,255,0.25)",
              transform: ctaHovered ? "translateY(-1px)" : "translateY(0)",
            }}
          >
            {/* Shimmer sweep */}
            <span
              className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] transition-transform duration-700"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                transform: ctaHovered ? "translateX(200%) skewX(-20deg)" : "translateX(-100%) skewX(-20deg)",
                transition: "transform 600ms ease",
              }}
            />
            <Sparkles className="h-3.5 w-3.5" />
            New Project
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-200"
              style={{ transform: ctaHovered ? "translateX(3px)" : "translateX(0)" }}
            />
          </button>
        </div>
      </motion.div>

      {/* ─── Search + Filter Row ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.07 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        {/* Search bar */}
        <div className="relative flex-1">
          <Search
            className={cn("pointer-events-none absolute top-1/2 left-4 z-20 h-4 w-4 -translate-y-1/2 transition-colors duration-200", searchFocused ? "text-[#6C63FF]" : "text-gray-400 dark:text-white/30")}
          />
          <input
            ref={searchRef}
            id="projects-search"
            type="text"
            placeholder="Search by name, client, or tag..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              "h-[44px] w-full rounded-xl pr-16 pl-11 text-[12px] outline-none transition-all duration-200 bg-black/[0.02] border-black/5 text-gray-900 shadow-inner dark:bg-white/[0.04] dark:text-[#F4F4FF]",
              searchFocused ? "border-[#6C63FF]/50 shadow-[0_0_0_3px_rgba(108,99,255,0.12),0_4px_16px_rgba(0,0,0,0.1)]" : "border-black/10 dark:border-white/[0.08]"
            )}
            style={{
              fontFamily: "var(--font-data, monospace)",
            }}
          />
          <div className="absolute top-1/2 right-3 -translate-y-1/2">
            {localSearch ? (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch("");
                  onFiltersChange({ ...filters, search: "" });
                }}
                className="rounded-lg p-1 transition-colors text-gray-400 hover:text-gray-900 dark:text-white/40 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              !searchFocused && (
                <span
                  className="rounded-md border border-black/10 dark:border-white/[0.08] text-gray-400 dark:text-white/30 px-1.5 py-0.5 text-[10px] tracking-widest"
                  style={{
                    fontFamily: "var(--font-data, monospace)",
                  }}
                >
                  ⌘K
                </span>
              )
            )}
          </div>
        </div>

        {/* Filters + view toggle */}
        <div className="flex items-center gap-2">
          {/* Filters button */}
          <button
            type="button"
            id="filters-btn"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(
              "flex h-[44px] items-center gap-2 rounded-xl px-4 text-[11px] tracking-[0.08em] uppercase transition-all duration-200 border",
              filtersOpen || activeFilterCount > 0
                ? "bg-[#6C63FF]/10 border-[#6C63FF]/40 text-[#6C63FF]"
                : "bg-black/5 border-black/10 text-gray-500 hover:border-black/20 hover:text-gray-900 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white/45 dark:hover:border-white/15 dark:hover:text-white"
            )}
            style={{
              fontFamily: "var(--font-data, monospace)",
            }}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span
                className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                style={{ background: "#6C63FF" }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* View mode toggle */}
          <div
            className="flex overflow-hidden rounded-xl border border-black/10 bg-black/5 dark:border-white/[0.08] dark:bg-white/[0.03]"
          >
            {(["grid", "list"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                id={`view-mode-${mode}`}
                onClick={() => onViewModeChange(mode)}
                aria-label={`${mode} view`}
                aria-pressed={viewMode === mode}
                className={cn(
                  "flex h-[44px] w-[44px] items-center justify-center transition-all duration-200 hover:bg-black/10 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white",
                  viewMode === mode ? "bg-[#6C63FF]/20 text-[#6C63FF]" : "bg-transparent text-gray-500 dark:text-white/35"
                )}
              >
                {mode === "grid" ? (
                  <LayoutGrid className="h-4 w-4" />
                ) : (
                  <List className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ─── Filter Tab Pills ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.12 }}
        className="flex flex-wrap gap-1.5"
      >
        {FILTER_TABS.map((tab) => {
          const isActive = activeTab === tab.key || (tab.key === "all" && activeTab === "all");
          const count = getTabCount(tab.key);
          const accentColor = tab.color ?? "#F4F4FF";

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabClick(tab.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] tracking-[0.06em] uppercase transition-all duration-200 border",
                isActive ? (tab.key === "all" ? "text-gray-900 dark:text-[#F4F4FF]" : "") : "bg-black/5 border-black/10 text-gray-500 hover:border-black/20 hover:bg-black/10 hover:text-gray-900 dark:bg-white/[0.04] dark:border-white/[0.07] dark:text-white/45 dark:hover:border-white/15 dark:hover:bg-white/[0.06] dark:hover:text-white"
              )}
              style={{
                fontFamily: "var(--font-data, monospace)",
                ...(isActive && {
                  background: `${accentColor}15`,
                  borderColor: `${accentColor}40`,
                  color: tab.key === "all" ? undefined : accentColor, 
                  boxShadow: `0 0 12px ${accentColor}10`
                })
              }}
            >
              {tab.color && isActive && (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: accentColor }}
                />
              )}
              {tab.label}
              <span
                className={cn("text-[10px]", isActive ? "" : "text-gray-400 dark:text-white/25")}
                style={{
                  color: isActive ? accentColor : undefined,
                  fontFamily: "var(--font-data, monospace)",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* ─── Priority Filter Panel ─────────────────────────────────── */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div
              className="rounded-2xl border p-5 bg-white border-black/10 shadow-lg dark:bg-white/[0.03] dark:border-white/[0.08]"
              style={{
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="space-y-4">
                <div>
                  <p
                    className="mb-3 text-[10px] tracking-[0.1em] uppercase text-gray-500 dark:text-white/35"
                    style={{
                      fontFamily: "var(--font-data, monospace)",
                    }}
                  >
                    Priority
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PROJECT_PRIORITIES.map((priority) => {
                      const isSelected = filters.priority.includes(priority);
                      const color = PRIORITY_COLORS[priority] ?? "#F4F4FF";
                      return (
                        <button
                          key={priority}
                          type="button"
                          onClick={() => handlePriorityToggle(priority)}
                          className={cn(
                            "rounded-lg px-3 py-1.5 text-[11px] tracking-[0.08em] uppercase transition-all duration-200 border",
                            isSelected ? "" : "bg-black/5 border-black/10 text-gray-500 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white/45"
                          )}
                          style={{
                            fontFamily: "var(--font-data, monospace)",
                            ...(isSelected && {
                              background: color + "20",
                              borderColor: color + "50",
                              color: color,
                              fontWeight: 600,
                            })
                          }}
                        >
                          {PRIORITY_LABELS[priority]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <div
                    className="flex items-center justify-between border-t border-black/10 dark:border-white/[0.06] pt-3"
                  >
                    <span
                      className="text-[10px] tracking-[0.08em] uppercase text-gray-500 dark:text-white/35"
                      style={{
                        fontFamily: "var(--font-data, monospace)",
                      }}
                    >
                      {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                    </span>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-[11px] tracking-[0.08em] uppercase transition-colors"
                      style={{
                        color: "#FF4D6D",
                        fontFamily: "var(--font-data, monospace)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
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
