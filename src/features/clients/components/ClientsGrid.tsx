"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Edit2, FileText, Trash2, Archive, Eye, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { CUBIC_BEZIER } from "../constants";
import { formatRelative, formatCents } from "../utils/formatters";
import type { ClientListItem } from "../client.types";
import { ClientAvatar } from "./ClientAvatar";
import { StatusDropdown } from "./StatusDropdown";
import type { ClientDisplayStatus } from "../client.types";
import { useState, useRef, useEffect } from "react";

type GridCardProps = {
  client: ClientListItem;
  index: number;
  selected: boolean;
  onToggle: (id: string, shift: boolean) => void;
  onEdit: (client: ClientListItem) => void;
  onDelete: (client: ClientListItem) => void;
  onArchive: (client: ClientListItem) => void;
  onStatusChange: (id: string, status: ClientDisplayStatus) => void;
  role: "owner" | "admin" | "member" | "client";
};

function MoreMenu({
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
        className="flex h-7 w-7 items-center justify-center rounded-full text-[#6B6B7E] hover:bg-white/10 hover:text-[#F2F2F5] transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-full right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#16161F] py-1 shadow-2xl"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
        >
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-[11px] tracking-wide text-[#6B6B7E] hover:bg-white/5 hover:text-[#F2F2F5] transition-colors"
            onClick={() => { router.push(`/clients/${client.id}`); setOpen(false); }}
          >
            <Eye className="h-3.5 w-3.5" /> View Profile
          </button>
          {(role === "owner" || role === "admin") && (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-[11px] tracking-wide text-[#6B6B7E] hover:bg-white/5 hover:text-[#F2F2F5] transition-colors"
              onClick={() => { onEdit(client); setOpen(false); }}
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </button>
          )}
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-[11px] tracking-wide text-[#6B6B7E] hover:bg-white/5 hover:text-[#F2F2F5] transition-colors"
            onClick={() => { router.push(`/invoices/new?clientId=${client.id}`); setOpen(false); }}
          >
            <FileText className="h-3.5 w-3.5" /> Create Invoice
          </button>
          {(role === "owner" || role === "admin") && client.displayStatus !== "archived" && (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-[11px] tracking-wide text-[#6B6B7E] hover:bg-white/5 hover:text-[#F2F2F5] transition-colors"
              onClick={() => { onArchive(client); setOpen(false); }}
            >
              <Archive className="h-3.5 w-3.5" /> Archive
            </button>
          )}
          {(role === "owner" || role === "admin") && (
            <>
              <div className="my-1 border-t border-[rgba(255,255,255,0.05)]" />
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-[11px] tracking-wide text-[#EF4444] hover:bg-[rgba(239,68,68,0.06)] transition-colors"
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

function GridCard({
  client,
  index,
  selected,
  onToggle,
  onEdit,
  onDelete,
  onArchive,
  onStatusChange,
  role,
}: GridCardProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: CUBIC_BEZIER }}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl border bg-card transition-all duration-200",
        selected
          ? "border-[#4F7FFF]/50 bg-[rgba(79,127,255,0.04)] shadow-[0_0_0_1px_rgba(79,127,255,0.2)]"
          : "border-border hover:border-[rgba(79,127,255,0.2)] hover:shadow-lg hover:shadow-[rgba(0,0,0,0.2)]",
        client.displayStatus === "archived" && "opacity-60",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => router.push(`/clients/${client.id}`)}
    >
      {/* Selection left border accent */}
      {selected && (
        <div className="absolute top-0 left-0 h-full w-[3px] bg-[#4F7FFF]" />
      )}

      {/* Checkbox */}
      <div
        className={cn(
          "absolute top-3 left-3 z-10 transition-all duration-150",
          hovered || selected ? "opacity-100" : "opacity-0",
        )}
        onClick={(e) => { e.stopPropagation(); onToggle(client.id, e.shiftKey); }}
      >
        <div className={cn(
          "flex h-5 w-5 cursor-pointer items-center justify-center rounded border-2 transition-all duration-150",
          selected
            ? "border-[#4F7FFF] bg-[#4F7FFF]"
            : "border-[rgba(255,255,255,0.3)] bg-[rgba(0,0,0,0.3)] hover:border-[#4F7FFF]",
        )}>
          {selected && (
            <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      {/* ⋯ More menu */}
      <div className={cn(
        "absolute top-3 right-3 z-10 transition-opacity duration-150",
        hovered ? "opacity-100" : "opacity-0",
      )}>
        <MoreMenu client={client} onEdit={onEdit} onDelete={onDelete} onArchive={onArchive} role={role} />
      </div>

      {/* Card Body */}
      <div className="p-5 pt-7">
        {/* Avatar + Name */}
        <div className="flex items-start gap-3 mb-4">
          <ClientAvatar
            companyName={client.companyName}
            contactName={client.contactName}
            email={client.email}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-bold tracking-tight text-[#F2F2F5] font-[var(--font-display)]">
              {client.companyName || client.email}
            </h3>
            <p className="truncate text-[12px] text-[#6B6B7E] font-[var(--font-data)]">
              {client.contactName || client.email}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div className="mb-4" onClick={(e) => e.stopPropagation()}>
          <StatusDropdown
            status={client.displayStatus}
            interactive={false}
          />
        </div>

        {/* KPI cells */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-xl border border-border bg-[rgba(255,255,255,0.02)] p-3">
            <p className="text-[9px] font-bold tracking-[0.2em] text-[#3D3D4E] uppercase mb-1 font-[var(--font-data)]">Projects</p>
            <p className="text-[22px] font-[var(--font-metrics)] leading-none text-[#F2F2F5]">
              {client.activeProjectCount}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-[rgba(255,255,255,0.02)] p-3">
            <p className="text-[9px] font-bold tracking-[0.2em] text-[#3D3D4E] uppercase mb-1 font-[var(--font-data)]">Outstanding</p>
            <p className={cn(
              "text-[16px] font-[var(--font-metrics)] leading-none",
              client.outstandingAmountCents > 0 ? "text-[#F59E0B]" : "text-[#F2F2F5]",
            )}>
              {client.outstandingAmountCents > 0 ? formatCents(client.outstandingAmountCents) : "—"}
            </p>
          </div>
        </div>

        {/* Last activity */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-[#3D3D4E] font-[var(--font-data)]">
            {formatRelative(client.lastActivityAt)}
          </p>
        </div>
      </div>

      {/* Hover quick actions */}
      <div className={cn(
        "absolute inset-x-0 bottom-0 flex items-center gap-2 border-t border-[rgba(255,255,255,0.04)] bg-[rgba(17,17,24,0.85)] px-4 py-3 backdrop-blur-sm transition-all duration-200",
        hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none",
      )}>
        {(role === "owner" || role === "admin") && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(client); }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-[#6B6B7E] hover:bg-white/8 hover:text-[#F2F2F5] transition-colors font-[var(--font-data)]"
          >
            <Edit2 className="h-3 w-3" /> Edit
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/invoices/new?clientId=${client.id}`); }}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-[#6B6B7E] hover:bg-white/8 hover:text-[#F2F2F5] transition-colors font-[var(--font-data)]"
        >
          <FileText className="h-3 w-3" /> Invoice
        </button>
        <div className="flex-1" />
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/clients/${client.id}`); }}
          className="flex items-center gap-1.5 rounded-lg bg-[rgba(79,127,255,0.12)] px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-[#4F7FFF] hover:bg-[rgba(79,127,255,0.2)] transition-colors font-[var(--font-data)]"
        >
          <Eye className="h-3 w-3" /> View
        </button>
      </div>
    </motion.div>
  );
}

type ClientsGridProps = {
  clients: ClientListItem[];
  selected: Set<string>;
  onToggle: (id: string, shift: boolean) => void;
  onEdit: (client: ClientListItem) => void;
  onDelete: (client: ClientListItem) => void;
  onArchive: (client: ClientListItem) => void;
  onStatusChange: (id: string, status: ClientDisplayStatus) => void;
  role: "owner" | "admin" | "member" | "client";
};

export function ClientsGrid({
  clients,
  selected,
  onToggle,
  onEdit,
  onDelete,
  onArchive,
  onStatusChange,
  role,
}: ClientsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {clients.map((client, index) => (
        <GridCard
          key={client.id}
          client={client}
          index={index}
          selected={selected.has(client.id)}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onArchive={onArchive}
          onStatusChange={onStatusChange}
          role={role}
        />
      ))}
    </div>
  );
}
