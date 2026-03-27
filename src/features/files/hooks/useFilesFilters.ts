"use client";

import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";
import type { TypeFilter } from "../utils/file-filtering";
import type { SortBy } from "../utils/file-sorting";

const viewOptions = ["list", "grid"] as const;
const sortOptions = ["name", "date", "size"] as const;
const typeOptions = [
  "all",
  "image",
  "pdf",
  "doc",
  "spreadsheet",
  "presentation",
  "media",
  "archive",
  "other",
] as const;

const statusOptions = [
  "all",
  "pending_review",
  "approved",
  "changes_requested",
] as const;
export type StatusFilter = (typeof statusOptions)[number];

export function useFilesFilters() {
  const [filters, setFilters] = useQueryStates({
    q: parseAsString.withDefault(""),
    sort: parseAsStringEnum([...sortOptions]).withDefault("date"),
    view: parseAsStringEnum([...viewOptions]).withDefault("list"),
    type: parseAsStringEnum([...typeOptions]).withDefault("all"),
    status: parseAsStringEnum([...statusOptions]).withDefault("all"),
  });

  return {
    query: filters.q,
    sortBy: filters.sort as SortBy,
    viewMode: filters.view as "list" | "grid",
    typeFilter: filters.type as TypeFilter,
    statusFilter: filters.status as StatusFilter,
    setQuery: (q: string) => setFilters({ q }),
    setSortBy: (sort: SortBy) => setFilters({ sort }),
    setViewMode: (view: "list" | "grid") => setFilters({ view }),
    setTypeFilter: (type: TypeFilter) => setFilters({ type }),
    setStatusFilter: (status: StatusFilter) => setFilters({ status }),
  };
}
