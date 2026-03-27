"use client";

import { useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc/client";
import { FilesSidebar } from "./FilesSidebar";
import { FilesContent } from "./FilesContent";
import { FilesSidebarSkeleton } from "./FilesSidebarSkeleton";
import { FilesContentSkeleton } from "./FilesContentSkeleton";
import { useFilesFilters } from "../hooks/useFilesFilters";
import { useUploadManager } from "../hooks/useUploadManager";
import { useFileDownload } from "../hooks/useFileDownload";
import { applyFilters } from "../utils/file-filtering";
import { sortFiles } from "../utils/file-sorting";
import { inferFileKind } from "../utils/file-helpers";
import type { ProjectFile } from "../types";

type FilesPageClientProps = {
  projectId: string;
};

export function FilesPageClient({ projectId }: FilesPageClientProps) {
  const {
    query,
    sortBy,
    viewMode,
    typeFilter,
    statusFilter,
    setQuery,
    setSortBy,
    setViewMode,
    setTypeFilter,
    setStatusFilter,
  } = useFilesFilters();

  // ── Data fetching ──────────────────────────────────────────────────────────

  const { data: rawFiles, isLoading } = trpc.file.getAssets.useQuery({
    projectId,
  });

  // Map raw rows to ProjectFile shape
  const allFiles: ProjectFile[] = useMemo(() => {
    if (!rawFiles) return [];
    return rawFiles.map((row) => ({
      id: row.id,
      name: row.name,
      mimeType: row.type ?? "",
      fileKind: inferFileKind(row.type ?? ""),
      approvalStatus: row.approvalStatus as ProjectFile["approvalStatus"],
      versionNumber: row.versionNumber,
      sizeBytes: row.size,
      updatedAt: new Date(row.updatedAt),
      storagePath: row.storagePath,
    }));
  }, [rawFiles]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const filteredFiles = useMemo(
    () =>
      sortFiles(
        applyFilters(allFiles, query, typeFilter, statusFilter),
        sortBy,
      ),
    [allFiles, query, typeFilter, statusFilter, sortBy],
  );

  const recentFiles = useMemo(
    () =>
      [...allFiles]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 5),
    [allFiles],
  );

  // ── Upload ─────────────────────────────────────────────────────────────────

  const utils = trpc.useUtils();
  const { queue, addFiles, retry, remove } = useUploadManager({
    projectId,
    onSuccess: () => void utils.file.getAssets.invalidate({ projectId }),
  });

  // ── Download ───────────────────────────────────────────────────────────────

  const { downloadFile } = useFileDownload();

  // ── Upload scroll ──────────────────────────────────────────────────────────

  const scrollToDropzone = useCallback(() => {
    document
      .getElementById("upload-dropzone")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToViewAll = useCallback(() => {
    document
      .getElementById("view-all")
      ?.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest"});
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <>
        <FilesSidebarSkeleton />
        <FilesContentSkeleton />
      </>
    );
  }

  return (
    <>
      <FilesSidebar
        selectedType={typeFilter}
        onTypeChange={setTypeFilter}
        selectedStatus={statusFilter}
        onStatusChange={setStatusFilter}
        files={allFiles}
        onUploadClick={scrollToDropzone}
      />

      <FilesContent
        files={filteredFiles}
        recentFiles={recentFiles}
        query={query}
        onQueryChange={setQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewChange={setViewMode}
        typeFilter={typeFilter}
        totalCount={allFiles.length}
        uploadQueue={queue}
        onFilesAdded={addFiles}
        onRetry={retry}
        onRemove={remove}
        onDownload={downloadFile}
        onUploadClick={scrollToDropzone}
        onViewAll={scrollToViewAll}
      />
    </>
  );
}
