"use client";

// src/app/(dashboard)/contracts/_components/ContractsPageClient.tsx
// Contract list page — sortable table with status badges, actions, and new contract modal.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { ContractStatusBadge } from "@/features/contracts/components/ContractStatusBadge";
import { NewContractModal } from "@/features/contracts/components/NewContractModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FileSignature,
  Plus,
  ExternalLink,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function deriveClientLabel(client: { contactName: string | null; companyName: string | null; email: string } | null | undefined): string {
  if (!client) return "—";
  return client.companyName ?? client.contactName ?? client.email;
}

export function ContractsPageClient() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = trpc.contracts.list.useQuery({});

  const contracts = data ?? [];

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <FileSignature size={22} className="text-blue-500" />
            Contracts
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Draft, send, and manage client e-signing contracts.
          </p>
        </div>
        <Button
          id="new-contract-btn"
          onClick={() => setModalOpen(true)}
          className="gap-2"
        >
          <Plus size={15} />
          New Contract
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_160px_160px_120px_120px_120px_80px] gap-4 px-5 py-3 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
          <span>Title</span>
          <span>Client</span>
          <span>Project</span>
          <span>Status</span>
          <span>Sent</span>
          <span>Signed</span>
          <span />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20 text-neutral-400">
            <Loader2 size={20} className="animate-spin mr-2" />
            Loading contracts…
          </div>
        )}

        {/* Empty state */}
        {!isLoading && contracts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="rounded-full bg-neutral-100 dark:bg-neutral-800 p-4">
              <FileSignature size={28} className="text-neutral-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">No contracts yet</p>
              <p className="text-sm text-neutral-500 mt-1">Create your first contract to get started.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(true)} className="gap-2 mt-1">
              <Plus size={14} />
              New Contract
            </Button>
          </div>
        )}

        {/* Rows */}
        {contracts.map((contract) => (
          <div
            key={contract.id}
            id={`contract-row-${contract.id}`}
            onClick={() => router.push(`/contracts/${contract.id}`)}
            className={cn(
              "grid grid-cols-[1fr_160px_160px_120px_120px_120px_80px] gap-4 px-5 py-4",
              "border-b border-neutral-100 dark:border-neutral-800 last:border-0",
              "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors",
            )}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {contract.title}
              </p>
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
              {deriveClientLabel(contract.client)}
            </div>
            <div className="text-sm text-neutral-500 truncate">
              {(contract.project as any)?.name ?? <span className="text-neutral-300 dark:text-neutral-600">—</span>}
            </div>
            <div>
              <ContractStatusBadge status={contract.status as any} />
            </div>
            <div className="text-sm text-neutral-500">
              {contract.status !== "draft" ? formatDate(contract.updatedAt) : "—"}
            </div>
            <div className="text-sm text-neutral-500">
              {contract.signedAt ? (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 size={12} />
                  {formatDate(contract.signedAt)}
                </span>
              ) : "—"}
            </div>
            <div className="flex justify-end">
              <ExternalLink size={14} className="text-neutral-300 dark:text-neutral-600" />
            </div>
          </div>
        ))}
      </div>

      <NewContractModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
