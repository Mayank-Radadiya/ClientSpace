"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Send, FileDown, Trash2, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InvoiceBulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onSend: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onMarkPaid: () => void;
}

export function InvoiceBulkActionBar({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
  onSend,
  onDownload,
  onDelete,
  onMarkPaid,
}: InvoiceBulkActionBarProps) {
  const canSelectAll = selectedCount > 0 && selectedCount < totalCount;

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "fixed right-4 bottom-6 left-4 z-50 rounded-2xl p-1.5 shadow-2xl md:right-auto md:left-1/2 md:w-max md:-translate-x-1/2 md:rounded-full",
            "bg-[var(--inv-surface)]/80 backdrop-blur-xl border border-[var(--inv-border)]",
            "motion-reduce:transform-none motion-reduce:transition-none"
          )}
        >
          {/* Subtle Inner Glow */}
          <div className="absolute inset-0 rounded-inherit border border-white/5 pointer-events-none" />

          <div className="relative flex flex-wrap items-center justify-center gap-1 md:flex-nowrap">
            <div className="flex items-center gap-3 px-3 py-1">
              <span className="bg-[var(--inv-accent-primary)] text-white inline-flex h-7 items-center rounded-full px-3 font-data text-xs font-semibold tracking-wide">
                {selectedCount} selected
              </span>
              {canSelectAll && (
                <button
                  type="button"
                  className="font-data text-[var(--inv-text-muted)] hover:text-[var(--inv-text-primary)] text-xs font-medium underline-offset-4 transition-colors hover:underline"
                  onClick={onSelectAll}
                >
                  Select all
                </button>
              )}
            </div>

            <div className="bg-[var(--inv-border)] mx-1 hidden h-6 w-px md:block" />

            <div className="flex items-center gap-1 px-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSend}
                className="h-9 rounded-full px-3 font-data text-xs font-medium text-[var(--inv-text-secondary)] hover:bg-[var(--inv-surface-elevated)] hover:text-[var(--inv-text-primary)] transition-colors"
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Send
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                className="h-9 rounded-full px-3 font-data text-xs font-medium text-[var(--inv-text-secondary)] hover:bg-[var(--inv-surface-elevated)] hover:text-[var(--inv-text-primary)] transition-colors"
              >
                <FileDown className="mr-1.5 h-3.5 w-3.5" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkPaid}
                className="h-9 rounded-full px-3 font-data text-xs font-medium text-[var(--inv-status-paid)] hover:bg-[var(--inv-status-paid)]/10 transition-colors"
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Mark paid
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-9 rounded-full px-3 font-data text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete
              </Button>
            </div>

            <div className="bg-[var(--inv-border)] mx-1 hidden h-6 w-px md:block" />

            <button
              type="button"
              onClick={onClearSelection}
              className="text-[var(--inv-text-muted)] hover:bg-[var(--inv-surface-elevated)] hover:text-[var(--inv-text-primary)] hidden h-9 w-9 items-center justify-center rounded-full transition-colors md:flex"
              aria-label="Clear invoice selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
