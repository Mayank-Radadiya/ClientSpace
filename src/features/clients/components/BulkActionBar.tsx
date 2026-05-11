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
          <div className="bg-popover/90 border-border flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl">
            {/* Count pill */}
            <div className="bg-primary/15 border-primary/25 flex items-center gap-2 rounded-full border px-3 py-1.5">
              <span className="text-primary text-[11px] font-[var(--font-data)] font-bold tracking-[0.15em] uppercase">
                {count} selected
              </span>
            </div>

            <div className="bg-border h-5 w-px" />

            {/* Actions */}
            <button
              onClick={onArchive}
              disabled={archiving}
              className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-[var(--font-data)] font-semibold tracking-[0.12em] uppercase transition-all disabled:opacity-50"
            >
              <Archive className="h-3.5 w-3.5" />
              Archive
            </button>

            <button
              onClick={onExport}
              className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-[var(--font-data)] font-semibold tracking-[0.12em] uppercase transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>

            <button
              onClick={onDelete}
              disabled={deleting}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-[var(--font-data)] font-semibold tracking-[0.12em] uppercase transition-all",
                "text-destructive hover:bg-destructive/10 disabled:opacity-50",
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>

            <div className="bg-border h-5 w-px" />

            {/* Dismiss */}
            <button
              onClick={onClear}
              className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-7 w-7 items-center justify-center rounded-full transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
