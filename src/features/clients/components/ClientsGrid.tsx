"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  AnimatedListItem,
  listContainerVariants,
} from "@/components/AnimatedListItem";
import {
  Edit2,
  FileText,
  Trash2,
  Archive,
  Eye,
  MoreHorizontal,
  Clock,
} from "lucide-react";
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
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-black/5 text-[#6B6B7E] transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-full right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-[rgba(0,0,0,0.08)] bg-white py-1 shadow-[0_8px_32px_rgba(0,0,0,0.2)] dark:border-[rgba(255,255,255,0.08)] dark:bg-[#16161F]"
        >
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-[11px] tracking-wide text-[#6B6B7E] transition-colors hover:bg-black/5 hover:text-[#0D0D14] dark:hover:bg-white/5 dark:hover:text-[#F2F2F5]"
            onClick={() => {
              router.push(`/clients/${client.id}`);
              setOpen(false);
            }}
          >
            <Eye className="h-3.5 w-3.5" /> View Profile
          </button>
          {(role === "owner" || role === "admin") && (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-[11px] tracking-wide text-[#6B6B7E] transition-colors hover:bg-black/5 hover:text-[#0D0D14] dark:hover:bg-white/5 dark:hover:text-[#F2F2F5]"
              onClick={() => {
                onEdit(client);
                setOpen(false);
              }}
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </button>
          )}
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-[11px] tracking-wide text-[#6B6B7E] transition-colors hover:bg-black/5 hover:text-[#0D0D14] dark:hover:bg-white/5 dark:hover:text-[#F2F2F5]"
            onClick={() => {
              router.push(`/invoices/new?clientId=${client.id}`);
              setOpen(false);
            }}
          >
            <FileText className="h-3.5 w-3.5" /> Create Invoice
          </button>
          {(role === "owner" || role === "admin") &&
            client.displayStatus !== "archived" && (
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-[11px] tracking-wide text-[#6B6B7E] transition-colors hover:bg-black/5 hover:text-[#0D0D14] dark:hover:bg-white/5 dark:hover:text-[#F2F2F5]"
                onClick={() => {
                  onArchive(client);
                  setOpen(false);
                }}
              >
                <Archive className="h-3.5 w-3.5" /> Archive
              </button>
            )}
          {(role === "owner" || role === "admin") && (
            <>
              <div className="my-1 border-t border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)]" />
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-[11px] tracking-wide text-[#EF4444] transition-colors hover:bg-[rgba(239,68,68,0.06)]"
                onClick={() => {
                  onDelete(client);
                  setOpen(false);
                }}
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

  // Capitalize properly
  const formatName = (name: string) => {
    return name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <motion.div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[16px] border bg-white transition-all duration-180 ease-out dark:bg-[#111118]",
        selected
          ? "border-[rgba(79,127,255,0.4)] shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)]"
          : "border-border dark:border-border shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:border-[rgba(79,127,255,0.4)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)]",
        hovered && "translate-y-[-2px]",
        client.displayStatus === "archived" && "opacity-60",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => router.push(`/clients/${client.id}`)}
    >
      {/* Selection left border accent */}
      {selected && (
        <div className="absolute top-0 left-0 h-full w-[3px] bg-[var(--primary)] dark:bg-[var(--primary)]" />
      )}

      {/* ROW 1: Top Meta */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div
          className={cn(
            "z-10 transition-opacity duration-150",
            hovered || selected ? "opacity-100" : "opacity-0",
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(client.id, e.shiftKey);
          }}
        >
          <div
            className={cn(
              "flex h-4 w-4 cursor-pointer items-center justify-center rounded-[4px] border transition-all duration-150 active:scale-95",
              selected
                ? "scale-110 border-[var(--primary)] bg-[var(--primary)] dark:border-[var(--primary)] dark:bg-[var(--primary)]"
                : "border-[rgba(0,0,0,0.3)] hover:border-[var(--primary)] dark:border-[rgba(255,255,255,0.3)] dark:hover:border-[var(--primary)]",
            )}
          >
            {selected && (
              <svg
                className="h-2.5 w-2.5 text-white"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M2 6l3 3 5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>

        {/* If not hovered and not selected, keep space but hide checkbox */}
        {!hovered && !selected && <div className="h-4 w-4" />}

        <div className="z-10" onClick={(e) => e.stopPropagation()}>
          <MoreMenu
            client={client}
            onEdit={onEdit}
            onDelete={onDelete}
            onArchive={onArchive}
            role={role}
          />
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col px-5 pb-5">
        {/* ROW 2: Identity */}
        <div className="mb-4 flex flex-col items-center gap-3 text-center">
          <ClientAvatar
            companyName={client.companyName}
            contactName={client.contactName}
            email={client.email}
            size="lg" // Larger avatar size 48px
          />
          <div className="min-w-0">
            <h3 className="truncate text-[17px] font-semibold tracking-tight text-[#0D0D14] dark:text-[#F2F2F5]">
              {client.companyName || client.email}
            </h3>
            <p className="truncate text-[12px] text-[#6B6B7E]">
              {client.contactName
                ? formatName(client.contactName)
                : client.email}
            </p>
            <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-[#A0A0B0] dark:text-[#6B6B7E]">
              {client.email}
            </p>
          </div>
        </div>

        {/* ROW 3: Status Badge */}
        <div
          className="mb-4 flex justify-start"
          onClick={(e) => e.stopPropagation()}
        >
          <StatusDropdown status={client.displayStatus} interactive={false} />
        </div>

        {/* ROW 4: Tags */}
        <div className="mb-4 flex flex-wrap justify-start gap-1.5">
          <span className="rounded-full bg-[rgba(59,111,239,0.1)] px-2 py-0.5 text-[10px] text-[var(--primary)] dark:text-[var(--primary)]">
            VIP
          </span>
          <span className="rounded-full bg-[rgba(59,111,239,0.1)] px-2 py-0.5 text-[10px] text-[var(--primary)] dark:text-[var(--primary)]">
            Tech
          </span>
        </div>

        <div className="flex-1" />

        {/* ROW 5: KPI Cells */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="border-border dark:border-border rounded-[8px] border px-3 py-2.5">
            <p className="mb-1 text-[10px] tracking-[0.08em] text-[#6B6B7E] uppercase">
              Projects
            </p>
            <p className="text-[22px] leading-none font-(--font-metrics) text-[#0D0D14] dark:text-[#F2F2F5]">
              {client.activeProjectCount}
            </p>
          </div>
          <div className="border-border dark:border-border rounded-[8px] border px-3 py-2.5">
            <p className="mb-1 text-[10px] tracking-[0.08em] text-[#6B6B7E] uppercase">
              Outstanding
            </p>
            <p
              className={cn(
                "text-[22px] leading-none font-(--font-metrics)",
                client.outstandingAmountCents > 0
                  ? "text-[#F59E0B]"
                  : "text-[#0D0D14] dark:text-[#6B6B7E]",
              )}
            >
              {client.outstandingAmountCents > 0
                ? formatCents(client.outstandingAmountCents)
                : "$0.00"}
            </p>
          </div>
        </div>

        {/* ROW 6: Footer Meta */}
        <div className="mb-8 flex items-center gap-1.5 text-[11px] text-[#6B6B7E]">
          <Clock className="h-3 w-3" />
          <span>{formatRelative(client.lastActivityAt)}</span>
        </div>
      </div>

      {/* ROW 7: Hover quick actions */}
      <div
        className={cn(
          "divide-border border-border dark:divide-border dark:border-border absolute inset-x-0 bottom-0 grid grid-cols-3 divide-x border-t bg-[#F8F8FC] transition-all duration-180 ease-out dark:bg-[#1A1A24]",
          hovered
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0",
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (role === "owner" || role === "admin") onEdit(client);
          }}
          disabled={role !== "owner" && role !== "admin"}
          className="group/btn flex items-center justify-center gap-1.5 py-3 text-[#6B6B7E] transition-colors hover:bg-black/5 hover:text-[#0D0D14] disabled:opacity-50 dark:hover:bg-white/5 dark:hover:text-[#F2F2F5]"
        >
          <Edit2 className="h-4 w-4 transition-colors group-hover/btn:text-[var(--primary)] dark:group-hover/btn:text-[var(--primary)]" />
          <span className="text-[11px] uppercase">Edit</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/invoices/new?clientId=${client.id}`);
          }}
          className="group/btn flex items-center justify-center gap-1.5 py-3 text-[#6B6B7E] transition-colors hover:bg-black/5 hover:text-[#0D0D14] dark:hover:bg-white/5 dark:hover:text-[#F2F2F5]"
        >
          <FileText className="h-4 w-4 transition-colors group-hover/btn:text-[var(--primary)] dark:group-hover/btn:text-[var(--primary)]" />
          <span className="text-[11px] uppercase">Invoice</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/clients/${client.id}`);
          }}
          className="group/btn flex items-center justify-center gap-1.5 py-3 text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/10 dark:text-[var(--primary)] dark:hover:bg-[var(--primary)]/10"
        >
          <Eye className="h-4 w-4" />
          <span className="text-[11px] uppercase">View</span>
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
    <motion.div
      variants={listContainerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-4"
    >
      {clients.map((client, index) => (
        <AnimatedListItem key={client.id}>
          <GridCard
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
        </AnimatedListItem>
      ))}
    </motion.div>
  );
}
