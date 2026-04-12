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
          initial={{ y: 28, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 28, opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "bg-background fixed right-4 bottom-6 left-4 z-50 rounded-2xl border p-1.5 shadow-xl md:right-auto md:left-1/2 md:w-max md:-translate-x-1/2 md:rounded-full",
            "motion-reduce:transform-none motion-reduce:transition-none",
          )}
        >
          <div className="flex flex-wrap items-center justify-center gap-1 md:flex-nowrap">
            <div className="flex items-center gap-2 px-2 py-1">
              <span className="bg-primary/10 text-primary inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium tracking-tight">
                {selectedCount} selected
              </span>
              {canSelectAll && (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground text-xs font-medium underline-offset-4 transition-colors hover:underline"
                  onClick={onSelectAll}
                >
                  Select all
                </button>
              )}
            </div>

            <div className="bg-border mx-1 hidden h-5 w-px md:block" />

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSend}
                className="h-8 rounded-full px-3 text-xs font-medium transition-colors"
              >
                <Send className="text-muted-foreground mr-1.5 h-3.5 w-3.5" />
                Send
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                className="h-8 rounded-full px-3 text-xs font-medium transition-colors"
              >
                <FileDown className="text-muted-foreground mr-1.5 h-3.5 w-3.5" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkPaid}
                className="h-8 rounded-full bg-green-500/10 px-3 text-xs font-medium text-green-500 transition-colors"
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-green-500" />
                Mark paid
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="hover:bg-destructive/10 hover:text-destructive h-8 rounded-full bg-red-500/10 px-3 text-xs font-medium text-red-500 transition-colors"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5 text-red-500" />
                Delete
              </Button>
            </div>

            <div className="bg-border mx-1 hidden h-5 w-px md:block" />

            <button
              type="button"
              onClick={onClearSelection}
              className="text-muted-foreground hover:bg-muted hover:text-foreground hidden h-8 w-8 items-center justify-center rounded-full transition-colors md:flex"
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
