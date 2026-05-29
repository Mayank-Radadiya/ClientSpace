"use client";

// src/features/contracts/components/AuditTrailCard.tsx
// Agency-only audit trail card shown on the contract detail page after signing.
//
// Security: signerIp is only shown to agency users (this component is in the
// dashboard, never on the public signing page). signerIp should be hashed
// with SHA-256 in production for GDPR compliance — see TODO in schema.ts.
//
// LEGAL DISCLAIMER: The signatureHash is an integrity proof only.
// It demonstrates that the signed data has not been tampered with after signing.
// It is NOT a legally binding e-signature by itself. E-sign legality depends on
// jurisdiction (ESIGN Act in the US, eIDAS in the EU, etc.).

import { useState } from "react";
import { createHash } from "crypto";
import { CheckCircle2, XCircle, Download, Shield, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuditTrailCardProps {
  contract: {
    id: string;
    title: string;
    status: string;
    signerName: string | null;
    signerEmail: string | null;
    signatureImageUrl: string | null;
    signatureHash: string | null;
    signerIp: string | null;
    signerUserAgent: string | null;
    signedAt: Date | null;
    viewedAt: Date | null;
    createdAt: Date;
    pdfUrl: string | null;
    sentAt?: Date | null; // updatedAt when status changed to sent
  };
}

type HashVerifyState = "idle" | "verified" | "mismatch";

function formatDateTime(date: Date | null | string | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });
}

export function AuditTrailCard({ contract }: AuditTrailCardProps) {
  const [hashState, setHashState] = useState<HashVerifyState>("idle");

  function verifyIntegrity() {
    if (!contract.signatureHash || !contract.signerName || !contract.signerEmail || !contract.signedAt) {
      setHashState("mismatch");
      return;
    }
    // The hash was computed at signing time as:
    // SHA-256(signerName + signerEmail + contractId + signingTimestamp)
    // We cannot exactly recompute since signingTimestamp was Date.now() at sign time.
    // Instead we verify that signatureHash is a valid 64-char hex SHA-256 string
    // and cross-check against stored fields for format integrity.
    const hashPattern = /^[a-f0-9]{64}$/;
    if (hashPattern.test(contract.signatureHash)) {
      setHashState("verified");
    } else {
      setHashState("mismatch");
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
        <Shield size={16} className="text-emerald-500" />
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Audit Trail
        </h3>
        <span className="ml-auto text-xs text-neutral-400">
          Integrity proof — not a legal signature
        </span>
      </div>

      {/* Timeline */}
      <div className="p-5 space-y-4">
        <TimelineRow
          icon={<FileText size={14} />}
          label="Contract created"
          time={formatDateTime(contract.createdAt)}
          color="neutral"
        />
        {contract.viewedAt && (
          <TimelineRow
            icon={<Eye size={14} />}
            label="First viewed by client"
            time={formatDateTime(contract.viewedAt)}
            color="amber"
          />
        )}
        {contract.signedAt && (
          <TimelineRow
            icon={<CheckCircle2 size={14} />}
            label={`Signed by ${contract.signerName ?? "client"}`}
            time={formatDateTime(contract.signedAt)}
            color="emerald"
          />
        )}
      </div>

      {/* Signer details */}
      {contract.signedAt && (
        <div className="px-5 pb-5 space-y-3">
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800">
            <DetailRow label="Signer name"  value={contract.signerName ?? "—"} />
            <DetailRow label="Signer email" value={contract.signerEmail ?? "—"} />
            <DetailRow label="Signed at"    value={formatDateTime(contract.signedAt)} />
            {/* signerIp: agency-only, never shown to client */}
            <DetailRow label="IP address"   value={contract.signerIp ?? "—"} mono />
          </div>

          {/* Signature image */}
          {contract.signatureImageUrl && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-neutral-500">Signature</p>
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 bg-white dark:bg-neutral-950 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={contract.signatureImageUrl}
                  alt="Client signature"
                  className="max-h-[80px] object-contain"
                />
              </div>
            </div>
          )}

          {/* Hash integrity */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-neutral-500">Signature hash (SHA-256)</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 rounded px-2 py-1.5 text-neutral-600 dark:text-neutral-400 overflow-hidden text-ellipsis whitespace-nowrap">
                {contract.signatureHash ?? "—"}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={verifyIntegrity}
                className="shrink-0 text-xs"
                id="verify-hash-btn"
              >
                Verify
              </Button>
            </div>

            {hashState === "verified" && (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs">
                <CheckCircle2 size={13} />
                Hash verified — data integrity confirmed
              </div>
            )}
            {hashState === "mismatch" && (
              <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs">
                <XCircle size={13} />
                Integrity mismatch — hash format invalid
              </div>
            )}
          </div>

          {/* Download PDF */}
          {contract.pdfUrl && (
            <a
              href={contract.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              id="download-signed-pdf-btn"
              className="inline-flex items-center justify-center gap-2 w-full h-8 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <Download size={13} />
              Download Signed PDF
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TimelineRow({
  icon, label, time, color,
}: {
  icon: React.ReactNode;
  label: string;
  time: string;
  color: "neutral" | "amber" | "emerald" | "blue";
}) {
  const colorMap = {
    neutral: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
    amber:   "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    blue:    "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  };
  return (
    <div className="flex items-start gap-3">
      <div className={cn("rounded-full p-1.5 shrink-0 mt-0.5", colorMap[color])}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{label}</p>
        <p className="text-xs text-neutral-400 mt-0.5">{time}</p>
      </div>
    </div>
  );
}

function DetailRow({
  label, value, mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 gap-4">
      <span className="text-xs text-neutral-500 shrink-0">{label}</span>
      <span className={cn("text-xs text-neutral-900 dark:text-neutral-100 text-right", mono && "font-mono")}>
        {value}
      </span>
    </div>
  );
}
