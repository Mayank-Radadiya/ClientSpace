"use client";

import { AnimatePresence, motion } from "motion/react";
import { Archive, Download, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type BulkActionBarProps = {
  count: number;
  onClear: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onExport: () => void;
  archiving?: boolean;
  deleting?: boolean;
};

export function BulkActionBar({
  count,
  onClear,
  onArchive,
  onDelete,
  onExport,
  archiving,
  deleting,
}: BulkActionBarProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-8 left-1/2 z-40 -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(17,17,24,0.92)] px-4 py-3 shadow-2xl backdrop-blur-xl">
            {/* Count pill */}
            <div className="flex items-center gap-2 rounded-full bg-[rgba(79,127,255,0.15)] border border-[rgba(79,127,255,0.25)] px-3 py-1.5">
              <span className="text-[11px] font-bold tracking-[0.15em] text-[#4F7FFF] uppercase font-[var(--font-data)]">
                {count} selected
              </span>
            </div>

            <div className="h-5 w-px bg-[rgba(255,255,255,0.08)]" />

            {/* Actions */}
            <button
              onClick={onArchive}
              disabled={archiving}
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-[#6B6B7E] transition-all hover:bg-[rgba(255,255,255,0.06)] hover:text-[#F2F2F5] disabled:opacity-50 font-[var(--font-data)]"
            >
              <Archive className="h-3.5 w-3.5" />
              Archive
            </button>

            <button
              onClick={onExport}
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-[#6B6B7E] transition-all hover:bg-[rgba(255,255,255,0.06)] hover:text-[#F2F2F5] font-[var(--font-data)]"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>

            <button
              onClick={onDelete}
              disabled={deleting}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase transition-all font-[var(--font-data)]",
                "text-[#EF4444] hover:bg-[rgba(239,68,68,0.08)] disabled:opacity-50",
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>

            <div className="h-5 w-px bg-[rgba(255,255,255,0.08)]" />

            {/* Dismiss */}
            <button
              onClick={onClear}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#6B6B7E] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#F2F2F5] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
