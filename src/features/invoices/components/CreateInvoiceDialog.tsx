"use client";

import { useState } from "react";
import { PlusIcon, EyeIcon, XIcon } from "lucide-react";
import {
  Dialog,
  DialogPopup,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InvoiceBuilder } from "./InvoiceBuilder";

interface Client {
  id: string;
  companyName: string | null;
  contactName: string | null;
  email: string;
}

interface Project {
  id: string;
  clientId: string;
  name: string;
}

interface CreateInvoiceDialogProps {
  clients: Client[];
  projects: Project[];
  triggerId?: string;
}

export function CreateInvoiceDialog({
  clients,
  projects,
  triggerId,
}: CreateInvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    setPreviewOpen(false);
    setIsDirty(false);
    setShowConfirmClose(false);
  };

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      handleSuccess();
    }
  };

  const forceClose = () => {
    handleSuccess();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleCloseAttempt();
        } else {
          setOpen(true);
        }
      }}
    >
      <DialogTrigger
        id={triggerId}
        render={
          <Button className="group from-primary shadow-primary/25 hover:shadow-primary/40 relative overflow-hidden rounded-xl bg-linear-to-br to-indigo-600 px-6 font-bold tracking-wide text-white shadow-lg transition-[transform,shadow] duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-95">
            <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <PlusIcon className="text-white hover:scale-105" />
            <span className="relative z-10 text-white">Create Invoice</span>
          </Button>
        }
      />

      {/* We use a raw DialogPortal to completely customize the modal shell instead of the default DialogPopup */}
      {open && (
        <DialogPortal>
          <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,15,25,0.60)] p-4 backdrop-blur-[8px] duration-200 sm:p-6 dark:bg-[rgba(0,0,0,0.75)] dark:backdrop-blur-[12px]">
            <div
              className={`animate-inv-modal-enter relative flex max-h-[88vh] flex-col overflow-hidden rounded-[18px] border border-[var(--inv-input-border)] bg-[var(--inv-modal-bg)] shadow-[0_32px_80px_rgba(0,0,0,0.18)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] dark:border-[rgba(255,255,255,0.07)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.6)] ${previewOpen ? "w-full max-w-[1360px]" : "w-full max-w-[680px]"}`}
              role="dialog"
              aria-modal="true"
            >
              {/* Confirm Close Guard */}
              {showConfirmClose && (
                <div className="animate-inv-slide-down absolute inset-x-0 top-0 z-50 flex items-center justify-between border-b border-[var(--inv-divider)] bg-[var(--inv-modal-bg)] p-4 shadow-lg">
                  <span className="text-sm font-medium text-[var(--inv-text-primary)]">
                    Discard changes?
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConfirmClose(false)}
                      className="rounded-md px-3 py-1.5 text-sm font-medium text-(--inv-text-secondary) transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      Keep editing
                    </button>
                    <button
                      onClick={forceClose}
                      className="rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}

              {/* Modal Header */}
              <div className="sticky top-0 z-40 flex shrink-0 items-center justify-between border-b border-[var(--inv-divider)] bg-[var(--inv-modal-bg)] px-6 py-4">
                <div>
                  <h2 className="font-syne text-[26px] leading-tight font-extrabold text-[var(--inv-text-primary)]">
                    Create Invoice
                  </h2>
                  <div className="font-dm-mono mt-1 flex items-center gap-2 text-xs text-(--inv-text-secondary)">
                    <span>INV-1002</span>
                    <span className="h-1 w-1 rounded-full bg-[var(--inv-text-secondary)]/50" />
                    <span className="rounded-full bg-[var(--inv-text-secondary)]/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
                      Draft
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPreviewOpen(!previewOpen)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-(--inv-text-secondary) transition-colors hover:bg-[var(--inv-accent-primary)]/10 hover:text-(--inv-accent-primary)"
                    title="Toggle Preview"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleCloseAttempt}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-[var(--inv-text-primary)] transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                    title="Close"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="obsidian-scroll relative flex flex-1 overflow-y-auto">
                <InvoiceBuilder
                  clients={clients}
                  projects={projects}
                  onSuccess={forceClose}
                  onCancel={handleCloseAttempt}
                  previewOpen={previewOpen}
                  setIsDirty={setIsDirty}
                />
              </div>
            </div>
          </div>
        </DialogPortal>
      )}
    </Dialog>
  );
}
