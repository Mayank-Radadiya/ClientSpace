"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  Pencil,
  Plus,
  MoreHorizontal,
  Copy,
  FileText,
  Share2,
  Archive,
  Trash2,
} from "lucide-react";
import type { Project, ProjectMember } from "../../types";
import { formatStatus } from "../../../utils/formatters";

/* ── Status color helper ──────────────────────────────────── */
function statusColor(s: string) {
  switch (s) {
    case "in_progress":
    case "review":
      return "var(--pd-status-progress)";
    case "completed":
      return "var(--pd-status-done)";
    case "on_hold":
    case "not_started":
      return "var(--pd-status-hold)";
    case "archived":
      return "var(--pd-status-hold)";
    default:
      return "var(--pd-status-hold)";
  }
}

function statusBg(s: string) {
  switch (s) {
    case "in_progress":
    case "review":
      return "var(--pd-status-progress-bg)";
    case "completed":
      return "var(--pd-status-done-bg)";
    default:
      return "var(--pd-status-hold-bg)";
  }
}

/* ── More Menu ────────────────────────────────────────────── */
function MoreMenu({
  open,
  onClose,
  onDuplicate,
  onExport,
  onShare,
  onArchive,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onShare: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const items = [
    { icon: Copy, label: "Duplicate Project", onClick: onDuplicate },
    { icon: FileText, label: "Export PDF Report", onClick: onExport },
    { icon: Share2, label: "Share Link", onClick: onShare },
    { icon: Archive, label: "Archive Project", onClick: onArchive },
  ];

  return (
    <div
      ref={ref}
      className="pd-animate-fade-up absolute top-full right-0 z-50 mt-2 w-52 rounded-xl py-1.5"
      style={{
        background: "var(--pd-surface)",
        border: "1px solid var(--pd-border)",
        boxShadow: "var(--pd-shadow-elevated)",
      }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => { item.onClick(); onClose(); }}
          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors"
          style={{ color: "var(--pd-text-secondary)", fontFamily: "var(--font-data)", fontSize: 13 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--pd-accent-subtle)"; e.currentTarget.style.color = "var(--pd-text-primary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--pd-text-secondary)"; }}
        >
          <item.icon size={14} />
          {item.label}
        </button>
      ))}
      <div className="my-1.5" style={{ height: 1, background: "var(--pd-divider)" }} />
      <button
        onClick={() => { onDelete(); onClose(); }}
        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors"
        style={{ color: "var(--pd-status-overdue)", fontFamily: "var(--font-data)", fontSize: 13 }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <Trash2 size={14} />
        Delete Project
      </button>
    </div>
  );
}

/* ── Initials Avatar ──────────────────────────────────────── */
function InitialsAvatar({ name, size = 20 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: "var(--pd-accent-subtle)",
        color: "var(--pd-accent)",
        fontFamily: "var(--font-data)",
        fontSize: size * 0.45,
        fontWeight: 600,
      }}
    >
      {initials}
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */
interface ProjectTopBarProps {
  project: Project;
  onEdit: () => void;
  onAddMilestone: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onShare: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function ProjectTopBar({
  project,
  onEdit,
  onAddMilestone,
  onDuplicate,
  onExport,
  onShare,
  onArchive,
  onDelete,
}: ProjectTopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const clientName = useMemo(() => {
    return project.client?.company_name || project.client?.contact_name || "No client";
  }, [project.client]);

  return (
    <div
      className="w-full px-6 pt-5 pb-4"
      style={{ background: "var(--pd-body)" }}
    >
      {/* Breadcrumb */}
      <div
        className="pd-animate-fade-up mb-3 flex items-center gap-1.5"
        style={{ fontFamily: "var(--font-data)", fontSize: 13 }}
      >
        <a
          href="/projects"
          className="transition-colors hover:underline"
          style={{ color: "var(--pd-text-muted)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--pd-text-primary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--pd-text-muted)"; }}
        >
          Projects
        </a>
        <ChevronRight size={12} style={{ color: "var(--pd-text-muted)" }} />
        <span style={{ color: "var(--pd-text-primary)" }}>{project.name}</span>
      </div>

      {/* Identity Row */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Name + badges */}
        <div
          className="pd-animate-fade-up flex flex-wrap items-center gap-3"
          style={{ animationDelay: "60ms" }}
        >
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 32,
              fontWeight: 800,
              color: "var(--pd-text-primary)",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            {project.name}
          </h1>

          {/* Status pill */}
          <button
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-opacity hover:opacity-80"
            style={{
              background: statusBg(project.status),
              fontFamily: "var(--font-data)",
              fontSize: 12,
              color: statusColor(project.status),
            }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: statusColor(project.status) }}
            />
            {formatStatus(project.status)}
          </button>

          {/* Client pill */}
          <div
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{
              background: "var(--pd-accent-subtle)",
              fontFamily: "var(--font-data)",
              fontSize: 12,
              color: "var(--pd-text-secondary)",
            }}
          >
            <InitialsAvatar name={clientName} />
            {clientName}
          </div>
        </div>

        {/* Right: Actions */}
        <div
          className="pd-animate-fade-up relative flex shrink-0 items-center gap-2"
          style={{ animationDelay: "100ms" }}
        >
          {/* Edit */}
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-all"
            style={{
              borderColor: "var(--pd-border)",
              color: "var(--pd-text-secondary)",
              fontFamily: "var(--font-data)",
              fontSize: 13,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--pd-accent)"; e.currentTarget.style.color = "var(--pd-text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--pd-border)"; e.currentTarget.style.color = "var(--pd-text-secondary)"; }}
          >
            <Pencil size={14} />
            Edit
          </button>

          {/* Add Milestone CTA */}
          <button
            onClick={onAddMilestone}
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-all"
            style={{
              background: "var(--pd-accent)",
              color: "#fff",
              fontFamily: "var(--font-data)",
              fontSize: 13,
              fontWeight: 500,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--pd-accent-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--pd-accent)"; }}
          >
            <Plus size={14} />
            Add Milestone
          </button>

          {/* More menu */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            style={{ color: "var(--pd-text-secondary)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--pd-accent-subtle)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <MoreHorizontal size={16} />
          </button>

          <MoreMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            onDuplicate={onDuplicate}
            onExport={onExport}
            onShare={onShare}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );
}
