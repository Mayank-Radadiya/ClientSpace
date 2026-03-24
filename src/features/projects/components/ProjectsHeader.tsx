"use client";

import { useState, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, X, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
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

type ProjectsHeaderProps = {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  totalCount: number;
  filteredCount: number;
  children: React.ReactNode;
};

export function ProjectsHeader({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  totalCount,
  filteredCount,
  children,
}: ProjectsHeaderProps) {
  const [localSearch, setLocalSearch] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced real-time search — fires 300ms after the user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFiltersChange({ ...filters, search: localSearch });
      }
    }, 500); // Slower debounce for a more premium "smooth" feel
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  const handleStatusChange = (
    status: (typeof PROJECT_STATUSES)[number],
    checked: boolean,
  ) => {
    const newStatuses = checked
      ? [...filters.status, status]
      : filters.status.filter((s) => s !== status);
    onFiltersChange({ ...filters, status: newStatuses });
  };

  const handlePriorityChange = (
    priority: (typeof PROJECT_PRIORITIES)[number],
    checked: boolean,
  ) => {
    const newPriorities = checked
      ? [...filters.priority, priority]
      : filters.priority.filter((p) => p !== priority);
    onFiltersChange({ ...filters, priority: newPriorities });
  };

  const clearFilters = () => {
    onFiltersChange({ search: "", status: [], priority: [] });
    setLocalSearch("");
  };

  const hasActiveFilters =
    filters.search || filters.status.length > 0 || filters.priority.length > 0;
  const activeFilterCount =
    filters.status.length + filters.priority.length + (filters.search ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Title row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-foreground font-heading text-3xl font-black tracking-tighter sm:text-4xl">
            Projects
          </h1>
          <p className="text-muted-foreground mt-2 text-[11px] font-bold tracking-[0.15em] uppercase opacity-70">
            {filteredCount === totalCount
              ? `Management Center / `
              : `Filtered View / `}
            <span className="text-primary font-mono font-black tracking-normal">
              {filteredCount}
            </span>{" "}
            {filteredCount === totalCount ? "ACTIVE" : `OF ${totalCount}`}
          </p>
        </div>
        <div className="flex items-center gap-3">{children}</div>
      </div>

      {/* Filter / search row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="group relative flex-1">
          <Search className="text-muted-foreground group-focus-within:text-foreground pointer-events-none absolute top-1/2 left-4 z-20 h-4 w-4 -translate-y-1/2 transition-all duration-300" />
          <Input
            placeholder="Search projects by name, client, or tag…"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="h-11 rounded-xl border-black/10 bg-white/5 px-11 text-sm ring-1 ring-white/10 backdrop-blur-md transition-all duration-300 focus-visible:bg-white/10 focus-visible:ring-1 focus-visible:ring-white/20 dark:border-white/5 dark:bg-white/5"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch("");
                onFiltersChange({ ...filters, search: "" });
              }}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-4 -translate-y-1/2 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Filters dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="bg-card/40 h-11 gap-3 rounded-xl border-white/5 px-5 text-xs font-semibold ring-1 ring-white/5 backdrop-blur-sm"
              >
                <SlidersHorizontal className="h-4 w-4 opacity-70" />
                FILTERS
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-primary/20 text-primary hover:bg-primary/20 h-5 min-w-[20px] border-none px-1.5 font-mono font-black"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-popover/90 w-56 rounded-xl border-white/10 p-2 shadow-2xl backdrop-blur-xl"
            >
              <DropdownMenuLabel className="text-muted-foreground px-2 py-1.5 text-[10px] font-black tracking-widest uppercase">
                STATUS
              </DropdownMenuLabel>
              {PROJECT_STATUSES.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  className="rounded-lg text-sm"
                  checked={filters.status.includes(status)}
                  onCheckedChange={(checked) =>
                    handleStatusChange(status, checked as boolean)
                  }
                >
                  {STATUS_LABELS[status]}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuLabel className="text-muted-foreground px-2 py-1.5 text-[10px] font-black tracking-widest uppercase">
                PRIORITY
              </DropdownMenuLabel>
              {PROJECT_PRIORITIES.map((priority) => (
                <DropdownMenuCheckboxItem
                  key={priority}
                  className="rounded-lg text-sm"
                  checked={filters.priority.includes(priority)}
                  onCheckedChange={(checked) =>
                    handlePriorityChange(priority, checked as boolean)
                  }
                >
                  {PRIORITY_LABELS[priority]}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View toggle pill */}
          <div className="bg-card/40 flex items-center rounded-xl border border-white/5 p-1 ring-1 ring-white/5 backdrop-blur-sm">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "h-9 w-9 rounded-lg p-0 transition-all",
                viewMode === "grid" &&
                  "bg-white/10 shadow-inner ring-1 ring-white/10",
              )}
              onClick={() => onViewModeChange("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "h-9 w-9 rounded-lg p-0 transition-all",
                viewMode === "list" &&
                  "bg-white/10 shadow-inner ring-1 ring-white/10",
              )}
              onClick={() => onViewModeChange("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="animate-in fade-in slide-in-from-top-1 flex flex-wrap items-center gap-2 pt-1">
          <span className="text-muted-foreground mr-1 text-[10px] font-black tracking-widest uppercase opacity-40">
            ACTIVE FILTERS
          </span>

          {filters.search && (
            <Badge
              variant="secondary"
              className="gap-2 rounded-full border border-white/10 bg-white/5 py-1 pr-1.5 pl-3 text-[10px] font-bold backdrop-blur-md transition-all hover:bg-white/10 hover:shadow-lg hover:shadow-black/20"
            >
              SEARCH: "{filters.search}"
              <button
                type="button"
                onClick={() => {
                  setLocalSearch("");
                  onFiltersChange({ ...filters, search: "" });
                }}
                className="rounded-full bg-white/10 p-0.5 transition-colors hover:bg-white/20"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          )}

          {filters.status.map((status) => (
            <Badge
              key={status}
              variant="secondary"
              className="hover:bg-primary/60 gap-2 rounded-full border border-white/10 bg-white/5 py-4 pr-1.5 pl-3 text-[10px] font-bold backdrop-blur-md transition-all hover:shadow-lg hover:shadow-black/20"
            >
              {STATUS_LABELS[
                status as keyof typeof STATUS_LABELS
              ].toUpperCase()}
              <button
                type="button"
                onClick={() => handleStatusChange(status, false)}
                className="rounded-full bg-white/10 p-0.5 transition-colors hover:bg-white/20"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}

          {filters.priority.map((priority) => (
            <Badge
              key={priority}
              variant="secondary"
              className="hover:bg-primary/60 gap-2 rounded-full border border-white/10 bg-white/5 py-4 pr-1.5 pl-3 text-[10px] font-bold backdrop-blur-md transition-all hover:shadow-lg hover:shadow-black/20"
            >
              {PRIORITY_LABELS[
                priority as keyof typeof PRIORITY_LABELS
              ].toUpperCase()}
              <button
                type="button"
                onClick={() => handlePriorityChange(priority, false)}
                className="rounded-full bg-white/10 p-0.5 transition-colors hover:bg-white/20"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground ml-1 h-7 px-3 text-[10px] font-black tracking-widest uppercase"
            onClick={clearFilters}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
