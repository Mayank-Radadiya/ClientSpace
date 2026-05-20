"use client";

import { useMemo } from "react";
import {
  User2,
  BarChart3,
  Flag,
  Calendar,
  DollarSign,
  Tag,
  CalendarPlus,
  FileText,
  Copy,
  Download,
  Archive,
  Trash2,
  Plus,
} from "lucide-react";
import type { Project, ProjectMember } from "../../types";
import { formatStatus, formatCurrency } from "../../../utils/formatters";

/* ── Priority dot color ───────────────────────────────────── */
function priorityDotColor(p: string): string {
  switch (p) {
    case "low":
      return "var(--pd-priority-low)";
    case "medium":
      return "var(--pd-priority-medium)";
    case "high":
    case "urgent":
      return "var(--pd-priority-high)";
    default:
      return "var(--pd-text-muted)";
  }
}

function priorityLabel(p: string): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

/* ── Status color ─────────────────────────────────────────── */
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

/* ── Initials Avatar ──────────────────────────────────────── */
function InitialsAvatar({
  name,
  size = 36,
  offset = 0,
}: {
  name: string;
  size?: number;
  offset?: number;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    "#4F7FFF",
    "#22C55E",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
  ];
  const bg = colors[name.length % colors.length];

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: bg,
        color: "#fff",
        fontFamily: "var(--font-data)",
        fontSize: size * 0.38,
        fontWeight: 600,
        marginLeft: offset ? -8 : 0,
        zIndex: 10 - offset,
        boxShadow: `0 0 0 2px var(--pd-surface)`,
      }}
      title={name}
    >
      {initials}
    </div>
  );
}

