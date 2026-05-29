"use client";

// src/features/contracts/components/NewContractModal.tsx
// Modal for creating a new contract — title + client selector + optional project selector.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FileSignature, Loader2 } from "lucide-react";

interface NewContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewContractModal({ open, onOpenChange }: NewContractModalProps) {
  const router = useRouter();
  const [title, setTitle]         = useState("");
  const [clientId, setClientId]   = useState("");
  const [projectId, setProjectId] = useState("");

  // Fetch clients for the dropdown
  const { data: clientsData } = trpc.clients.getBootstrap.useQuery(
    undefined,
    { enabled: open },
  );

  // Fetch all projects and filter by clientId client-side
  const { data: projectsData } = trpc.projects.list.useQuery(
    { limit: 100 },
    { enabled: open && !!clientId },
  );

  // Filter projects by selected client
  const filteredProjects = (projectsData as any)?.projects?.filter(
    (p: any) => p.clientId === clientId,
  ) ?? [];

  const createMutation = trpc.contracts.create.useMutation({
    onSuccess(data) {
      onOpenChange(false);
      router.push(`/contracts/${data.id}`);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !clientId) return;
    createMutation.mutate({
      title: title.trim(),
      clientId,
      projectId: projectId || undefined,
      bodyHtml: "",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileSignature size={18} className="text-blue-500" />
            New Contract
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="contract-title">Contract Title</Label>
            <Input
              id="contract-title"
              placeholder="e.g. Web Design Agreement — Acme Corp"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Client */}
          <div className="space-y-1.5">
            <Label htmlFor="contract-client">Client</Label>
            <select
              id="contract-client"
              value={clientId}
              onChange={(e) => { setClientId(e.target.value); setProjectId(""); }}
              required
              className={cn(
                "w-full h-9 rounded-md border border-neutral-200 dark:border-neutral-700",
                "bg-white dark:bg-neutral-900 px-3 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
              )}
            >
              <option value="">Select a client…</option>
              {clientsData?.clients?.map((c) => (
                <option key={c.id} value={c.id}>
                  {(c as any).companyName ?? (c as any).contactName ?? (c as any).email}
                </option>
              ))}
            </select>
          </div>

          {/* Project (optional) */}
          {clientId && (
            <div className="space-y-1.5">
              <Label htmlFor="contract-project">Link to Project (optional)</Label>
              <select
                id="contract-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className={cn(
                  "w-full h-9 rounded-md border border-neutral-200 dark:border-neutral-700",
                  "bg-white dark:bg-neutral-900 px-3 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                )}
              >
                <option value="">No project (standalone)</option>
                {filteredProjects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !clientId || createMutation.isPending}
              className="min-w-[120px]"
            >
              {createMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                "Create Contract"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
