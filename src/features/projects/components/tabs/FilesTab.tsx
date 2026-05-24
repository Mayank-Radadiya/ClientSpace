"use client";
// src/features/projects/components/tabs/FilesTab.tsx
// Files grid with approval status badges and version counts.
// Uses trpc.files.list (existing filesRouter).

import { useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, CheckCircle, AlertCircle, Clock, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import type { OrgRole } from "../types";

const APPROVAL_CONFIG = {
  approved: {
    label: "Approved",
    icon: <CheckCircle size={11} className="text-green-600" />,
    badge: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/40",
  },
  pending_review: {
    label: "Pending",
    icon: <Clock size={11} className="text-amber-600" />,
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40",
  },
  changes_requested: {
    label: "Changes requested",
    icon: <AlertCircle size={11} className="text-red-600" />,
    badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40",
  },
} as const;

const MIME_PREVIEW_GRADIENT: Record<string, string> = {
  "image/": "from-blue-500/20 to-purple-500/20",
  "video/": "from-pink-500/20 to-rose-500/20",
  "application/pdf": "from-red-500/20 to-orange-500/20",
  "application/zip": "from-slate-500/20 to-slate-700/20",
};

function getPreviewGradient(type: string): string {
  for (const [prefix, gradient] of Object.entries(MIME_PREVIEW_GRADIENT)) {
    if (type.startsWith(prefix)) return gradient;
  }
  return "from-slate-500/10 to-slate-600/10";
}

interface FilesTabProps {
  projectId: string;
  role: OrgRole;
}

export function FilesTab({ projectId, role }: FilesTabProps) {
  const { data, isLoading } = trpc.files.list.useQuery(
    { projectId },
    { staleTime: Infinity, gcTime: 10 * 60 * 1000 },
  );

  const assets = data ?? [];

  const stats = useMemo(() => ({
    total: assets.length,
    approved: assets.filter((a) => a.approvalStatus === "approved").length,
    pending: assets.filter((a) => a.approvalStatus === "pending_review").length,
    changesRequested: assets.filter((a) => a.approvalStatus === "changes_requested").length,
  }), [assets]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" />
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <FileText size={32} className="opacity-30" />
        <p className="text-sm">No files uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{stats.total} files</span>
        <span className="text-green-600">✓ {stats.approved} approved</span>
        {stats.pending > 0 && <span className="text-amber-600">⏳ {stats.pending} pending</span>}
        {stats.changesRequested > 0 && <span className="text-red-600">! {stats.changesRequested} need changes</span>}
      </div>

      {/* Grid */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
        role="list"
      >
        {assets.map((asset, i) => {
          const approval = APPROVAL_CONFIG[asset.approvalStatus];
          const gradient = getPreviewGradient(asset.type);
          const versionCount = asset.versions?.length ?? 1;

          return (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              className="group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
              role="listitem"
              tabIndex={0}
              aria-label={`File: ${asset.name}, status: ${asset.approvalStatus}`}
            >
              {/* Preview area */}
              <div
                className={cn(
                  "flex h-28 items-center justify-center bg-gradient-to-br",
                  gradient,
                )}
              >
                <FileText size={28} className="text-foreground/40" />
              </div>

              {/* Info */}
              <div className="flex flex-col gap-1.5 px-3 py-2.5">
                <p className="truncate text-sm font-medium text-foreground">{asset.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {versionCount} version{versionCount !== 1 ? "s" : ""} ·{" "}
                  {asset.type.split("/")[0]}
                </p>

                {/* Approval badge */}
                <div
                  className={cn(
                    "mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                    approval.badge,
                  )}
                >
                  {approval.icon}
                  {approval.label}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