/* ── Info Row ─────────────────────────────────────────────── */
function InfoRow({
  icon: Icon,
  label,
  children,
  isLast = false,
}: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div
      className="flex min-h-[40px] items-center gap-2.5"
      style={{
        borderBottom: isLast ? "none" : "1px solid var(--pd-divider)",
      }}
    >
      <span className="shrink-0" style={{ color: "var(--pd-text-muted)" }}><Icon size={14} /></span>
      <span
        className="flex-1"
        style={{
          fontFamily: "var(--font-data)",
          fontSize: 12,
          color: "var(--pd-text-muted)",
        }}
      >
        {label}
      </span>
      <div
        className="text-right"
        style={{
          fontFamily: "var(--font-data)",
          fontSize: 13,
          color: "var(--pd-text-primary)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Action Button ────────────────────────────────────────── */
function ActionBtn({
  icon: Icon,
  label,
  variant = "neutral",
  onClick,
}: {
  icon: React.ComponentType<{ size: number }>;
  label: string;
  variant?: "blue" | "neutral" | "danger";
  onClick: () => void;
}) {
  const baseColor =
    variant === "danger"
      ? "var(--pd-status-overdue)"
      : variant === "blue"
        ? "var(--pd-accent)"
        : "var(--pd-text-secondary)";

  const hoverBg =
    variant === "danger"
      ? "rgba(239,68,68,0.08)"
      : "var(--pd-accent-subtle)";

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 transition-colors"
      style={{
        color: baseColor,
        fontFamily: "var(--font-data)",
        fontSize: 13,
        height: 36,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = hoverBg;
        if (variant !== "danger") e.currentTarget.style.color = "var(--pd-text-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = baseColor;
      }}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

/* ── Section Header ───────────────────────────────────────── */
function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span
        style={{
          fontFamily: "var(--font-data)",
          fontSize: 12,
          textTransform: "uppercase" as const,
          letterSpacing: "0.05em",
          color: "var(--pd-text-muted)",
        }}
      >
        {title}
      </span>
      {action}
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */
interface ProjectRightPanelProps {
  project: Project;
  members: ProjectMember[];
  onCreateInvoice: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onAddMember: () => void;
}

export function ProjectRightPanel({
  project,
  members,
  onCreateInvoice,
  onDuplicate,
  onExport,
  onArchive,
  onDelete,
  onEdit,
  onAddMember,
}: ProjectRightPanelProps) {
  const clientName = useMemo(
    () => project.client?.company_name || project.client?.contact_name || "Unassigned",
    [project.client],
  );

  const deadline = useMemo(() => {
    if (!project.deadline) return "No deadline";
    const d = new Date(project.deadline);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [project.deadline]);

  const isOverdue = useMemo(() => {
    if (!project.deadline) return false;
    return new Date(project.deadline) < new Date();
  }, [project.deadline]);

  const created = useMemo(() => {
    const d = new Date(project.created_at);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [project.created_at]);

  return (
    <aside
      className="pd-scroll pd-animate-fade-up shrink-0"
      style={{
        width: 300,
        position: "sticky",
        top: 80,
        alignSelf: "flex-start",
        animationDelay: "100ms",
      }}
    >
      <div className="pd-card p-4">
        {/* Project Info Header */}
        <div className="flex items-center justify-between pb-1">
          <SectionHeader title="Project Info" />
          <button
            onClick={onEdit}
            className="transition-colors"
            style={{
              fontFamily: "var(--font-data)",
              fontSize: 12,
              color: "var(--pd-accent)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            Edit
          </button>
        </div>

        {/* Info Rows */}
        <div>
          <InfoRow icon={User2} label="Client">
            <span className="flex items-center gap-1.5">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: "var(--pd-accent-subtle)",
                  color: "var(--pd-accent)",
                  fontFamily: "var(--font-data)",
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                {clientName.charAt(0).toUpperCase()}
              </span>
              {clientName}
            </span>
          </InfoRow>

          <InfoRow icon={BarChart3} label="Status">
            <button
              className="flex items-center gap-1.5 rounded-full px-2 py-0.5"
              style={{
                background: statusBg(project.status),
                color: statusColor(project.status),
                fontSize: 12,
              }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: statusColor(project.status) }}
              />
              {formatStatus(project.status)}
            </button>
          </InfoRow>

          <InfoRow icon={Flag} label="Priority">
            <span className="flex items-center gap-1.5">
              <span
                className={`inline-block h-2 w-2 rounded-full ${project.priority === "urgent" ? "pd-pulse-critical" : ""}`}
                style={{ background: priorityDotColor(project.priority) }}
              />
              <span style={{ color: "var(--pd-text-primary)" }}>
                {priorityLabel(project.priority)}
              </span>
            </span>
          </InfoRow>

          <InfoRow icon={Calendar} label="Deadline">
            <span style={{ color: isOverdue ? "var(--pd-status-overdue)" : "var(--pd-text-primary)" }}>
              {deadline}
            </span>
          </InfoRow>

          <InfoRow icon={DollarSign} label="Budget">
            {formatCurrency(project.budget)}
          </InfoRow>

          {project.tags && project.tags.length > 0 && (
            <InfoRow icon={Tag} label="Tags">
              <div className="flex flex-wrap gap-1">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md px-1.5 py-0.5"
                    style={{
                      background: "var(--pd-accent-subtle)",
                      color: "var(--pd-accent)",
                      fontSize: 11,
                      fontFamily: "var(--font-data)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </InfoRow>
          )}

          <InfoRow icon={CalendarPlus} label="Created" isLast>
            {created}
          </InfoRow>
        </div>

        {/* Divider */}
        <div className="my-3" style={{ height: 1, background: "var(--pd-divider)" }} />

        {/* Quick Actions */}
        <SectionHeader title="Actions" />
        <div className="flex flex-col gap-0.5">
          <ActionBtn icon={FileText} label="Create Invoice" variant="blue" onClick={onCreateInvoice} />
          <ActionBtn icon={Copy} label="Duplicate Project" onClick={onDuplicate} />
          <ActionBtn icon={Download} label="Export Report" onClick={onExport} />
          <ActionBtn icon={Archive} label="Archive" onClick={onArchive} />
          <ActionBtn icon={Trash2} label="Delete Project" variant="danger" onClick={onDelete} />
        </div>

        {/* Divider */}
        <div className="my-3" style={{ height: 1, background: "var(--pd-divider)" }} />

        {/* Team */}
        <SectionHeader title="Team" />
        {members.length > 0 ? (
          <div className="flex items-center">
            {members.slice(0, 4).map((m, i) => (
              <InitialsAvatar
                key={m.user_id}
                name={m.user?.name || "?"}
                offset={i}
              />
            ))}
            {/* Add button */}
            <button
              onClick={onAddMember}
              className="flex items-center justify-center rounded-full transition-colors"
              style={{
                width: 36,
                height: 36,
                marginLeft: -8,
                border: "2px dashed var(--pd-border)",
                color: "var(--pd-text-muted)",
                zIndex: 5,
                background: "var(--pd-surface)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--pd-accent)";
                e.currentTarget.style.color = "var(--pd-accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--pd-border)";
                e.currentTarget.style.color = "var(--pd-text-muted)";
              }}
              title="Add team member"
            >
              <Plus size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={onAddMember}
            className="transition-colors"
            style={{
              fontFamily: "var(--font-data)",
              fontSize: 13,
              color: "var(--pd-accent)",
            }}
          >
            + Assign team members
          </button>
        )}
      </div>
    </aside>
  );
}
