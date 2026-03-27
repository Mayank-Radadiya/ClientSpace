"use client";

import {
  Search,
  LayoutGrid,
  LayoutList,
  SlidersHorizontal,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SortBy = "recent" | "name" | "size";
export type ViewMode = "list" | "grid";
export type TypeFilter =
  | "all"
  | "image"
  | "pdf"
  | "doc"
  | "spreadsheet"
  | "presentation"
  | "media"
  | "archive"
  | "other";

type FilesToolbarProps = {
  query: string;
  setQuery: (v: string) => void;
  sortBy: SortBy;
  setSortBy: (v: SortBy) => void;
  typeFilter: TypeFilter;
  setTypeFilter: (v: TypeFilter) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  totalCount: number;
};

const SORT_LABELS: Record<SortBy, string> = {
  recent: "Recently Updated",
  name: "Name",
  size: "File Size",
};

const TYPE_LABELS: Record<TypeFilter, string> = {
  all: "All Types",
  image: "Images",
  pdf: "PDFs",
  doc: "Documents",
  spreadsheet: "Spreadsheets",
  presentation: "Presentations",
  media: "Video & Audio",
  archive: "Archives",
  other: "Other",
};

export function FilesToolbar({
  query,
  setQuery,
  sortBy,
  setSortBy,
  typeFilter,
  setTypeFilter,
  viewMode,
  setViewMode,
  totalCount,
}: FilesToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: search + filter */}
      <div className="flex flex-1 items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files…"
            className="h-8 pl-8 text-sm"
          />
        </div>

        {/* Sort + filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {sortBy !== "recent" || typeFilter !== "all"
                  ? `Filtered`
                  : "Filter"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="text-muted-foreground text-xs font-medium">
              Sort by
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortBy)}
            >
              {(Object.keys(SORT_LABELS) as SortBy[]).map((key) => (
                <DropdownMenuRadioItem
                  key={key}
                  value={key}
                  className="text-sm"
                >
                  {SORT_LABELS[key]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-xs font-medium">
              File type
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as TypeFilter)}
            >
              {(Object.keys(TYPE_LABELS) as TypeFilter[]).map((key) => (
                <DropdownMenuRadioItem
                  key={key}
                  value={key}
                  className="text-sm"
                >
                  {TYPE_LABELS[key]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right: count + view toggle */}
      <div className="flex items-center gap-3">
        {totalCount > 0 && (
          <motion.span
            key={totalCount}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-muted-foreground text-xs tabular-nums"
          >
            {totalCount} {totalCount === 1 ? "file" : "files"}
          </motion.span>
        )}
        <div className="flex rounded-md border p-0.5">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "rounded p-1 transition-colors",
              viewMode === "list"
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-label="List view"
          >
            <LayoutList className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "rounded p-1 transition-colors",
              viewMode === "grid"
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
