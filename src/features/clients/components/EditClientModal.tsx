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
  "w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm font-[var(--font-data)] text-[#F2F2F5] placeholder-[#3D3D4E] outline-none transition-all duration-150 focus:border-[#4F7FFF] focus:bg-[rgba(79,127,255,0.04)]";
const LABEL_CLASS =
  "mb-1.5 block text-[10px] font-semibold tracking-[0.18em] text-[#6B6B7E] uppercase font-[var(--font-data)]";

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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
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
            <div className="relative w-full max-w-[480px] overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-6 py-5">
                <h2 className="text-2xl font-extrabold tracking-tight text-[#F2F2F5] font-[var(--font-display)]">
                  Edit Client
                </h2>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[#6B6B7E] hover:bg-white/5 hover:text-[#F2F2F5] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <div>
                  <label className={LABEL_CLASS}>Company Name *</label>
                  <input
                    className={cn(INPUT_CLASS, errors.companyName && "border-[#EF4444]")}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    onBlur={validate}
                    placeholder="Company name"
                  />
                  {errors.companyName && <p className="mt-1 text-[11px] text-[#EF4444]">{errors.companyName}</p>}
                </div>

                <div>
                  <label className={LABEL_CLASS}>Contact Name *</label>
                  <input
                    className={cn(INPUT_CLASS, errors.contactName && "border-[#EF4444]")}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    onBlur={validate}
                    placeholder="Contact name"
                  />
                  {errors.contactName && <p className="mt-1 text-[11px] text-[#EF4444]">{errors.contactName}</p>}
                </div>

                <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
                  <p className="text-[11px] text-[#6B6B7E] font-[var(--font-data)]">
                    Email: <span className="text-[#F2F2F5]">{client.email}</span>
                    <span className="ml-2 opacity-50">(cannot be changed)</span>
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-[rgba(255,255,255,0.08)] px-5 py-2.5 text-[12px] font-semibold tracking-[0.15em] uppercase text-[#6B6B7E] transition-colors hover:border-[rgba(255,255,255,0.15)] hover:text-[#F2F2F5] font-[var(--font-data)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#4F7FFF] px-6 py-2.5 text-[12px] font-bold tracking-[0.15em] uppercase text-white transition-all hover:bg-[#6B95FF] disabled:opacity-60 font-[var(--font-data)]"
                  >
                    {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
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
