"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArchiveRestore, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import type { ClientListItem } from "../client.types";

type RestoreClientModalProps = {
  open: boolean;
  client: ClientListItem | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onInvalidate: () => void;
};

export function RestoreClientModal({
  open,
  client,
  onClose,
  onSuccess,
  onError,
  onInvalidate,
}: RestoreClientModalProps) {
  const restoreMutation = trpc.clients.unarchiveClient.useMutation({
    onSuccess: () => {
      onInvalidate();
      onClose();
      onSuccess(`${client?.companyName ?? client?.email} restored successfully`);
    },
    onError: (err) => {
      onError(err.message || "Failed to restore client");
    },
  });

  const displayName = client?.companyName ?? client?.contactName ?? client?.email ?? "this client";

  function handleClose() {
    onClose();
  }

  return (
    <AnimatePresence>
      {open && client && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-[440px] overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <ArchiveRestore className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight text-foreground font-[var(--font-display)]">
                    Restore Client?
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                <p className="text-[14px] leading-relaxed text-muted-foreground font-[var(--font-data)]">
                  Are you sure you want to restore{" "}
                  <span className="font-bold text-foreground">{displayName}</span>?
                </p>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-xl border border-border px-5 py-2.5 text-[12px] font-semibold tracking-[0.15em] uppercase text-muted-foreground transition-colors hover:bg-muted hover:text-foreground font-[var(--font-data)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => client && restoreMutation.mutate({ clientId: client.id })}
                    disabled={restoreMutation.isPending}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-[12px] font-bold tracking-[0.15em] uppercase text-primary-foreground transition-all font-[var(--font-data)]",
                      "bg-primary hover:bg-primary/90 cursor-pointer"
                    )}
                  >
                    {restoreMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Restore Client
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
