"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Edit2, FileText, Trash2, Archive, Eye, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { CUBIC_BEZIER } from "../constants";
import { formatRelative, formatCents } from "../utils/formatters";
import type { ClientListItem, ClientDisplayStatus } from "../client.types";
import { ClientAvatar } from "./ClientAvatar";
import { StatusDropdown } from "./StatusDropdown";
import { useState, useRef, useEffect } from "react";

type ClientsListProps = {
  clients: ClientListItem[];
  selected: Set<string>;
  onToggleAll: () => void;
  onToggle: (id: string, shift: boolean) => void;
  onEdit: (client: ClientListItem) => void;
  onDelete: (client: ClientListItem) => void;
  onArchive: (client: ClientListItem) => void;
  onStatusChange: (id: string, status: ClientDisplayStatus) => void;
  allSelected: boolean;
  someSelected: boolean;
  role: "owner" | "admin" | "member" | "client";
};

function RowMenu({
  client,
  onEdit,
  onDelete,
  onArchive,
  role,
}: {
  client: ClientListItem;
  onEdit: (c: ClientListItem) => void;
  onDelete: (c: ClientListItem) => void;
  onArchive: (c: ClientListItem) => void;
  role: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-popover border-border absolute top-full right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border py-1 shadow-2xl"
        >
          <button
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex w-full items-center gap-2 px-3 py-2 text-[11px] transition-colors"
            onClick={() => { router.push(`/clients/${client.id}`); setOpen(false); }}
          >
            <Eye className="h-3.5 w-3.5" /> View Profile
          </button>
          {(role === "owner" || role === "admin") && (
            <button
              className="text-muted-foreground hover:bg-muted hover:text-foreground flex w-full items-center gap-2 px-3 py-2 text-[11px] transition-colors"
              onClick={() => { onEdit(client); setOpen(false); }}
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </button>
          )}
          <button
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex w-full items-center gap-2 px-3 py-2 text-[11px] transition-colors"
            onClick={() => { router.push(`/invoices/new?clientId=${client.id}`); setOpen(false); }}
          >
            <FileText className="h-3.5 w-3.5" /> Create Invoice
          </button>
          {(role === "owner" || role === "admin") && client.displayStatus !== "archived" && (
            <button
              className="text-muted-foreground hover:bg-muted hover:text-foreground flex w-full items-center gap-2 px-3 py-2 text-[11px] transition-colors"
              onClick={() => { onArchive(client); setOpen(false); }}
            >
              <Archive className="h-3.5 w-3.5" /> Archive
            </button>
          )}
          {(role === "owner" || role === "admin") && (
            <>
              <div className="border-border my-1 border-t" />
              <button
                className="hover:bg-destructive/10 text-destructive flex w-full items-center gap-2 px-3 py-2 text-[11px] transition-colors"
                onClick={() => { onDelete(client); setOpen(false); }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ClientsList({
  clients,
  selected,
  onToggleAll,
  onToggle,
  onEdit,
  onDelete,
  onArchive,
  onStatusChange,
  allSelected,
  someSelected,
  role,
}: ClientsListProps) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-border bg-muted/30 border-b">
            {/* Select all */}
            <th className="w-12 px-4 py-3" onClick={onToggleAll}>
              <div className={cn(
                "mx-auto flex h-5 w-5 cursor-pointer items-center justify-center rounded border-2 transition-all duration-150",
                allSelected
                  ? "border-primary bg-primary"
                  : someSelected
                    ? "border-primary bg-transparent"
                    : "border-border bg-transparent hover:border-primary",
              )}>
                {allSelected ? (
                  <svg className="text-primary-foreground h-3 w-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : someSelected ? (
                  <div className="bg-primary h-1.5 w-2.5 rounded-sm" />
                ) : null}
              </div>
            </th>
            <th className="text-muted-foreground px-4 py-3 text-left text-[9px] font-[var(--font-data)] font-bold tracking-[0.22em] uppercase">Client</th>
            <th className="text-muted-foreground px-4 py-3 text-left text-[9px] font-[var(--font-data)] font-bold tracking-[0.22em] uppercase">Status</th>
            <th className="text-muted-foreground px-4 py-3 text-right text-[9px] font-[var(--font-data)] font-bold tracking-[0.22em] uppercase">Projects</th>
            <th className="text-muted-foreground px-4 py-3 text-right text-[9px] font-[var(--font-data)] font-bold tracking-[0.22em] uppercase">Outstanding</th>
            <th className="text-muted-foreground px-4 py-3 text-left text-[9px] font-[var(--font-data)] font-bold tracking-[0.22em] uppercase">Last Active</th>
            <th className="w-12 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {clients.map((client, index) => {
            const isSelected = selected.has(client.id);
            return (
              <motion.tr
                key={client.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: index * 0.025, ease: CUBIC_BEZIER }}
                className={cn(
                  "border-border group cursor-pointer border-b transition-colors duration-100",
                  isSelected
                    ? "bg-primary/5"
                    : "hover:bg-muted/30",
                  client.displayStatus === "archived" && "opacity-60",
                )}
                onClick={() => router.push(`/clients/${client.id}`)}
              >
                {/* Checkbox */}
                <td className="w-12 px-4 py-4" onClick={(e) => { e.stopPropagation(); onToggle(client.id, e.shiftKey); }}>
                  <div className={cn(
                    "mx-auto flex h-5 w-5 cursor-pointer items-center justify-center rounded border-2 transition-all duration-150",
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-border bg-transparent hover:border-primary",
                  )}>
                    {isSelected && (
                      <svg className="text-primary-foreground h-3 w-3" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </td>

                {/* Client */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <ClientAvatar
                      companyName={client.companyName}
                      contactName={client.contactName}
                      email={client.email}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-foreground truncate text-[13px] font-[var(--font-display)] font-semibold">
                        {client.companyName || client.email}
                      </p>
                      <p className="text-muted-foreground truncate text-[11px] font-[var(--font-data)]">
                        {client.contactName ? `${client.contactName} · ` : ""}{client.email}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <StatusDropdown
                    status={client.displayStatus}
                    interactive={false}
                  />
                </td>

                {/* Projects */}
                <td className="px-4 py-4 text-right">
                  <span className="text-foreground text-[18px] font-[var(--font-metrics)]">
                    {client.activeProjectCount}
                  </span>
                </td>

                {/* Outstanding */}
                <td className="px-4 py-4 text-right">
                  <span className={cn(
                    "text-[13px] font-[var(--font-metrics)]",
                    client.outstandingAmountCents > 0 ? "text-amber-500" : "text-muted-foreground",
                  )}>
                    {client.outstandingAmountCents > 0 ? formatCents(client.outstandingAmountCents) : "—"}
                  </span>
                </td>

                {/* Last active */}
                <td className="px-4 py-4">
                  <span className="text-muted-foreground text-[11px] font-[var(--font-data)]">
                    {formatRelative(client.lastActivityAt)}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => router.push(`/clients/${client.id}`)}
                      className="border-primary/30 text-primary hover:bg-primary/10 rounded-lg border px-2.5 py-1.5 text-[10px] font-[var(--font-data)] font-bold tracking-[0.15em] uppercase transition-colors"
                    >
                      View
                    </button>
                    <RowMenu client={client} onEdit={onEdit} onDelete={onDelete} onArchive={onArchive} role={role} />
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
