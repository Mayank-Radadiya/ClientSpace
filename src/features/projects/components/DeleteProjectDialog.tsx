"use client";

import { useState } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { gooeyToast as toast } from "@/components/ui/goey-toaster";

type DeleteProjectDialogProps = {
  projectId: string;
  projectName: string;
  onDeleted?: () => void;
};

export function DeleteProjectDialog({
  projectId,
  projectName,
  onDeleted,
}: DeleteProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const deleteMutation = trpc.project.delete.useMutation({
    onSuccess: () => {
      utils.project.getAll.invalidate();
      toast.success(`"${projectName}" deleted`);
      setOpen(false);
      onDeleted?.();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete project");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground h-8 w-8 rounded-lg ring-1 ring-transparent transition-all hover:bg-red-500/10 hover:text-red-500 hover:ring-red-500/20"
            title="Delete project"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        }
      />

      <DialogContent className="bg-popover/80 overflow-hidden rounded-3xl border-white/10 p-0 shadow-2xl backdrop-blur-2xl sm:max-w-md">
        <div className="bg-linear-to-b from-red-500/10 to-transparent p-6 pb-2">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/20 ring-1 ring-red-500/40">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <DialogHeader className="p-0">
              <DialogTitle className="p-0 text-xl font-black tracking-tighter uppercase">
                Delete Project
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold tracking-widest uppercase opacity-60">
                Data De-provisioning Protocol
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="p-6 pt-2">
          <p className="text-sm leading-relaxed font-medium opacity-80">
            You are about to permanently purge{" "}
            <span className="text-foreground font-black tracking-tight underline decoration-red-500/30">
              &ldquo;{projectName}&rdquo;
            </span>{" "}
            from the system. This action is terminal and cannot be reversed.
          </p>
        </div>

        <DialogFooter className="gap-3 border-t border-white/5 bg-white/5 p-6 pt-4">
          <Button
            variant="outline"
            disabled={deleteMutation.isPending}
            onClick={() => setOpen(false)}
            className="h-11 rounded-xl border-white/10 bg-white/5 px-6 font-bold transition-all hover:bg-white/10"
          >
            CANCEL
          </Button>
          <Button
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate({ id: projectId })}
            className="h-11 rounded-xl bg-red-600 px-6 font-black tracking-widest shadow-lg shadow-red-900/20 transition-all hover:bg-red-700 active:scale-95"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                PURGING…
              </>
            ) : (
              "CONFIRM DELETE"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
