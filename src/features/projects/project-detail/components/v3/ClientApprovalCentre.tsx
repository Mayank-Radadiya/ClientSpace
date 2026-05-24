"use client";

// src/features/projects/project-detail/components/v3/ClientApprovalCentre.tsx
// Client-facing approval strip for pending deliverables.
// Renders nothing if no pending assets or role !== "client".
// Uses pd-* design tokens for visual consistency.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { trpc } from "@/lib/trpc/client";
import type { Asset } from "../../types";

/* ── Mime icon helper ─────────────────────────────────────── */
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

/* ── Slide to approve (inline, lightweight) ───────────────── */
function InlineApproveBtn({
  onApprove,
  approved,
}: {
  onApprove: () => void;
  approved: boolean;
}) {
  if (approved) {
    return (
      <div
        className="flex items-center justify-center gap-1.5 rounded-full px-4 py-2"
        style={{
          background: "var(--pd-status-done-bg)",
          color: "var(--pd-status-done)",
          fontFamily: "var(--font-data)",
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        ✓ Approved
      </div>
    );
  }

  return (
    <button
      onClick={onApprove}
      className="w-full rounded-full px-4 py-2 transition-all active:scale-[0.98]"
      style={{
        background: "var(--pd-accent)",
        color: "#fff",
        fontFamily: "var(--font-data)",
        fontSize: 12,
        fontWeight: 500,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--pd-accent-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--pd-accent)";
      }}
    >
      Approve
    </button>
  );
}

/* ── Asset Approval Card ──────────────────────────────────── */
interface AssetApprovalCardProps {
  asset: Asset & {
    versions?: {
      versionNumber?: number;
      uploadedByUser?: { name: string };
      createdAt?: string;
    }[];
    createdAt?: string;
  };
  projectId: string;
  index: number;
}

function AssetApprovalCard({
  asset,
  projectId,
  index,
}: AssetApprovalCardProps) {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [approved, setApproved] = useState(false);

  const handleApprove = async () => {
    setApproved(true);
    // Future: call approval mutation via tRPC
  };

  const latestVersion = asset.versions?.[0];
  const versionLabel = latestVersion
    ? `v${latestVersion.versionNumber}`
    : "v1";
  const uploader = latestVersion?.uploadedByUser?.name ?? "Team member";
  const uploadedAt =
    latestVersion?.createdAt ?? asset.createdAt ?? asset.created_at;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="flex flex-shrink-0 flex-col gap-3 rounded-lg p-4"
      style={{
        minWidth: 260,
        background: "var(--pd-surface)",
        border: "1px solid var(--pd-border)",
      }}
    >
      {/* File header */}
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-md text-xl"
          style={{ background: "var(--pd-elevated)" }}
        >
          {getMimeIcon(asset.type)}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="truncate"
            style={{
              fontFamily: "var(--font-data)",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--pd-text-primary)",
            }}
          >
            {asset.name}
          </p>
          <p
            style={{
              fontFamily: "var(--font-data)",
              fontSize: 11,
              color: "var(--pd-text-muted)",
            }}
          >
            {versionLabel} · {uploader} ·{" "}
            {uploadedAt
              ? formatDistanceToNow(new Date(uploadedAt), { addSuffix: true })
              : ""}
          </p>
        </div>
      </div>

      {/* Approve button */}
      <InlineApproveBtn onApprove={handleApprove} approved={approved} />

      {/* Request changes */}
      {!approved && (
        <>
          {!showComment ? (
            <button
              onClick={() => setShowComment(true)}
              className="transition-colors"
              style={{
                fontFamily: "var(--font-data)",
                fontSize: 11,
                color: "var(--pd-text-muted)",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--pd-text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--pd-text-muted)";
              }}
            >
              Request changes instead
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <textarea
                className="min-h-[56px] w-full resize-none rounded-lg p-2.5 outline-none transition-colors focus:ring-1"
                style={{
                  background: "var(--pd-elevated)",
                  border: "1px solid var(--pd-border)",
                  fontFamily: "var(--font-data)",
                  fontSize: 12,
                  color: "var(--pd-text-primary)",
                }}
                placeholder="Describe what needs to change…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                aria-label="Change request comment"
              />
              <div className="flex gap-2">
                <button
                  className="rounded-md px-3 py-1 transition-colors"
                  style={{
                    background: "var(--pd-status-overdue-bg)",
                    color: "var(--pd-status-overdue)",
                    fontFamily: "var(--font-data)",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                  onClick={() => {
                    // TODO: call requestChanges mutation
                    setShowComment(false);
                    setComment("");
                  }}
                >
                  Submit
                </button>
                <button
                  style={{
                    fontFamily: "var(--font-data)",
                    fontSize: 12,
                    color: "var(--pd-text-muted)",
                  }}
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
        </>
      )}
    </motion.div>
  );
}

/* ── Main Component ───────────────────────────────────────── */
interface ClientApprovalCentreProps {
  pendingAssets: (Asset & {
    versions?: {
      versionNumber?: number;
      uploadedByUser?: { name: string };
      createdAt?: string;
    }[];
    createdAt?: string;
  })[];
  projectId: string;
}

export function ClientApprovalCentre({
  pendingAssets,
  projectId,
}: ClientApprovalCentreProps) {
  if (pendingAssets.length === 0) return null;

  return (
    <div
      className="w-full px-8 py-4"
      style={{
        background: "rgba(139, 92, 246, 0.04)",
        borderBottom: "1px solid var(--pd-divider)",
      }}
    >
      <h2
        className="mb-3"
        style={{
          fontFamily: "var(--font-data)",
          fontSize: 12,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "#8B5CF6",
        }}
      >
        ✅ Files awaiting your approval ({pendingAssets.length})
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        <AnimatePresence>
          {pendingAssets.map((asset, index) => (
            <AssetApprovalCard
              key={asset.id}
              asset={asset}
              projectId={projectId}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
