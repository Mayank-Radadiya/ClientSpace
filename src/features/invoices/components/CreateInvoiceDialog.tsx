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
            <PlusIcon className="hover:scale-105 text-white" />
            <span className="relative z-10 text-white">Create Invoice</span>
          </Button>
        }
      />

      {/* We use a raw DialogPortal to completely customize the modal shell instead of the default DialogPopup */}
      {open && (
        <DialogPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[rgba(15,15,25,0.60)] dark:bg-[rgba(0,0,0,0.75)] backdrop-blur-[8px] dark:backdrop-blur-[12px] animate-in fade-in duration-200">
            <div 
              className={`relative flex flex-col bg-[var(--inv-modal-bg)] rounded-[18px] 
              border border-[var(--inv-input-border)] dark:border-[rgba(255,255,255,0.07)]
              shadow-[0_32px_80px_rgba(0,0,0,0.18)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.6)]
              max-h-[88vh] overflow-hidden animate-inv-modal-enter transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
              ${previewOpen ? "w-full max-w-[1360px]" : "w-full max-w-[680px]"}`}
              role="dialog"
              aria-modal="true"
            >
              
              {/* Confirm Close Guard */}
              {showConfirmClose && (
                <div className="absolute inset-x-0 top-0 z-50 bg-[var(--inv-modal-bg)] border-b border-[var(--inv-divider)] p-4 flex justify-between items-center shadow-lg animate-inv-slide-down">
                  <span className="text-[var(--inv-text-primary)] font-medium text-sm">Discard changes?</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowConfirmClose(false)}
                      className="px-3 py-1.5 text-sm font-medium text-[var(--inv-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
                    >
                      Keep editing
                    </button>
                    <button 
                      onClick={forceClose}
                      className="px-3 py-1.5 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}

              {/* Modal Header */}
              <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[var(--inv-divider)] sticky top-0 z-40 bg-[var(--inv-modal-bg)]">
                <div>
                  <h2 className="font-syne font-extrabold text-[26px] text-[var(--inv-text-primary)] leading-tight">
                    Create Invoice
                  </h2>
                  <div className="mt-1 flex items-center gap-2 font-dm-mono text-xs text-[var(--inv-text-secondary)]">
                    <span>INV-1002</span>
                    <span className="w-1 h-1 rounded-full bg-[var(--inv-text-secondary)]/50" />
                    <span className="px-2 py-0.5 rounded-full bg-[var(--inv-text-secondary)]/10 text-[10px] uppercase tracking-wider font-semibold">
                      Draft
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPreviewOpen(!previewOpen)}
                    className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--inv-text-secondary)] hover:text-[var(--inv-accent-primary)] hover:bg-[var(--inv-accent-primary)]/10 transition-colors"
                    title="Toggle Preview"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCloseAttempt}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-[var(--inv-text-primary)] transition-colors"
                    title="Close"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto obsidian-scroll relative flex">
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
