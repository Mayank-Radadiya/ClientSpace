"use client";

import { useMemo, useState, useRef, useEffect, type ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  ChevronLeft,
  Pencil,
  Plus,
  MoreHorizontal,
  Archive,
  Trash2,
  Clock,
  FileDown,
  Sparkles,
  Loader2,
} from "lucide-react";
import { differenceInDays } from "date-fns";
import type { Project } from "../../types";
import { formatStatus } from "../../../utils/formatters";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { UpdateProjectInput } from "@/features/projects/schemas";

/* ── Status helpers ───────────────────────────────────────── */
function statusAccent(s: string): string {
  switch (s) {
    case "in_progress": return "#6C63FF";
    case "review": return "#00F5D4";
    case "completed": return "#34D399";
    case "on_hold": return "#F59E0B";
    default: return "rgba(244,244,255,0.3)";
  }
}

/* ── More Menu ─────────────────────────────────────────────── */
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

  const menuItems = [
    ...(onGenerateReport
      ? [{ icon: FileDown, label: "Generate Report", onClick: () => { onGenerateReport(); onClose(); }, danger: false }]
      : []),
    { icon: Archive, label: "Archive Project", onClick: () => { onArchive(); onClose(); }, danger: false },
    { icon: Trash2, label: "Delete Project", onClick: () => { onDelete(); onClose(); }, danger: true },
  ];

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 z-50 mt-2 w-52 overflow-hidden py-1.5"
      style={{
        background: "rgba(12,13,20,0.96)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 14,
        boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
      }}
    >
      {menuItems.map((item, i) => {
        const Icon = item.icon;
        const hasDivider = i > 0 && item.danger && !menuItems[i - 1]?.danger;
        return (
          <div key={item.label}>
            {hasDivider && (
              <div
                className="my-1.5 mx-3 h-px bg-white/5"
              />
            )}
            <button
              onClick={item.onClick}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors duration-150 text-[13px] font-mono hover:bg-white/5"
              style={{
                color: item.danger ? "#FF4D6D" : "rgba(244,244,255,0.6)",
              }}
            >
              <Icon size={14} />
              {item.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────── */
interface ProjectTopBarProps {
  project: Project;
  onEdit: () => void;
  onAddMilestone: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onGenerateReport?: () => void;
  presenceSlot?: ReactNode;
  // ── Inline edit props ──────────────────────────────────────
  isEditing?: boolean;
  isUpdating?: boolean;
  editForm?: UseFormReturn<UpdateProjectInput>;
  onSave?: React.FormEventHandler<HTMLFormElement>;
  onCancelEdit?: () => void;
  statusOptions?: readonly string[];
  statusLabels?: Record<string, string>;
  priorityOptions?: readonly string[];
  priorityLabels?: Record<string, string>;
}

export function ProjectTopBar({
  project,
  onEdit,
  onAddMilestone,
  onArchive,
  onDelete,
  onGenerateReport,
  presenceSlot,
  isEditing = false,
  isUpdating = false,
  editForm,
  onSave,
  onCancelEdit,
  statusOptions = [],
  statusLabels = {},
  priorityOptions = [],
  priorityLabels = {},
}: ProjectTopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [addHovered, setAddHovered] = useState(false);

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

  const accent = statusAccent(project.status);

  return (
    <div
      className="w-full px-8 pt-6 pb-2 bg-[#08090D]"
    >
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1.5">
        <a
          href="/projects"
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] tracking-[0.06em] uppercase transition-all duration-200 text-gray-500 hover:text-gray-900 hover:bg-black/5 dark:text-white/35 dark:hover:text-white dark:hover:bg-white/5 font-mono"
        >
          <ChevronLeft className="h-3 w-3" />
          Projects
        </a>
        <span className="text-[10px] text-gray-400 dark:text-white/15">›</span>
        <span
          className="text-[11px] tracking-[0.06em] uppercase text-gray-600 dark:text-white/50 font-mono"
        >
          {project.name}
        </span>
      </div>

      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: title + badges (or inline edit form) */}
        <div className="flex flex-col gap-3 min-w-0 flex-1">
          {isEditing && editForm ? (
            <form onSubmit={onSave} className="flex flex-col gap-3">
              {/* Name */}
              <Input
                {...editForm.register("name")}
                autoFocus
                placeholder="Project name"
                className="text-lg font-semibold h-10"
              />
              {editForm.formState.errors.name && (
                <p className="text-xs text-red-400">{editForm.formState.errors.name.message}</p>
              )}

              {/* Description */}
              <Textarea
                {...editForm.register("description")}
                placeholder="Description (optional)"
                rows={2}
                className="resize-none text-sm"
              />

              {/* Status + Priority row */}
              <div className="flex gap-2">
                <Select
                  value={editForm.watch("status") ?? ""}
                  onValueChange={(val) =>
                    editForm.setValue("status", val as UpdateProjectInput["status"])
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusLabels[s] ?? s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={editForm.watch("priority") ?? ""}
                  onValueChange={(val) =>
                    editForm.setValue("priority", val as UpdateProjectInput["priority"])
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((p) => (
                      <SelectItem key={p} value={p}>
                        {priorityLabels[p] ?? p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Budget */}
                <Input
                  {...editForm.register("budget", { valueAsNumber: true })}
                  type="number"
                  min={0}
                  placeholder="Budget"
                  className="h-8 text-xs w-32"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={isUpdating}
                  onClick={onCancelEdit}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              <h1
                className="font-black leading-none tracking-tight text-[clamp(26px,3.5vw,36px)]"
                style={{
                  background: `linear-gradient(135deg, #F4F4FF 40%, ${accent}90 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {project.name}
              </h1>

              {/* Badge row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status pill */}
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] tracking-[0.06em] uppercase font-mono"
                  style={{
                    background: `${accent}15`,
                    border: `1px solid ${accent}30`,
                    color: accent,
                  }}
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full animate-pulse"
                    style={{ background: accent }}
                  />
                  {formatStatus(project.status)}
                </span>

                {/* Client pill */}
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] tracking-[0.06em] uppercase font-mono bg-black/5 border border-black/10 text-gray-600 dark:bg-white/5 dark:border-white/10 dark:text-white/50"
                >
                  <span
                    className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #6C63FF, #00F5D4)" }}
                  >
                    {clientName.charAt(0).toUpperCase()}
                  </span>
                  {clientName}
                </span>

                {/* Overdue badge */}
                {daysOverdue && (
                  <span
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] tracking-[0.06em] uppercase font-mono bg-[#FF4D6D]/10 border border-[#FF4D6D]/25 text-[#FF4D6D]"
                  >
                    <Clock size={10} />
                    {daysOverdue}d overdue
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Center: presence */}
        {presenceSlot && (
          <div className="flex shrink-0 items-center">{presenceSlot}</div>
        )}

        {/* Right: actions — hide Edit button while in edit mode */}
        <div className="relative flex shrink-0 items-center gap-2">
          {/* Edit button — hidden while editing */}
          {!isEditing && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] transition-all duration-200 active:scale-[0.97] border-black/10 text-gray-600 font-mono bg-black/3 hover:border-[#6C63FF]/40 hover:text-[#6C63FF] hover:bg-[#6C63FF]/10 dark:border-white/10 dark:text-white/50 dark:bg-white/3 dark:hover:text-white"
            >
              <Pencil size={13} />
              Edit
            </button>
          )}

          {/* Add Milestone CTA */}
          <button
            onClick={onAddMilestone}
            onMouseEnter={() => setAddHovered(true)}
            onMouseLeave={() => setAddHovered(false)}
            className="relative flex items-center gap-1.5 overflow-hidden rounded-xl px-4 py-2 text-[12px] font-bold text-white transition-all duration-200 active:scale-[0.97]"
            style={{
              background: addHovered
                ? "linear-gradient(135deg, #7C73FF, #6C63FF)"
                : "linear-gradient(135deg, #6C63FF, #5B54EE)",
              boxShadow: addHovered
                ? "0 0 0 1px rgba(108,99,255,0.5), 0 6px 24px rgba(108,99,255,0.4)"
                : "0 0 0 1px rgba(108,99,255,0.3), 0 2px 10px rgba(108,99,255,0.2)",
            }}
          >
            <span
              className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-linear-to-r from-transparent via-white/15 to-transparent transition-transform duration-600"
              style={{ transform: addHovered ? "translateX(200%) skewX(-20deg)" : "translateX(-100%) skewX(-20deg)", transition: "transform 500ms ease" }}
            />
            <Sparkles size={13} />
            Add Milestone
          </button>

          {/* Kebab */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-[36px] w-[36px] items-center justify-center rounded-xl border transition-all duration-200 active:scale-[0.97] border-black/10 text-gray-500 bg-black/3 hover:text-gray-900 hover:bg-black/10 dark:border-white/10 dark:text-white/40 dark:bg-white/3 dark:hover:text-white dark:hover:bg-white/10"
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
