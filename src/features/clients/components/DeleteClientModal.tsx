"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import type { ClientListItem } from "../client.types";

type DeleteClientModalProps = {
  open: boolean;
  client: ClientListItem | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onInvalidate: () => void;
};

export function DeleteClientModal({
  open,
  client,
  onClose,
  onSuccess,
  onError,
  onInvalidate,
}: DeleteClientModalProps) {
  const [confirmText, setConfirmText] = useState("");

  const deleteMutation = trpc.clients.deleteClient.useMutation({
    onSuccess: () => {
      onInvalidate();
      setConfirmText("");
      onClose();
      onSuccess(`${client?.companyName ?? client?.email} deleted permanently`);
    },
    onError: (err) => {
      onError(err.message || "Failed to delete client");
    },
  });

  const canDelete = confirmText === "DELETE";
  const displayName = client?.companyName ?? client?.contactName ?? client?.email ?? "this client";

  function handleClose() {
    setConfirmText("");
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
            <div className="relative w-full max-w-[440px] overflow-hidden rounded-2xl border border-red-500/20 bg-background shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10">
                    <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight text-red-500 font-[var(--font-display)]">
                    Delete Client?
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
                  This will permanently delete{" "}
                  <span className="font-bold text-foreground">{displayName}</span>{" "}
                  and all associated data. This action{" "}
                  <span className="font-bold text-red-500">cannot be undone</span>.
                </p>

                {/* Warnings */}
                <div className="space-y-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-[10px] font-bold tracking-[0.15em] text-amber-500 uppercase mb-3 font-[var(--font-data)]">
                    What will be deleted:
                  </p>
                  {[
                    "All invoices for this client",
                    "All active projects will be unlinked",
                    "All contacts and files will be removed",
                    "Activity history will be lost",
                  ].map((warning) => (
                    <div key={warning} className="flex items-start gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
                      <p className="text-[12px] text-amber-600 dark:text-amber-500 font-[var(--font-data)]">{warning}</p>
                    </div>
                  ))}
                </div>

                {/* Confirm input */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold tracking-[0.15em] text-muted-foreground uppercase font-[var(--font-data)]">
                    Type <span className="text-red-500 font-mono">DELETE</span> to confirm
                  </label>
                  <input
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-sm font-mono text-foreground placeholder-muted-foreground outline-none transition-all duration-150",
                      confirmText === "DELETE"
                        ? "border-red-500 bg-red-500/5"
                        : "border-border bg-muted/30 focus:border-primary/50",
                    )}
                    placeholder="DELETE"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    autoComplete="off"
                  />
                </div>

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
                    onClick={() => client && deleteMutation.mutate({ clientId: client.id })}
                    disabled={!canDelete || deleteMutation.isPending}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-[12px] font-bold tracking-[0.15em] uppercase text-white transition-all font-[var(--font-data)]",
                      canDelete
                        ? "bg-red-500 hover:bg-red-600 cursor-pointer"
                        : "bg-red-500/50 cursor-not-allowed",
                    )}
                  >
                    {deleteMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Delete Client
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
