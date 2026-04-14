"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Folder as FolderType, Asset } from "../types";
import {
  Folder,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  List,
  UploadCloud,
  MoreVertical,
  FilePlus2,
  Download,
  Trash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface FilesTabProps {
  folders: FolderType[];
  assets: Asset[];
  onUpload: (files: File[]) => void;
  onDeleteAsset: (id: string) => void;
}

export function FilesTab({
  folders,
  assets,
  onUpload,
  onDeleteAsset,
}: FilesTabProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

  const displayedAssets = selectedFolderId
    ? assets.filter((a) => a.folder_id === selectedFolderId)
    : assets; // Or filter top-level only

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(Array.from(e.dataTransfer.files));
    }
  };

  const isImage = (type: string) => type.startsWith("image/");

  return (
    <div className="bg-background flex h-[600px] flex-col overflow-hidden rounded-lg border md:flex-row">
      {/* Sidebar - Folders */}
      <div className="bg-muted/10 flex w-full shrink-0 flex-col border-r md:w-60">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-sm font-semibold">Folders</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <FilePlus2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm ${!selectedFolderId ? "bg-accent/50 font-medium" : "text-muted-foreground"}`}
          >
            <Folder className="h-4 w-4" /> All Files
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFolderId(f.id)}
              className={`hover:bg-accent mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 pl-6 text-sm ${selectedFolderId === f.id ? "bg-accent/50 font-medium" : "text-muted-foreground"}`}
            >
              <Folder className="h-4 w-4" /> {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content - Files */}
      <div
        className="relative flex flex-1 flex-col"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
      >
        <div className="bg-card flex shrink-0 items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.multiple = true;
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files?.length) onUpload(Array.from(target.files));
                };
                input.click();
              }}
            >
              <UploadCloud className="mr-2 h-4 w-4" /> Upload
            </Button>
          </div>
          <div className="bg-muted flex items-center rounded-md p-0.5">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {displayedAssets.length === 0 ? (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center">
              <UploadCloud className="mb-2 h-10 w-10 opacity-20" />
              <p>Drag and drop files here</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {displayedAssets.map((a) => (
                <div
                  key={a.id}
                  className="group hover:bg-accent/50 relative flex cursor-pointer flex-col gap-2 rounded-lg border p-2 transition-colors"
                >
                  <div
                    className="bg-muted flex aspect-square items-center justify-center overflow-hidden rounded-md"
                    onClick={() => setPreviewAsset(a)}
                  >
                    {isImage(a.type) ? (
                      <ImageIcon className="h-8 w-8 opacity-50" />
                    ) : (
                      <FileText className="h-8 w-8 opacity-50" />
                    )}
                  </div>
                  <p
                    className="truncate text-center text-xs font-medium"
                    title={a.name}
                  >
                    {a.name}
                  </p>
                  <div className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-6 w-6"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteAsset(a.id)}
                          className="text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground border-border border-b text-left">
                  <tr>
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {displayedAssets.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/30">
                      <td
                        className="flex cursor-pointer items-center gap-2 p-3 font-medium"
                        onClick={() => setPreviewAsset(a)}
                      >
                        {isImage(a.type) ? (
                          <ImageIcon className="text-primary h-4 w-4" />
                        ) : (
                          <FileText className="text-muted-foreground h-4 w-4" />
                        )}
                        {a.name}
                      </td>
                      <td className="text-muted-foreground p-3">
                        {format(new Date(a.created_at), "MMM d, yyyy")}
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteAsset(a.id)}
                          className="text-destructive h-8 w-8"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {previewAsset && (
        <Dialog
          open={!!previewAsset}
          onOpenChange={(o) => (!o ? setPreviewAsset(null) : null)}
        >
          <DialogContent className="border-border bg-card max-w-3xl overflow-hidden p-0">
            <div className="bg-muted/30 flex h-12 items-center justify-between border-b px-4">
              <span className="text-sm font-semibold">{previewAsset.name}</span>
            </div>
            <div className="flex min-h-[400px] items-center justify-center bg-zinc-950/20 p-8">
              {isImage(previewAsset.type) ? (
                <div className="text-muted-foreground flex flex-col items-center">
                  <ImageIcon className="mb-4 h-12 w-12 opacity-50" />
                  <p>Image preview placeholder</p>
                </div>
              ) : (
                <div className="text-muted-foreground flex flex-col items-center">
                  <FileText className="mb-4 h-12 w-12 opacity-50" />
                  <p>No preview available for this file type</p>
                  <Button variant="outline" className="mt-4">
                    <Download className="mr-2 h-4 w-4" /> Download File
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
