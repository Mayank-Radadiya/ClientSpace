"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import {
  User2,
  BarChart3,
  Flag,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  Archive,
  Trash2,
  AlertTriangle,
  Users,
} from "lucide-react";
import type { Project, ProjectMember, OrgRole } from "../../types";
import { formatStatus, formatCurrency } from "../../../utils/formatters";
import { TeamNotes } from "./TeamNotes";

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

function InfoRow({
  icon: Icon,
  label,
  children,
  isLast = false,
}: {
  icon: React.ComponentType<{ size: number }>;
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2.5"
      style={{
        minHeight: 36,
        borderBottom: isLast ? "none" : "1px solid var(--pd-divider)",
        padding: "8px 0",
      }}
    >
      <span className="shrink-0" style={{ color: "var(--pd-text-muted)" }}>
        <Icon size={16} />
      </span>
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
          fontSize: 12,
          color: "var(--pd-text-primary)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

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
  const styles =
    variant === "danger"
      ? {
          color: "var(--pd-status-overdue)",
          bg: "var(--pd-status-overdue-bg)",
          border: "rgba(224,92,92,0.3)",
        }
      : variant === "blue"
        ? {
            color: "var(--pd-accent)",
            bg: "var(--pd-accent-subtle)",
            border: "rgba(59,111,240,0.3)",
          }
        : {
            color: "var(--pd-text-secondary)",
            bg: "transparent",
            border: "transparent",
          };

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 transition-colors active:scale-[0.98]"
      style={{
        color: styles.color,
        fontFamily: "var(--font-data)",
        fontSize: 13,
        height: 36,
        borderRadius: 10,
        padding: "0 12px",
        background:
          variant === "blue" || variant === "danger"
            ? styles.bg
            : "transparent",
        border:
          variant === "blue" || variant === "danger"
            ? `1px solid ${styles.border}`
            : "1px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (variant === "neutral") {
          e.currentTarget.style.background = "var(--pd-accent-subtle)";
          e.currentTarget.style.color = "var(--pd-text-primary)";
        } else {
          e.currentTarget.style.opacity = "0.85";
        }
      }}
      onMouseLeave={(e) => {
        if (variant === "neutral") {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = styles.color;
        } else {
          e.currentTarget.style.opacity = "1";
        }
      }}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

interface ProjectRightPanelProps {
  project: Project;
  members: ProjectMember[];
  role: OrgRole;
  onCreateInvoice: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onAddMember: () => void;
}

export function ProjectRightPanel({
  project,
  role,
  onCreateInvoice,
  onArchive,
  onDelete,
  onEdit,
  members,
  onAddMember,
}: ProjectRightPanelProps) {
  const clientName = useMemo(
    () =>
      project.client?.company_name ||
      project.client?.contact_name ||
      "Unassigned",
    [project.client],
  );

  const deadline = useMemo(() => {
    if (!project.deadline) return "No deadline";
    return new Date(project.deadline).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [project.deadline]);

  const isOverdue = useMemo(
    () =>
      project.deadline ? new Date(project.deadline) < new Date() : false,
    [project.deadline],
  );

  return (
    <aside
      className="pd-scroll pd-animate-fade-up shrink-0 w-72 sticky top-6 self-start max-h-[calc(100vh-64px)] overflow-y-auto"
      style={{ animationDelay: "100ms" }}
    >
      <div className="flex flex-col gap-4">
        {/* ── Card 1: PROJECT INFO ─────────────────────────── */}
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0C0D14]">
          <div className="flex items-center justify-between pb-3">
            <span
              className="text-[11px] font-semibold tracking-[0.06em] uppercase text-gray-500 dark:text-gray-400"
              style={{ fontFamily: "var(--font-data, monospace)" }}
            >
              PROJECT INFO
            </span>
            <button
              onClick={onEdit}
              className="transition-colors"
              style={{
                fontFamily: "var(--font-data)",
                fontSize: 12,
                color: "var(--pd-accent)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.7";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              Edit
            </button>
          </div>

          <InfoRow icon={User2} label="Client" isLast={!project.tags || project.tags.length === 0}>
            <span className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-white">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white bg-gray-900 dark:bg-white dark:text-gray-900"
              >
                {clientName.charAt(0).toUpperCase()}
              </span>
              {clientName}
            </span>
          </InfoRow>

          {project.tags && project.tags.length > 0 && (
            <InfoRow icon={Tag} label="Tags" isLast>
              <div className="flex flex-wrap gap-1">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md px-1.5 py-0.5 bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300 font-mono text-[11px]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </InfoRow>
          )}
        </div>

        {/* ── Card 2: QUICK ACTIONS ───────────────────────── */}
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0C0D14]">
          <div className="pb-3">
            <span
              className="text-[11px] font-semibold tracking-[0.06em] uppercase text-gray-500 dark:text-gray-400"
              style={{ fontFamily: "var(--font-data, monospace)" }}
            >
              QUICK ACTIONS
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <ActionBtn
              icon={FileText}
              label="+ Create Invoice"
              variant="neutral"
              onClick={onCreateInvoice}
            />
          </div>
        </div>

        {/* ── Card 3: TEAM ────────────────────────────────── */}
        {role !== "client" && (
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0C0D14]">
            <div className="flex items-center justify-between pb-4">
              <span
                className="text-[11px] font-semibold tracking-[0.06em] uppercase text-gray-500 dark:text-gray-400"
                style={{ fontFamily: "var(--font-data, monospace)" }}
              >
                TEAM
              </span>
              <button
                type="button"
                onClick={onAddMember}
                className="flex items-center gap-1 transition-colors"
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: 12,
                  color: "var(--pd-accent)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                aria-label="Add team member"
              >
                <Plus size={12} />
                Add
              </button>
            </div>

            {members.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: 12,
                  color: "var(--pd-text-muted)",
                }}
              >
                No members yet
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {members.map((member) => {
                  const name = member.user?.name ?? member.user?.email ?? "Unknown";
                  const initials = name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  const colors = ["#3B6FF0", "#3DAA72", "#C47F2A", "#E05C5C", "#8B5CF6"];
                  const bg = colors[name.length % colors.length];
                  return (
                    <div
                      key={member.user_id}
                      className="flex items-center gap-2.5"
                    >
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        style={{
                          background: bg,
                          color: "#fff",
                          fontFamily: "var(--font-data)",
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                        title={name}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate"
                          style={{
                            fontFamily: "var(--font-data)",
                            fontSize: 12,
                            color: "var(--pd-text-primary)",
                          }}
                        >
                          {name}
                        </p>
                        {member.role && (
                          <p
                            style={{
                              fontFamily: "var(--font-data)",
                              fontSize: 10,
                              color: "var(--pd-text-muted)",
                              textTransform: "capitalize",
                            }}
                          >
                            {member.role}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Card 4: TEAM NOTES (internal only) ──────────── */}
        {role !== "client" && (
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0C0D14]">
            <div className="pb-3">
              <span
                className="text-[11px] font-semibold tracking-[0.06em] uppercase text-gray-500 dark:text-gray-400"
                style={{ fontFamily: "var(--font-data, monospace)" }}
              >
                TEAM NOTES
              </span>
            </div>
            <TeamNotes projectId={project.id} />
          </div>
        )}

        {/* ── Card 5: DANGER ZONE ─────────────────────────── */}
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
          <div className="pb-2">
            <span
              className="text-[10px] font-medium tracking-widest text-red-600 dark:text-red-400"
            >
              DANGER ZONE
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <button
              onClick={onArchive}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-red-700 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40"
            >
              <Archive size={14} />
              Archive Project
            </button>
            <button
              onClick={onDelete}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-red-700 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40"
            >
              <Trash2 size={14} />
              Delete Project
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
