"use client";

/**
 * PortalAssetList — asset review hub for the client portal
 *
 * Behaviours:
 *   • Individual assets: click "Approve" to flip the card (rotateY 180°)
 *     – Card-flip is a micro-interaction only; does NOT trigger Inngest
 *   • "Review & Annotate" opens the collaborative proofing canvas in full-viewport overlay
 *   • "Request Changes" button stays unchanged for assets in any non-approved state
 *   • Final SlideToApprove appears when ≥1 asset is in pending_review / changes_requested
 *     and there are no pre-existing fully-approved blocks
 *   • Successful slide triggers bulkApproveForProject (tRPC) which:
 *       - Updates all asset statuses → approved
 *       - Marks next milestone as completed
 *       - Fires 'project/milestone.completed' Inngest event
 *   • Full-page success overlay (AnimatePresence) auto-dismisses after 3s
 *   • Confetti fires inside SlideToApprove on server confirmation
 */

import { useMemo, useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, MessageSquare } from "lucide-react";
import { gooeyToast as toast } from "@/components/ui/goey-toaster";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { SlideToApprove } from "./SlideToApprove";
import { updateAssetStatusAction } from "@/features/portal/server/actions";
import { ProofingCanvas } from "@/features/portal/proofing/ProofingCanvas";

// ─── Types ────────────────────────────────────────────────────────────────────
type AssetStatus = "pending_review" | "approved" | "changes_requested";

export interface PortalAssetListProps {
  assets: Array<{
    id: string;
    name: string;
    type: string;
    approvalStatus: string;
    currentVersion?: { versionNumber: number | null } | null;
    signedUrl: string | null;
    openAnnotationsCount: number;
    hasAnnotations: boolean;
    initialAnnotations: any[];
  }>;
  projectId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  currentUserRole: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toStatus(status: string): AssetStatus {
  if (status === "approved") return "approved";
  if (status === "changes_requested") return "changes_requested";
  return "pending_review";
}

function StatusBadge({ status }: { status: AssetStatus }) {
  switch (status) {
    case "approved":
      return <Badge variant="success">Approved</Badge>;
    case "changes_requested":
      return <Badge variant="destructive">Changes Requested</Badge>;
    default:
      return <Badge variant="secondary">Pending Review</Badge>;
  }
}

// ─── Card-flip back face ──────────────────────────────────────────────────────
function ApprovedBackFace() {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl"
      style={{
        backfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
        background: "oklch(0.872 0.107 152.814)",
        border: "1px solid oklch(0.696 0.17 162.48)",
      }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.15 }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="oklch(0.265 0.09 162.48)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12l5 5L20 7" />
        </svg>
      </motion.div>
      <p className="text-sm font-semibold" style={{ color: "oklch(0.265 0.09 162.48)" }}>
        Approved
      </p>
    </div>
  );
}

// ─── Asset card with flip animation ──────────────────────────────────────────
interface AssetCardProps {
  asset: {
    id: string;
    name: string;
    type: string;
    status: AssetStatus;
    currentVersion?: { versionNumber: number | null } | null;
    openAnnotationsCount: number;
    hasAnnotations: boolean;
    signedUrl: string | null;
    initialAnnotations: any[];
  };
  bulkApprovalDone: boolean;
  onIndividualApprove: (id: string) => void;
  onRequestChanges: (id: string) => void;
  isPending: boolean;
  onReview: () => void;
}

