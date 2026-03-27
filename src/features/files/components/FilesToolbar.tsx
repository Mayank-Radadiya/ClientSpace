"use client";

import { motion } from "framer-motion";
import { Search, ArrowUpDown, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SortBy } from "../utils/file-sorting";

type FilesToolbarProps = {
  query: string;
  onQueryChange: (query: string) => void;
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
  viewMode: "list" | "grid";
  onViewChange: (view: "list" | "grid") => void;
  totalCount: number;
  filteredCount: number;
};

const sortOptions: { value: SortBy; label: string }[] = [
  { value: "date", label: "Date modified" },
  { value: "name", label: "Name" },
  { value: "size", label: "Size" },
];

export function FilesToolbar({
  query,
  onQueryChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewChange,
  totalCount,
  filteredCount,
}: FilesToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      id="view-all"
      className="bg-accent/20 sticky top-0 z-10 mb-4 flex h-14 items-center justify-between gap-4 rounded-xl px-1 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="text-foreground absolute top-1/2 left-3 z-30 h-4 w-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search files..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-[280px] pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">
                {sortOptions.find((o) => o.value === sortBy)?.label}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className={sortBy === option.value ? "bg-muted" : ""}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground mr-2 hidden text-sm lg:block">
          {filteredCount === totalCount
            ? `${totalCount} file${totalCount !== 1 ? "s" : ""}`
            : `${filteredCount} of ${totalCount}`}
        </span>

        <div className="flex rounded-md border">
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-r-none"
            onClick={() => onViewChange("list")}
          >
            <List className="h-4 w-4" />
            <span className="sr-only">List view</span>
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-l-none"
            onClick={() => onViewChange("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="sr-only">Grid view</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
