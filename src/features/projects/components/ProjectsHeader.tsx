"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type FilterState = {
  search: string;
  status: string[];
  priority: string[];
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
  const [searchValue, setSearchValue] = useState(filters.search);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchValue });
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatuses = checked
      ? [...filters.status, status]
      : filters.status.filter((s) => s !== status);
    onFiltersChange({ ...filters, status: newStatuses });
  };

  const handlePriorityChange = (priority: string, checked: boolean) => {
    const newPriorities = checked
      ? [...filters.priority, priority]
      : filters.priority.filter((p) => p !== priority);
    onFiltersChange({ ...filters, priority: newPriorities });
  };

  const clearFilters = () => {
    const emptyFilters = { search: "", status: [], priority: [] };
    onFiltersChange(emptyFilters);
    setSearchValue("");
  };

  const hasActiveFilters =
    filters.search || filters.status.length > 0 || filters.priority.length > 0;

  const activeFilterCount =
    filters.status.length + filters.priority.length + (filters.search ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm">
            {filteredCount === totalCount
              ? `${totalCount} project${totalCount !== 1 ? "s" : ""}`
              : `Showing ${filteredCount} of ${totalCount} projects`}
          </p>
        </div>
        {children}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search projects..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </form>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 px-1.5 text-xs"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PROJECT_STATUSES.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={filters.status.includes(status)}
                  onCheckedChange={(checked) =>
                    handleStatusChange(status, checked as boolean)
                  }
                >
                  {STATUS_LABELS[status]}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PROJECT_PRIORITIES.map((priority) => (
                <DropdownMenuCheckboxItem
                  key={priority}
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

          <div className="hidden items-center rounded-md border sm:flex">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none px-2"
              onClick={() => onViewModeChange("grid")}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none px-2"
              onClick={() => onViewModeChange("list")}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Active filters:</span>

          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setSearchValue("");
                  onFiltersChange({ ...filters, search: "" });
                }}
              />
            </Badge>
          )}

          {filters.status.map((status) => (
            <Badge key={status} variant="secondary" className="gap-1">
              {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleStatusChange(status, false)}
              />
            </Badge>
          ))}

          {filters.priority.map((priority) => (
            <Badge key={priority} variant="secondary" className="gap-1">
              {PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS]}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handlePriorityChange(priority, false)}
              />
            </Badge>
          ))}

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-auto p-1 text-xs"
            onClick={clearFilters}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
