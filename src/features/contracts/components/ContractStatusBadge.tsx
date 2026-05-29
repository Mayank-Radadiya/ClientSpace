"use client";

// src/features/contracts/components/ContractStatusBadge.tsx
// Status badge with semantic colors matching the design system.

import { Badge } from "@/components/ui/badge";
import type { ContractStatus } from "../schemas";

const STATUS_CONFIG: Record<
  ContractStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }
> = {
  draft:    { label: "Draft",    variant: "secondary", className: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300" },
  sent:     { label: "Sent",     variant: "default",   className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  viewed:   { label: "Viewed",   variant: "default",   className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  signed:   { label: "Signed",   variant: "default",   className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  declined: { label: "Declined", variant: "destructive", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  expired:  { label: "Expired",  variant: "secondary", className: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400" },
};

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <Badge variant={config.variant} className={`text-xs font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
}
