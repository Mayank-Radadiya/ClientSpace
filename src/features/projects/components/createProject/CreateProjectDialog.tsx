"use client";

import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateProjectForm } from "./CreateProjectForm";

type Client = { id: string; companyName: string | null; email: string };

type CreateProjectDialogProps = {
  clients: Client[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CreateProjectDialog({
  clients,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateProjectDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (controlledOnOpenChange ?? setInternalOpen)
    : setInternalOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger>
          <div className="shadow-primary/20 ring-primary/20 h-10 rounded-xl px-5 font-bold tracking-tight shadow-xl ring-1 transition-all hover:scale-[1.02] active:scale-95">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </div>
        </DialogTrigger>
      )}

      <DialogContent className="bg-background overflow-hidden rounded-3xl border p-0 shadow-2xl backdrop-blur-2xl sm:max-w-[580px]">
        {/* Header section with vibrant accent */}
        <div className="from-primary/10 bg-linear-to-b to-transparent p-8 pb-4">
          <div className="mb-2 flex items-center gap-4">
            <div className="bg-primary/10 text-primary ring-primary/30 flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner ring-1">
              <Sparkles className="h-6 w-6" />
            </div>
            <DialogHeader className="p-0">
              <DialogTitle className="p-0 text-3xl font-black tracking-tighter uppercase sm:text-4xl">
                Initialize Project
              </DialogTitle>
              <DialogDescription className="text-primary/60 text-[10px] font-bold tracking-[0.2em] uppercase">
                Strategic Resource Allocation Matrix
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <CreateProjectForm clients={clients} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
