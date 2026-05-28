"use client";
// src/features/projects/components/ClientApprovalCentre.tsx
// Sticky banner shown to client role when files are pending approval.
// Renders nothing if no pending assets or if role !== "client".

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { SlideToApprove } from "./SlideToApprove";
import { updateAssetStatusAction } from "@/features/portal/server/actions";
import { createCommentAction } from "@/features/comments/server/actions";
import { revalidateAssetApproval } from "@/features/projects/server/actions";
import type { Asset } from "./types";

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
  const [isPending, setIsPending] = useState(false);

  const handleApprove = async () => {
    setIsPending(true);
    try {
      const result = await updateAssetStatusAction({
        assetId: asset.id,
        projectId,
        status: "approved",
      });

      if (result && "error" in result) {
        console.error(result.error);
      } else {
        await revalidateAssetApproval(asset.id, projectId);
      }
    } catch (err) {
      console.error("Failed to approve asset", err);
    } finally {
      setIsPending(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!comment.trim()) return;
    setIsPending(true);
    try {
      const result = await updateAssetStatusAction({
        assetId: asset.id,
        projectId,
        status: "changes_requested",
      });

      if (result && "error" in result) {
        console.error(result.error);
        return;
      }

      const commentResult = await createCommentAction({
        body: comment,
        assetId: asset.id,
      });

      if (commentResult && "error" in commentResult) {
        console.error(commentResult.error);
      }

      await revalidateAssetApproval(asset.id, projectId);
      setShowComment(false);
      setComment("");
    } catch (err) {
      console.error("Failed to request changes", err);
    } finally {
      setIsPending(false);
    }
  };

  const latestVersion = asset.versions?.[0];
  const versionLabel = latestVersion ? `v${latestVersion.versionNumber}` : "v1";
  const uploader = latestVersion?.uploadedByUser?.name ?? "Team member";
  const uploadedAt = latestVersion?.createdAt ?? asset.createdAt;

  return (
    <div
      className="border-border bg-card flex shrink-0 flex-col gap-3 rounded-lg border p-4 shadow-sm"
      style={{ minWidth: 280 }}
    >
      {/* File header */}
      <div className="flex items-start gap-3">
        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-md text-xl">
          {getMimeIcon(asset.type)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-medium">
            {asset.name}
          </p>
          <p className="text-muted-foreground text-xs">
            {versionLabel} · {uploader} ·{" "}
            {formatDistanceToNow(new Date(uploadedAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Slide to approve */}
      <SlideToApprove onApprove={handleApprove} disabled={isPending} />

      {/* Request changes */}
      {!showComment ? (
        <button
          onClick={() => setShowComment(true)}
          disabled={isPending}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring text-xs underline-offset-2 hover:underline focus-visible:ring-1 focus-visible:outline-none disabled:opacity-50"
        >
          Request changes instead
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring min-h-[60px] w-full resize-none rounded-md border px-2.5 py-2 text-xs focus:ring-1 focus:outline-none"
            placeholder="Describe what needs to change…"
            value={comment}
            disabled={isPending}
            onChange={(e) => setComment(e.target.value)}
            aria-label="Change request comment"
          />
          <div className="flex gap-2">
            <button
              className="rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 focus-visible:ring-1 focus-visible:ring-red-500 focus-visible:outline-none dark:bg-red-950/30 dark:text-red-400 disabled:opacity-50"
              disabled={isPending || !comment.trim()}
              onClick={handleRequestChanges}
            >
              Submit
            </button>
            <button
              className="text-muted-foreground hover:text-foreground text-xs"
              onClick={() => {
                setShowComment(false);
                setComment("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ClientApprovalCentre({
  pendingAssets,
  projectId,
}: ClientApprovalCentreProps) {
  // Renders nothing if no pending items
  if (pendingAssets.length === 0) return null;

  return (
    <div className="border-border border-b bg-purple-50/50 px-6 py-4 dark:bg-purple-950/20">
      <h2 className="mb-3 text-sm font-semibold text-purple-900 dark:text-purple-200">
        ✅ Files awaiting your approval ({pendingAssets.length})
      </h2>
      <div className="scrollbar-none flex gap-4 overflow-x-auto pb-2">
        {pendingAssets.map((asset) => (
          <AssetApprovalCard
            key={asset.id}
            asset={asset}
            projectId={projectId}
          />
        ))}
      </div>
    </div>
  );
}
