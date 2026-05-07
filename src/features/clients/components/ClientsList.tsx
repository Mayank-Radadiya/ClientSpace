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
        className="flex h-7 w-7 items-center justify-center rounded-full text-[#6B6B7E] hover:bg-white/5 hover:text-[#F2F2F5] transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-full right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#16161F] py-1 shadow-2xl"
        >
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-[11px] text-[#6B6B7E] hover:bg-white/5 hover:text-[#F2F2F5] transition-colors"
            onClick={() => { router.push(`/clients/${client.id}`); setOpen(false); }}
          >
            <Eye className="h-3.5 w-3.5" /> View Profile
          </button>
          {(role === "owner" || role === "admin") && (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-[11px] text-[#6B6B7E] hover:bg-white/5 hover:text-[#F2F2F5] transition-colors"
              onClick={() => { onEdit(client); setOpen(false); }}
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </button>
          )}
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-[11px] text-[#6B6B7E] hover:bg-white/5 hover:text-[#F2F2F5] transition-colors"
            onClick={() => { router.push(`/invoices/new?clientId=${client.id}`); setOpen(false); }}
          >
            <FileText className="h-3.5 w-3.5" /> Create Invoice
          </button>
          {(role === "owner" || role === "admin") && client.displayStatus !== "archived" && (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-[11px] text-[#6B6B7E] hover:bg-white/5 hover:text-[#F2F2F5] transition-colors"
              onClick={() => { onArchive(client); setOpen(false); }}
            >
              <Archive className="h-3.5 w-3.5" /> Archive
            </button>
          )}
          {(role === "owner" || role === "admin") && (
            <>
              <div className="my-1 border-t border-[rgba(255,255,255,0.05)]" />
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-[11px] text-[#EF4444] hover:bg-[rgba(239,68,68,0.06)] transition-colors"
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
          <tr className="border-b border-border bg-[rgba(255,255,255,0.01)]">
            {/* Select all */}
            <th className="w-12 px-4 py-3" onClick={onToggleAll}>
              <div className={cn(
                "mx-auto flex h-5 w-5 cursor-pointer items-center justify-center rounded border-2 transition-all duration-150",
                allSelected
                  ? "border-[#4F7FFF] bg-[#4F7FFF]"
                  : someSelected
                    ? "border-[#4F7FFF] bg-transparent"
                    : "border-[rgba(255,255,255,0.2)] bg-transparent hover:border-[#4F7FFF]",
              )}>
                {allSelected ? (
                  <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : someSelected ? (
                  <div className="h-1.5 w-2.5 rounded-sm bg-[#4F7FFF]" />
                ) : null}
              </div>
            </th>
            <th className="px-4 py-3 text-left text-[9px] font-bold tracking-[0.22em] text-[#3D3D4E] uppercase font-[var(--font-data)]">Client</th>
            <th className="px-4 py-3 text-left text-[9px] font-bold tracking-[0.22em] text-[#3D3D4E] uppercase font-[var(--font-data)]">Status</th>
            <th className="px-4 py-3 text-right text-[9px] font-bold tracking-[0.22em] text-[#3D3D4E] uppercase font-[var(--font-data)]">Projects</th>
            <th className="px-4 py-3 text-right text-[9px] font-bold tracking-[0.22em] text-[#3D3D4E] uppercase font-[var(--font-data)]">Outstanding</th>
            <th className="px-4 py-3 text-left text-[9px] font-bold tracking-[0.22em] text-[#3D3D4E] uppercase font-[var(--font-data)]">Last Active</th>
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
                  "group border-b border-[rgba(255,255,255,0.03)] cursor-pointer transition-colors duration-100",
                  isSelected
                    ? "bg-[rgba(79,127,255,0.05)]"
                    : "hover:bg-[rgba(255,255,255,0.02)]",
                  client.displayStatus === "archived" && "opacity-60",
                )}
                onClick={() => router.push(`/clients/${client.id}`)}
              >
                {/* Checkbox */}
                <td className="w-12 px-4 py-4" onClick={(e) => { e.stopPropagation(); onToggle(client.id, e.shiftKey); }}>
                  <div className={cn(
                    "mx-auto flex h-5 w-5 cursor-pointer items-center justify-center rounded border-2 transition-all duration-150",
                    isSelected
                      ? "border-[#4F7FFF] bg-[#4F7FFF]"
                      : "border-[rgba(255,255,255,0.15)] bg-transparent hover:border-[#4F7FFF]",
                  )}>
                    {isSelected && (
                      <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
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
                      <p className="truncate text-[13px] font-semibold text-[#F2F2F5] font-[var(--font-display)]">
                        {client.companyName || client.email}
                      </p>
                      <p className="truncate text-[11px] text-[#6B6B7E] font-[var(--font-data)]">
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
                  <span className="text-[18px] font-[var(--font-metrics)] text-[#F2F2F5]">
                    {client.activeProjectCount}
                  </span>
                </td>

                {/* Outstanding */}
                <td className="px-4 py-4 text-right">
                  <span className={cn(
                    "text-[13px] font-[var(--font-metrics)]",
                    client.outstandingAmountCents > 0 ? "text-[#F59E0B]" : "text-[#3D3D4E]",
                  )}>
                    {client.outstandingAmountCents > 0 ? formatCents(client.outstandingAmountCents) : "—"}
                  </span>
                </td>

                {/* Last active */}
                <td className="px-4 py-4">
                  <span className="text-[11px] text-[#6B6B7E] font-[var(--font-data)]">
                    {formatRelative(client.lastActivityAt)}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => router.push(`/clients/${client.id}`)}
                      className="rounded-lg border border-[rgba(79,127,255,0.3)] px-2.5 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-[#4F7FFF] hover:bg-[rgba(79,127,255,0.1)] transition-colors font-[var(--font-data)]"
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
