"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Archive,
  ChevronRight,
  Download,
  FileIcon,
  FileText,
  FolderIcon,
  History,
  Image,
  MoreVertical,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ─── Approval Badge Config ───────────────────────────────────────────────────

const APPROVAL_BADGE: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending_review: "outline",
  approved: "default",
  changes_requested: "destructive",
};

const APPROVAL_LABELS: Record<string, string> = {
  pending_review: "Pending Review",
  approved: "Approved",
  changes_requested: "Changes Requested",
};

// ─── File Type Icon Resolver ─────────────────────────────────────────────────

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.includes("pdf") || mimeType.includes("document"))
    return FileText;
  if (mimeType.includes("zip") || mimeType.includes("rar")) return Archive;
  return FileIcon;
}

// ─── File Size Formatter ─────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]!}`;
}

// ─── AssetList Component ─────────────────────────────────────────────────────

export function AssetList({ projectId }: { projectId: string }) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<
    { id: string | null; name: string }[]
  >([{ id: null, name: "Files" }]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // ─── tRPC Queries ──────────────────────────────────────────────────────────

  const isValidProject = !!projectId && projectId !== "undefined";

  const assetsQuery = trpc.file.getAssets.useQuery(
    { projectId, folderId: currentFolderId },
    { enabled: isValidProject },
  );
  const foldersQuery = trpc.file.getFolders.useQuery(
    { projectId, parentId: currentFolderId },
    { enabled: isValidProject },
  );
  const versionsQuery = trpc.file.getVersionHistory.useQuery(
    { assetId: selectedAssetId! },
    { enabled: !!selectedAssetId },
  );
  // useMutation — callable imperatively from onClick (not a hook violation)
  const downloadMutation = trpc.file.getSignedDownloadUrl.useMutation({
    onSuccess: (data) => window.open(data.url, "_blank"),
  });

  // ─── Navigation ────────────────────────────────────────────────────────────

  const enterFolder = (id: string, name: string) => {
    setCurrentFolderId(id);
    setBreadcrumbs((prev) => [...prev, { id, name }]);
  };

  const navigateTo = (index: number) => {
    const crumb = breadcrumbs[index]!;
    setCurrentFolderId(crumb.id);
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  // ─── Derived State ─────────────────────────────────────────────────────────

  const isLoading = assetsQuery.isLoading || foldersQuery.isLoading;
  const allFolders = foldersQuery.data ?? [];
  const allAssets = assetsQuery.data ?? [];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          {/* Breadcrumb navigation */}
          <div className="text-muted-foreground mb-2 flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.id ?? "root"} className="flex items-center">
                {i > 0 && <ChevronRight className="mx-1 h-3 w-3" />}
                <button
                  onClick={() => navigateTo(i)}
                  className={
                    i === breadcrumbs.length - 1
                      ? "text-foreground font-medium"
                      : "hover:text-foreground transition-colors"
                  }
                >
                  {crumb.name}
                </button>
              </span>
            ))}
          </div>
          <CardTitle className="text-lg">Project Files</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-muted h-14 animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : allFolders.length === 0 && allAssets.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center">
              <FileIcon className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p className="font-medium">No files yet</p>
              <p className="mt-1 text-sm">
                Upload your first deliverable above
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {allFolders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => enterFolder(folder.id, folder.name)}
                  className="hover:bg-accent flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors"
                >
                  <FolderIcon className="h-5 w-5 shrink-0 text-yellow-500" />
                  <span className="text-sm font-medium">{folder.name}</span>
                  <ChevronRight className="text-muted-foreground ml-auto h-4 w-4" />
                </button>
              ))}

              {allAssets.map((asset) => {
                const Icon = getFileIcon(asset.type);
                return (
                  <div
                    key={asset.id}
                    className="hover:bg-accent/50 group flex items-center gap-3 rounded-lg p-3 transition-colors"
                  >
                    <Icon className="text-muted-foreground h-5 w-5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {asset.name}
                      </p>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        {asset.size != null && (
                          <span>{formatFileSize(asset.size)}</span>
                        )}
                        {asset.versionNumber != null && (
                          <span>v{asset.versionNumber}</span>
                        )}
                        {asset.updatedAt && (
                          <span>
                            {formatDistanceToNow(new Date(asset.updatedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        APPROVAL_BADGE[asset.approvalStatus] ?? "outline"
                      }
                      className="shrink-0 text-xs"
                    >
                      {APPROVAL_LABELS[asset.approvalStatus] ??
                        asset.approvalStatus}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            asset.storagePath &&
                            downloadMutation.mutate({
                              storagePath: asset.storagePath,
                            })
                          }
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSelectedAssetId(asset.id)}
                        >
                          <History className="mr-2 h-4 w-4" />
                          Version History
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version History Side Panel */}
      <Sheet
        open={!!selectedAssetId}
        onOpenChange={(open) => !open && setSelectedAssetId(null)}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Version History</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {versionsQuery.isLoading
              ? [1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-muted h-16 animate-pulse rounded-lg"
                  />
                ))
              : versionsQuery.data?.map((version) => (
                  <div
                    key={version.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Version {version.versionNumber}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {version.uploaderName ?? "Unknown"} •{" "}
                        {version.size != null
                          ? formatFileSize(version.size)
                          : "—"}{" "}
                        •{" "}
                        {formatDistanceToNow(new Date(version.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        downloadMutation.mutate({
                          storagePath: version.storagePath,
                        })
                      }
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </Button>
                  </div>
                ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
