"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  Pencil,
  Plus,
  MoreHorizontal,
  Archive,
  Trash2,
  Clock,
  FileDown,
} from "lucide-react";
import { differenceInDays } from "date-fns";
import type { Project } from "../../types";
import { formatStatus } from "../../../utils/formatters";

/* ── Status color helpers ─────────────────────────────────── */
function statusColor(s: string) {
  switch (s) {
    case "in_progress":
    case "review":
      return "var(--pd-status-progress)";
    case "completed":
      return "var(--pd-status-done)";
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

/* ── More Menu (kebab dropdown) ───────────────────────────── */
function MoreMenu({
  open,
  onClose,
  onArchive,
  onDelete,
  onGenerateReport,
}: {
  open: boolean;
  onClose: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onGenerateReport?: () => void;
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

  return (
    <div
      ref={ref}
      className="pd-animate-fade-up absolute top-full right-0 z-50 mt-2 w-52 py-1.5"
      style={{
        background: "var(--pd-surface)",
        border: "1px solid var(--pd-border)",
        borderRadius: 12,
        boxShadow: "var(--pd-shadow-elevated)",
      }}
    >
      {onGenerateReport && (
        <button
          onClick={() => {
            onGenerateReport();
            onClose();
          }}
          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors"
          style={{
            color: "var(--pd-text-secondary)",
            fontFamily: "var(--font-data)",
            fontSize: 13,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--pd-accent-subtle)";
            e.currentTarget.style.color = "var(--pd-text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--pd-text-secondary)";
          }}
        >
          <FileDown size={14} />
          Generate Report
        </button>
      )}

      <button
        onClick={() => {
          onArchive();
          onClose();
        }}
        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors"
        style={{
          color: "var(--pd-text-secondary)",
          fontFamily: "var(--font-data)",
          fontSize: 13,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--pd-accent-subtle)";
          e.currentTarget.style.color = "var(--pd-text-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--pd-text-secondary)";
        }}
      >
        <Archive size={14} />
        Archive Project
      </button>

      <div
        className="my-1.5"
        style={{ height: 1, background: "var(--pd-divider)" }}
      />

      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors"
        style={{
          color: "var(--pd-status-overdue)",
          fontFamily: "var(--font-data)",
          fontSize: 13,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--pd-status-overdue-bg)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        <Trash2 size={14} />
        Delete Project
      </button>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */
interface ProjectTopBarProps {
  project: Project;
  onEdit: () => void;
  onAddMilestone: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onGenerateReport?: () => void;
}

export function ProjectTopBar({
  project,
  onEdit,
  onAddMilestone,
  onArchive,
  onDelete,
  onGenerateReport,
}: ProjectTopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const clientName = useMemo(
    () =>
      project.client?.company_name ||
      project.client?.contact_name ||
      "No client",
    [project.client],
  );

  const daysOverdue = useMemo(() => {
    if (!project.deadline) return null;
    const diff = differenceInDays(new Date(), new Date(project.deadline));
    return diff > 0 ? diff : null;
  }, [project.deadline]);

  return (
    <div
      className="w-full px-8 pt-6 pb-4"
      style={{ background: "var(--pd-body)" }}
    >
      {/* Breadcrumb */}
      <div
        className="pd-animate-fade-up mb-1 flex items-center gap-1"
        style={{ fontFamily: "var(--font-data)", fontSize: 12 }}
      >
        <a
          href="/projects"
          className="transition-colors hover:underline"
          style={{ color: "var(--pd-text-muted)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--pd-text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--pd-text-muted)";
          }}
        >
          Projects
        </a>
        <span style={{ color: "var(--pd-text-muted)", fontSize: 10 }}>›</span>
        <span style={{ color: "var(--pd-text-secondary)" }}>
          {project.name}
        </span>
      </div>

      {/* Title + Actions */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Title + badges */}
        <div
          className="pd-animate-fade-up flex flex-col gap-3"
          style={{ animationDelay: "60ms" }}
        >
          {/* Project Title */}
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

          {/* Badge Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status pill */}
            <span
              className="inline-flex items-center gap-1.5"
              style={{
                background: statusBg(project.status),
                color: statusColor(project.status),
                fontFamily: "var(--font-data)",
                fontSize: 12,
                borderRadius: 6,
                padding: "6px 10px",
              }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: statusColor(project.status) }}
              />
              {formatStatus(project.status)}
            </span>

            {/* Client pill */}
            <span
              className="inline-flex items-center gap-1.5"
              style={{
                background: "var(--pd-surface)",
                border: "1px solid var(--pd-border)",
                fontFamily: "var(--font-data)",
                fontSize: 12,
                color: "var(--pd-text-secondary)",
                borderRadius: 6,
                padding: "5px 10px",
              }}
            >
              <span
                className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full"
                style={{
                  background: "var(--pd-accent)",
                  color: "#fff",
                  fontSize: 8,
                  fontWeight: 700,
                }}
              >
                {clientName.charAt(0).toUpperCase()}
              </span>
              {clientName}
            </span>

            {/* Overdue badge */}
            {daysOverdue && (
              <span
                className="inline-flex items-center gap-1"
                style={{
                  background: "var(--pd-status-overdue-bg)",
                  color: "var(--pd-status-overdue)",
                  fontFamily: "var(--font-data)",
                  fontSize: 12,
                  borderRadius: 6,
                  padding: "6px 10px",
                }}
              >
                <Clock size={11} />
                {daysOverdue}d overdue
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div
          className="pd-animate-fade-up relative flex shrink-0 items-center gap-2"
          style={{ animationDelay: "100ms" }}
        >
          {/* Edit button — ghost */}
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 border px-3 transition-all active:scale-[0.98]"
            style={{
              borderColor: "var(--pd-border)",
              color: "var(--pd-text-secondary)",
              fontFamily: "var(--font-data)",
              fontSize: 13,
              height: 36,
              borderRadius: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--pd-accent)";
              e.currentTarget.style.color = "var(--pd-text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--pd-border)";
              e.currentTarget.style.color = "var(--pd-text-secondary)";
            }}
          >
            <Pencil size={14} />
            Edit
          </button>

          {/* Add Milestone CTA — solid primary */}
          <button
            onClick={onAddMilestone}
            className="flex items-center gap-1.5 px-3.5 transition-all active:scale-[0.98]"
            style={{
              background: "var(--pd-accent)",
              color: "#fff",
              fontFamily: "var(--font-display)",
              fontSize: 13,
              fontWeight: 500,
              height: 36,
              borderRadius: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--pd-accent-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--pd-accent)";
            }}
          >
            <Plus size={14} />
            Add Milestone
          </button>

          {/* Kebab menu — ghost icon-only */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center justify-center transition-colors active:scale-[0.98]"
            style={{
              color: "var(--pd-text-secondary)",
              width: 36,
              height: 36,
              borderRadius: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--pd-accent-subtle)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <MoreHorizontal size={16} />
          </button>

          <MoreMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            onArchive={onArchive}
            onDelete={onDelete}
            onGenerateReport={onGenerateReport}
          />
        </div>
      </div>
    </div>
  );
}
