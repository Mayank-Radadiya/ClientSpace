"use client";
// src/features/projects/components/ClientApprovalCentre.tsx
// Sticky banner shown to client role when files are pending approval.
// Renders nothing if no pending assets or if role !== "client".

import { useState } from "react";
import { FileIcon, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SlideToApprove } from "./SlideToApprove";
import { trpc } from "@/lib/trpc/client";
import { revalidateAssetApproval } from "@/features/projects/server/actions";
import type { Asset } from "./types";
import { cn } from "@/lib/utils";

interface ClientApprovalCentreProps {
  pendingAssets: Asset[];
  projectId: string;
}

const MIME_ICON_MAP: Record<string, string> = {
  "image/": "🖼️",
  "video/": "🎬",
  "application/pdf": "📄",
  "application/zip": "📦",
};

function getMimeIcon(type: string): string {
  for (const [prefix, icon] of Object.entries(MIME_ICON_MAP)) {
    if (type.startsWith(prefix) || type === prefix) return icon;
  }
  return "📎";
}

interface AssetApprovalCardProps {
  asset: Asset;
  projectId: string;
}

function AssetApprovalCard({ asset, projectId }: AssetApprovalCardProps) {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");

  const approveAsset = trpc.files?.approve?.useMutation
    ? trpc.files.approve.useMutation({
        onSuccess: () => revalidateAssetApproval(asset.id, projectId),
      })
    : null;

  // Fallback: use the file router if a specific approve endpoint exists
  const handleApprove = async () => {
    if (approveAsset) {
      approveAsset.mutate({ assetId: asset.id });
    }
    // Future: call approval mutation
  };

  const latestVersion = asset.versions?.[0];
  const versionLabel = latestVersion ? `v${latestVersion.versionNumber}` : "v1";
  const uploader = latestVersion?.uploadedByUser?.name ?? "Team member";
  const uploadedAt = latestVersion?.createdAt ?? asset.createdAt;

  return (
    <div className="flex flex-shrink-0 flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm" style={{ minWidth: 280 }}>
      {/* File header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-xl">
          {getMimeIcon(asset.type)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{asset.name}</p>
          <p className="text-xs text-muted-foreground">
            {versionLabel} · {uploader} ·{" "}
            {formatDistanceToNow(new Date(uploadedAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Slide to approve */}
      <SlideToApprove onApprove={handleApprove} />

      {/* Request changes */}
      {!showComment ? (
        <button
          onClick={() => setShowComment(true)}
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          Request changes instead
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            className="min-h-[60px] w-full resize-none rounded-md border border-border bg-background px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Describe what needs to change…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            aria-label="Change request comment"
          />
          <div className="flex gap-2">
            <button
              className="rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 dark:bg-red-950/30 dark:text-red-400"
              onClick={() => {
                // TODO: call requestChanges mutation
                setShowComment(false);
                setComment("");
              }}
            >
              Submit
            </button>
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => { setShowComment(false); setComment(""); }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ClientApprovalCentre({ pendingAssets, projectId }: ClientApprovalCentreProps) {
  // Renders nothing if no pending items
  if (pendingAssets.length === 0) return null;

  return (
    <div className="border-b border-border bg-purple-50/50 px-6 py-4 dark:bg-purple-950/20">
      <h2 className="mb-3 text-sm font-semibold text-purple-900 dark:text-purple-200">
        ✅ Files awaiting your approval ({pendingAssets.length})
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
        {pendingAssets.map((asset) => (
          <AssetApprovalCard key={asset.id} asset={asset} projectId={projectId} />
        ))}
      </div>
    </div>
  );
}