function AssetCard({
  asset,
  bulkApprovalDone,
  onIndividualApprove,
  onRequestChanges,
  isPending,
  onReview,
}: AssetCardProps) {
  const [flipped, setFlipped] = useState(
    asset.status === "approved" || bulkApprovalDone,
  );

  const handleApprove = () => {
    setFlipped(true);
    onIndividualApprove(asset.id);
  };

  // When bulk approval completes, flip all cards
  const isApproved = bulkApprovalDone || flipped || asset.status === "approved";

  return (
    <div style={{ perspective: "800px", height: 130, position: "relative" }}>
      <motion.div
        animate={{ rotateY: isApproved ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Front face */}
        <div
          className="bg-card absolute inset-0 flex flex-col justify-between rounded-xl border p-4 shadow-sm"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{asset.name}</p>
                {asset.openAnnotationsCount > 0 ? (
                  <Badge className="text-[10px] py-0 px-1.5 shrink-0 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 uppercase font-bold tracking-wider">
                    {asset.openAnnotationsCount} open feedback
                  </Badge>
                ) : asset.hasAnnotations ? (
                  <Badge className="text-[10px] py-0 px-1.5 shrink-0 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 uppercase font-bold tracking-wider">
                    All resolved
                  </Badge>
                ) : null}
              </div>
              <p className="text-muted-foreground text-xs">
                Version {asset.currentVersion?.versionNumber ?? 1}
              </p>
            </div>
            <StatusBadge status={asset.status} />
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="outline"
              onClick={onReview}
              className="flex-1 text-[11px] gap-1 hover:bg-muted"
            >
              💬 Review & Annotate
            </Button>

            {asset.status !== "approved" && !bulkApprovalDone ? (
              <>
                <Button
                  size="xs"
                  variant="outline"
                  disabled={isPending}
                  onClick={handleApprove}
                  className="flex-1 text-[11px] border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                >
                  ✓ Approve
                </Button>
                {asset.status === "pending_review" ||
                asset.status === "changes_requested" ? (
                  <Button
                    size="xs"
                    variant="destructive"
                    disabled={isPending}
                    onClick={() => onRequestChanges(asset.id)}
                    className="flex-1 text-[11px]"
                  >
                    Request Changes
                  </Button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        {/* Back face */}
        <ApprovedBackFace />
      </motion.div>
    </div>
  );
}

// ─── Full-page success overlay ────────────────────────────────────────────────
function SuccessOverlay({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 px-6"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
    >
      <motion.div
        initial={{ scale: 0.8, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="bg-card flex max-w-sm flex-col items-center gap-4 rounded-2xl border p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated checkmark */}
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "oklch(0.872 0.107 152.814)" }}
        >
          <motion.svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="oklch(0.265 0.09 162.48)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          >
            <motion.path
              d="M5 12l5 5L20 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            />
          </motion.svg>
        </div>

        <div>
          <h2 className="text-foreground text-lg font-semibold">
            All assets approved!
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Your agency has been notified and your project is moving forward.
          </p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          Click anywhere to dismiss
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function PortalAssetList({
  assets,
  projectId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  currentUserRole,
}: PortalAssetListProps) {
  // Local status overrides (optimistic for individual approvals)
  const [localStatuses, setLocalStatuses] = useState<Record<string, AssetStatus>>({});
  const [isPending, setIsPending] = useState(false);
  const [bulkApprovalDone, setBulkApprovalDone] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [activeProofingAsset, setActiveProofingAsset] = useState<any | null>(null);

  const bulkMutation = trpc.portal.bulkApproveForProject.useMutation();

  // Merge DB statuses with local optimistic state
  const mergedAssets = useMemo(
    () =>
      assets.map((asset) => ({
        ...asset,
        status: localStatuses[asset.id] ?? toStatus(asset.approvalStatus),
      })),
    [assets, localStatuses],
  );

  // Determine if the slide-to-approve should be visible
  const hasPendingAssets = mergedAssets.some(
    (a) =>
      a.status === "pending_review" || a.status === "changes_requested",
  );

  const shouldShowSlider = hasPendingAssets && !bulkApprovalDone;

  // ── Individual approve (card-flip only, no Inngest) ─────────────────────
  const handleIndividualApprove = useCallback(
    (assetId: string) => {
      const previous =
        localStatuses[assetId] ??
        toStatus(
          assets.find((a) => a.id === assetId)?.approvalStatus ?? "pending_review",
        );

      setLocalStatuses((prev) => ({ ...prev, [assetId]: "approved" }));
      setIsPending(true);

      updateAssetStatusAction({ assetId, projectId, status: "approved" })
        .then((result) => {
          if ("error" in result) {
            setLocalStatuses((prev) => ({ ...prev, [assetId]: previous }));
            toast.error(result.error || "Failed to approve file.");
          }
          // Individual approval does NOT trigger Inngest — only final slide does
        })
        .catch(() => {
          setLocalStatuses((prev) => ({ ...prev, [assetId]: previous }));
          toast.error("Network error. Please try again.");
        })
        .finally(() => setIsPending(false));
    },
    [assets, localStatuses, projectId],
  );

  // ── Request changes ─────────────────────────────────────────────────────
  const handleRequestChanges = useCallback(
    (assetId: string) => {
      const previous =
        localStatuses[assetId] ??
        toStatus(
          assets.find((a) => a.id === assetId)?.approvalStatus ?? "pending_review",
        );

      setLocalStatuses((prev) => ({ ...prev, [assetId]: "changes_requested" }));
      setIsPending(true);

      updateAssetStatusAction({
        assetId,
        projectId,
        status: "changes_requested",
      })
        .then((result) => {
          if ("error" in result) {
            setLocalStatuses((prev) => ({ ...prev, [assetId]: previous }));
            toast.error(result.error || "Failed to request changes.");
            return;
          }
          toast.success("Changes requested.");
        })
        .catch(() => {
          setLocalStatuses((prev) => ({ ...prev, [assetId]: previous }));
          toast.error("Network error. Please try again.");
        })
        .finally(() => setIsPending(false));
    },
    [assets, localStatuses, projectId],
  );

  // ── Bulk approval (called by SlideToApprove.onApproved) ────────────────
  const handleBulkApprove = useCallback(async () => {
    await bulkMutation.mutateAsync({ projectId });
    // On success → SlideToApprove enters success state, then we show overlay
    setBulkApprovalDone(true);
    setShowSuccessOverlay(true);
    // Auto-dismiss overlay after 3s
    setTimeout(() => setShowSuccessOverlay(false), 3000);
  }, [bulkMutation, projectId]);

  // ── Empty state ─────────────────────────────────────────────────────────
  if (mergedAssets.length === 0) {
    return (
      <div className="text-muted-foreground bg-card rounded-xl border p-6 text-sm">
        No files uploaded yet.
      </div>
    );
  }

  return (
    <>
      {/* Success overlay */}
      <AnimatePresence>
        {showSuccessOverlay && (
          <SuccessOverlay onDismiss={() => setShowSuccessOverlay(false)} />
        )}
      </AnimatePresence>

      {/* Proofing Canvas Modal Dialog overlay */}
      <AnimatePresence>
        {activeProofingAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-6xl h-[90vh] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/10">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">
                    {activeProofingAsset.name}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Click anywhere on the file to add pins and drop review comments.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setActiveProofingAsset(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Proofing canvas frame */}
              <div className="flex-1 overflow-hidden relative">
                <ProofingCanvas
                  assetUrl={activeProofingAsset.signedUrl ?? ""}
                  assetType={activeProofingAsset.type.includes("pdf") ? "pdf" : "image"}
                  assetId={activeProofingAsset.id}
                  initialAnnotations={activeProofingAsset.initialAnnotations ?? []}
                  canAddAnnotations={
                    activeProofingAsset.status !== "approved" && !bulkApprovalDone
                  }
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  currentUserAvatar={currentUserAvatar}
                  currentUserRole={currentUserRole}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {/* Asset cards */}
        <div className="space-y-3">
          {mergedAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              bulkApprovalDone={bulkApprovalDone}
              onIndividualApprove={handleIndividualApprove}
              onRequestChanges={handleRequestChanges}
              isPending={isPending}
              onReview={() => setActiveProofingAsset(asset)}
            />
          ))}
        </div>

        {/* Final bulk approval — only visible when pending assets exist */}
        <AnimatePresence>
          {shouldShowSlider && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="bg-card space-y-2 rounded-2xl border p-4"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">Final Approval</p>
                <p className="text-muted-foreground text-xs">
                  Approving all assets notifies your agency and advances your
                  project milestone.
                </p>
              </div>
              <SlideToApprove
                label="Slide to approve all"
                sublabel="This will mark all pending assets as approved"
                onApproved={handleBulkApprove}
                disabled={isPending}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Permanent approved state banner (shown after bulk approval) */}
        <AnimatePresence>
          {bulkApprovalDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="flex items-center gap-3 rounded-2xl border p-4"
              style={{
                background: "oklch(0.96 0.04 152.814)",
                borderColor: "oklch(0.696 0.17 162.48)",
              }}
            >
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                style={{ background: "oklch(0.527 0.154 162.48)" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12l5 5L20 7" />
                </svg>
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "oklch(0.265 0.09 162.48)" }}
                >
                  All assets approved
                </p>
                <p className="text-xs" style={{ color: "oklch(0.432 0.132 162.48)" }}>
                  Your agency has been notified. Approval is final.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
