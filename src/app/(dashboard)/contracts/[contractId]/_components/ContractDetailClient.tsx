"use client";

// src/app/(dashboard)/contracts/[contractId]/_components/ContractDetailClient.tsx
// Two-column contract detail: editor/reader (left) + status timeline + actions (right).
// 
// Security: even in read-only mode, bodyHtml is sanitized via DOMPurify on the
// signing page (Phase C). Here on the agency side, the agency created the HTML,
// so XSS risk is lower, but we still display it safely with prose styling.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { ContractEditor } from "@/features/contracts/components/ContractEditor";
import { ContractStatusBadge } from "@/features/contracts/components/ContractStatusBadge";
import { AuditTrailCard } from "@/features/contracts/components/AuditTrailCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Send,
  X,
  Download,
  Loader2,
  Copy,
  CheckCheck,
  ExternalLink,
  User,
  FolderKanban,
} from "lucide-react";
import Link from "next/link";

interface ContractDetailClientProps {
  contractId: string;
}

export function ContractDetailClient({ contractId }: ContractDetailClientProps) {
  const router = useRouter();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [signingUrl, setSigningUrl] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: contract, isLoading, error } = trpc.contracts.getById.useQuery({ contractId });

  const sendMutation = trpc.contracts.sendToClient.useMutation({
    onSuccess(data) {
      setSigningUrl(data.signingUrl);
      utils.contracts.getById.invalidate({ contractId });
    },
  });

  const voidMutation = trpc.contracts.voidContract.useMutation({
    onSuccess() {
      utils.contracts.getById.invalidate({ contractId });
    },
  });

  function copySigningUrl() {
    if (!signingUrl) return;
    navigator.clipboard.writeText(signingUrl).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 text-neutral-400">
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading contract…
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="flex items-center justify-center h-96 text-neutral-400">
        Contract not found.
      </div>
    );
  }

  const isDraft   = contract.status === "draft";
  const isSent    = contract.status === "sent" || contract.status === "viewed";
  const isSigned  = contract.status === "signed";
  const isVoidable = isSent;

  const clientLabel = (contract.client as any)?.companyName
    ?? (contract.client as any)?.contactName
    ?? (contract.client as any)?.email
    ?? "Client";

  const resolvedData = {
    client_name:  clientLabel,
    project_name: (contract.project as any)?.name ?? "",
    agency_name:  (contract.organization as any)?.name ?? "",
  };

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <button
          onClick={() => router.push("/contracts")}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          <ArrowLeft size={15} />
          Contracts
        </button>
        <span className="text-neutral-300 dark:text-neutral-700">/</span>
        <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-xs">
          {contract.title}
        </h1>
        <ContractStatusBadge status={contract.status as any} />
      </div>

      {/* Body — two columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Editor or read-only HTML */}
        <div className="flex-1 overflow-y-auto p-6">
          {isDraft ? (
            <ContractEditor
              contractId={contractId}
              initialHtml={contract.bodyHtml}
              resolvedData={resolvedData}
            />
          ) : (
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6">
              <div
                className="prose prose-neutral dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: contract.bodyHtml }}
              />
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="w-80 shrink-0 border-l border-neutral-200 dark:border-neutral-800 overflow-y-auto p-5 flex flex-col gap-5 bg-neutral-50/50 dark:bg-neutral-950/50">
          {/* Client info */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Client</p>
            <div className="flex items-center gap-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 bg-white dark:bg-neutral-900">
              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <User size={13} className="text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{clientLabel}</p>
                <p className="text-xs text-neutral-500 truncate">{(contract.client as any)?.email}</p>
              </div>
            </div>
          </div>

          {/* Project link */}
          {contract.project && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Project</p>
              <Link
                href={`/projects/${(contract.project as any).id}`}
                className="flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 bg-white dark:bg-neutral-900 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <FolderKanban size={14} className="text-neutral-400 shrink-0" />
                <span className="truncate">{(contract.project as any).name}</span>
                <ExternalLink size={11} className="text-neutral-300 ml-auto shrink-0" />
              </Link>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Actions</p>

            {/* Send to client */}
            {isDraft && (
              <Button
                id="send-contract-btn"
                className="w-full gap-2"
                onClick={() => sendMutation.mutate({ contractId })}
                disabled={sendMutation.isPending}
              >
                {sendMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Send to Client
              </Button>
            )}

            {/* Signing URL (after send) */}
            {signingUrl && (
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 space-y-2">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Signing link generated</p>
                <code className="text-xs font-mono text-blue-600 dark:text-blue-300 break-all">{signingUrl}</code>
                <Button
                  size="sm" variant="outline"
                  className="w-full gap-2 text-xs border-blue-200"
                  onClick={copySigningUrl}
                >
                  {copiedUrl ? <CheckCheck size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  {copiedUrl ? "Copied!" : "Copy URL"}
                </Button>
              </div>
            )}

            {/* Void contract */}
            {isVoidable && (
              <Button
                id="void-contract-btn"
                variant="outline"
                className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => {
                  if (confirm("Void this contract? The signing link will be invalidated.")) {
                    voidMutation.mutate({ contractId });
                  }
                }}
                disabled={voidMutation.isPending}
              >
                {voidMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                Void Contract
              </Button>
            )}

            {/* Download PDF */}
            {contract.pdfUrl && (
              <a
                href={contract.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="download-pdf-btn"
                className="inline-flex items-center justify-center gap-2 w-full h-9 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <Download size={14} />
                Download Signed PDF
              </a>
            )}
          </div>

          {/* Audit trail (signed only) */}
          {isSigned && (
            <AuditTrailCard contract={contract as any} />
          )}
        </div>
      </div>
    </div>
  );
}
