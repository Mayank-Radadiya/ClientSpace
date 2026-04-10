"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Send, FileDown, Trash2, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvoiceBulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onSend: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onMarkPaid: () => void;
}

export function InvoiceBulkActionBar({
  selectedCount,
  onClearSelection,
  onSend,
  onDownload,
  onDelete,
  onMarkPaid,
}: InvoiceBulkActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0, x: "-50%" }}
          animate={{ y: 0, opacity: 1, x: "-50%" }}
          exit={{ y: 100, opacity: 0, x: "-50%" }}
          className="border-border/50 bg-background/95 supports-backdrop-filter:bg-background/80 fixed bottom-8 left-1/2 z-50 flex items-center justify-between gap-6 rounded-full border p-2 px-4 shadow-xl backdrop-blur"
        >
          <div className="border-border/50 flex items-center gap-3 border-r pr-4">
            <span className="bg-primary text-primary-foreground flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium">
              {selectedCount}
            </span>
            <span className="text-muted-foreground text-sm font-medium whitespace-nowrap">
              selected
            </span>
            <button
              onClick={onClearSelection}
              className="text-muted-foreground hover:bg-muted hover:text-foreground ml-1 rounded-full p-1 transition-colors"
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSend}
              className="h-8 gap-2 rounded-full px-3 text-xs whitespace-nowrap"
            >
              <Send className="h-3.5 w-3.5" /> Send
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownload}
              className="h-8 gap-2 rounded-full px-3 text-xs whitespace-nowrap"
            >
              <FileDown className="h-3.5 w-3.5" /> HTML/PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkPaid}
              className="h-8 gap-2 rounded-full px-3 text-xs whitespace-nowrap text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-500"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Paid
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 gap-2 rounded-full px-3 text-xs whitespace-nowrap text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-500"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
