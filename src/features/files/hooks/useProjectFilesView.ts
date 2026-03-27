"use client";

import { useMemo, useState } from "react";
import type { FilesViewMode, ProjectFile } from "@/features/files/types";

type SortBy = "recent" | "name" | "size";
type TypeFilter = "all" | "pdf" | "image" | "doc" | "archive" | "other";

export function useProjectFilesView(files: ProjectFile[]) {
  const [viewMode, setViewMode] = useState<FilesViewMode>("list");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const filteredFiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const next = files.filter((file) => {
      const matchesType = typeFilter === "all" || file.fileKind === typeFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        file.name.toLowerCase().includes(normalizedQuery);

      return matchesType && matchesQuery;
    });

    next.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "size") return (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0);
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

    return next;
  }, [files, query, sortBy, typeFilter]);

  return {
    filteredFiles,
    query,
    setQuery,
    sortBy,
    setSortBy,
    typeFilter,
    setTypeFilter,
    viewMode,
    setViewMode,
  };
}
