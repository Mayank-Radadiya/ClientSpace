"use client";

// src/features/invoices/components/CreateInvoiceDialog.tsx
// Modal wrapper for InvoiceBuilder with smooth transitions.

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InvoiceBuilder } from "./InvoiceBuilder";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateInvoiceDialog({
  clients,
  projects,
  triggerId,
}: CreateInvoiceDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        id={triggerId}
        className="group bg-primary hover:bg-primary/90 focus:ring-primary/40 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] focus:ring-2 focus:outline-none active:scale-[0.97]"
      >
        <PlusIcon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
        <span>Create Invoice</span>
      </DialogTrigger>
      <DialogPopup className="bg-accent/20 max-w-4xl backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create Invoice</DialogTitle>
          <DialogDescription>
            Build a polished invoice with project context, line items, and a
            clear total summary.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel scrollFade={true}>
          <InvoiceBuilder
            clients={clients}
            projects={projects}
            onSuccess={handleSuccess}
            onCancel={() => setOpen(false)}
          />
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}
