"use client";

import { useMemo, useState, useTransition } from "react";
import { gooeyToast as toast } from "@/components/ui/goey-toaster";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SlideToApprove } from "./SlideToApprove";
import { updateAssetStatusAction } from "@/features/portal/server/actions";

type AssetStatus = "pending_review" | "approved" | "changes_requested";

interface PortalAssetListProps {
  assets: Array<{
    id: string;
    name: string;
    approvalStatus: string;
    currentVersion?: { versionNumber: number | null } | null;
  }>;
  projectId: string;
}

function toStatus(status: string): AssetStatus {
  if (status === "approved") return "approved";
  if (status === "changes_requested") return "changes_requested";
  return "pending_review";
}

function statusBadge(status: AssetStatus) {
  switch (status) {
    case "approved":
      return <Badge variant="success">Approved</Badge>;
    case "changes_requested":
      return <Badge variant="destructive">Changes Requested</Badge>;
    default:
      return <Badge variant="secondary">Pending Review</Badge>;
  }
}

export function PortalAssetList({ assets, projectId }: PortalAssetListProps) {
  const [isPending, startTransition] = useTransition();
  const [localStatuses, setLocalStatuses] = useState<
    Record<string, AssetStatus>
  >({});

  const mergedAssets = useMemo(
    () =>
      assets.map((asset) => ({
        ...asset,
        status: localStatuses[asset.id] ?? toStatus(asset.approvalStatus),
      })),
    [assets, localStatuses],
  );

  const updateStatus = (assetId: string, nextStatus: AssetStatus) => {
    const previous =
      localStatuses[assetId] ??
      toStatus(
        assets.find((asset) => asset.id === assetId)?.approvalStatus ??
          "pending_review",
      );

    setLocalStatuses((prev) => ({ ...prev, [assetId]: nextStatus }));

    startTransition(async () => {
      const result = await updateAssetStatusAction({
        assetId,
        projectId,
        status: nextStatus === "approved" ? "approved" : "changes_requested",
      });

      if ("error" in result) {
        setLocalStatuses((prev) => ({ ...prev, [assetId]: previous }));
        toast.error(result.error || "Failed to update status.");
        return;
      }

      toast.success(
        nextStatus === "approved" ? "File approved." : "Changes requested.",
      );
    });
  };

  if (mergedAssets.length === 0) {
    return (
      <div className="text-muted-foreground bg-card rounded-xl border p-6 text-sm">
        No files uploaded yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {mergedAssets.map((asset) => (
        <div key={asset.id} className="bg-card space-y-3 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{asset.name}</p>
              <p className="text-muted-foreground text-xs">
                Version {asset.currentVersion?.versionNumber ?? 1}
              </p>
            </div>
            {statusBadge(asset.status)}
          </div>

          {asset.status === "pending_review" ? (
            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
              <SlideToApprove
                onApprove={() => updateStatus(asset.id, "approved")}
                disabled={isPending}
              />
              <Button
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={() => updateStatus(asset.id, "changes_requested")}
              >
                Request Changes
              </Button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
