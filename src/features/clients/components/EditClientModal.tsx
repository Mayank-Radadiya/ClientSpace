"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import type { ClientListItem } from "../client.types";

type EditClientModalProps = {
  open: boolean;
  client: ClientListItem | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onInvalidate: () => void;
};

const INPUT_CLASS =
  "w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm  text-foreground placeholder-muted-foreground outline-none transition-all duration-150 focus:border-primary focus:bg-primary/5";
const LABEL_CLASS =
  "mb-1.5 block text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase ";

export function EditClientModal({
  open,
  client,
  onClose,
  onSuccess,
  onError,
  onInvalidate,
}: EditClientModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (client) {
      setCompanyName(client.companyName ?? "");
      setContactName(client.contactName ?? "");
      setErrors({});
    }
  }, [client]);

  const updateMutation = trpc.clients.updateClient.useMutation({
    onSuccess: () => {
      onInvalidate();
      onClose();
      onSuccess(`${companyName} updated successfully`);
    },
    onError: (err) => {
      onError(err.message || "Failed to update client");
    },
  });

  function validate() {
    const errs: Record<string, string> = {};
    if (!companyName.trim()) errs.companyName = "Company name is required";
    if (!contactName.trim()) errs.contactName = "Contact name is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!client || !validate()) return;
    updateMutation.mutate({
      clientId: client.id,
      companyName: companyName.trim(),
      contactName: contactName.trim(),
    });
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
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-border bg-background relative w-full max-w-[480px] overflow-hidden rounded-2xl border shadow-xl">
              {/* Header */}
              <div className="border-border flex items-center justify-between border-b px-6 py-5">
                <h2 className="text-foreground text-2xl font-extrabold tracking-tight">
                  Edit Client
                </h2>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
                <div>
                  <label className={LABEL_CLASS}>Company Name *</label>
                  <input
                    className={cn(
                      INPUT_CLASS,
                      errors.companyName && "border-red-500",
                    )}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    onBlur={validate}
                    placeholder="Company name"
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-[11px] text-red-500">
                      {errors.companyName}
                    </p>
                  )}
                </div>

                <div>
                  <label className={LABEL_CLASS}>Contact Name *</label>
                  <input
                    className={cn(
                      INPUT_CLASS,
                      errors.contactName && "border-red-500",
                    )}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    onBlur={validate}
                    placeholder="Contact name"
                  />
                  {errors.contactName && (
                    <p className="mt-1 text-[11px] text-red-500">
                      {errors.contactName}
                    </p>
                  )}
                </div>

                <div className="border-border bg-muted/30 rounded-xl border px-4 py-3">
                  <p className="text-muted-foreground text-[11px]">
                    Email:{" "}
                    <span className="text-foreground">{client.email}</span>
                    <span className="ml-2 opacity-50">(cannot be changed)</span>
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="border-border text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl border px-5 py-2.5 text-[12px] font-semibold tracking-[0.15em] uppercase transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-[12px] font-bold tracking-[0.15em] uppercase transition-all disabled:opacity-60"
                  >
                    {updateMutation.isPending && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    {updateMutation.isPending ? "Saving..." : "Save Changes →"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
