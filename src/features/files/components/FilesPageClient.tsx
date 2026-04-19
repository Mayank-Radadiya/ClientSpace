"use client";

import { useCallback, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc/client";

// Components
import { FilesSidebar } from "./FilesSidebar";
import { FilesContent } from "./FilesContent";
import { DeleteFileDialog } from "./DeleteFileDialog";

// Hooks & Utils
import { useFilesFilters } from "../hooks/useFilesFilters";
import { useUploadManager } from "../hooks/useUploadManager";
import { useFileDownload } from "../hooks/useFileDownload";
import { useFileDelete } from "../hooks/useFileDelete";
import { applyFilters } from "../utils/file-filtering";
import { sortFiles } from "../utils/file-sorting";
import { inferFileKind } from "../utils/file-helpers";
import type { RouterOutputs } from "@/lib/trpc/client";
// Types
import type { ProjectFile } from "../types";

type FilesPageClientProps = {
  projectId: string;
  initialFiles: RouterOutputs["file"]["getAssets"];
};

export function FilesPageClient({
  projectId,
  initialFiles,
}: FilesPageClientProps) {
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

  // 1. Upgrade to useSuspenseQuery to integrate with the parent's Suspense boundary
  const [rawFiles] = trpc.file.getAssets.useSuspenseQuery(
    { projectId },
    {
      initialData: initialFiles,
    },
  );

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
      updatedAt: new Date(row.updatedAt), // Parsed to Date here once
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
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()) // 2. Removed redundant Date parsing
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

  const handleDownload = useCallback(
    (storagePath: string, fileName: string) => {
      void downloadFile(storagePath, fileName);
    },
    [downloadFile],
  );

  // ── Delete ─────────────────────────────────────────────────────────────────

  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { deleteFile, isDeleting } = useFileDelete({
    projectId,
    onSuccess: () => setPendingDelete(null),
  });

  const handleDeleteRequest = useCallback(
    (assetId: string, fileName: string) => {
      setPendingDelete({ id: assetId, name: fileName });
    },
    [],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!pendingDelete) return;
    await deleteFile(pendingDelete.id);
  }, [deleteFile, pendingDelete]);

  // ── Scrolling ──────────────────────────────────────────────────────────────
  // Note: While refs are technically "React-pure", using IDs here is an acceptable
  // tradeoff to avoid prop-drilling refs deep into the FilesContent component.

  const scrollToDropzone = useCallback(() => {
    document.getElementById("upload-dropzone")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const scrollToViewAll = useCallback(() => {
    document.getElementById("view-all")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  // 3. Removed the manual if (isLoading) block. Suspense handles this natively.

  return (
    // 4. Added wrapper to perfectly match the parent Suspense layout and avoid CLS
    <div className="flex h-full w-full">
      <FilesSidebar
        selectedType={typeFilter}
        onTypeChange={setTypeFilter}
        selectedStatus={statusFilter}
        onStatusChange={setStatusFilter}
        files={allFiles}
        onUploadClick={scrollToDropzone}
      />

      <FilesContent
        projectId={projectId}
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
        onDownload={handleDownload}
        onDelete={handleDeleteRequest}
        onUploadClick={scrollToDropzone}
        onViewAll={scrollToViewAll}
      />

      <DeleteFileDialog
        fileName={pendingDelete?.name ?? ""}
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPendingDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
