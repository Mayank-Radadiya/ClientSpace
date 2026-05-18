"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Eye, FileText, MoreHorizontal, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STATUS_CONFIG,
  STATUS_PROGRESS,
  PRIORITY_CONFIG,
  type ProjectStatus,
} from "./ProjectCard.constants";
import type { getProjectCardViewModel } from "./ProjectCard.logic";
import { StatusBadge } from "./StatusBadge";

type ProjectCardViewModel = ReturnType<typeof getProjectCardViewModel>;

type ProjectCardUIProps = {
  vm: ProjectCardViewModel;
  viewMode: "grid" | "list";
};

/* ─── Budget formatter ──────────────────────────────────────────────── */

function formatBudgetShort(raw: string | null | undefined): string {
  if (!raw) return "";
  const num = parseFloat(raw.replace(/[$,]/g, ""));
  if (isNaN(num)) return raw;
  if (num >= 1000) return `$${Math.round(num / 1000)}K`;
  return `$${num}`;
}

/* ─── Grid View (Industrial Antigravity) ────────────────────────────── */

function GridProjectCard({ vm }: { vm: ProjectCardViewModel }) {
  const router = useRouter();
  const statusCfg = STATUS_CONFIG[vm.project.status];
  const progress = STATUS_PROGRESS[vm.project.status];
  const priorityCfg = PRIORITY_CONFIG[vm.project.priority];
  const isOverdue = vm.project.isOverdue;
  const progressColor = isOverdue
    ? "#EF4444"
    : vm.project.status === "completed"
      ? "#34D399"
      : "#0090FF";

  const handleMouseEnter = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      router.prefetch(`/projects/${vm.project.id}`);
    }
  };

  return (
    <Link
      href={`/projects/${vm.project.id}`}
      onMouseEnter={handleMouseEnter}
      className={cn(
        "group block h-full rounded-2xl outline-hidden",
        "focus-visible:ring-2 focus-visible:ring-[#0090FF] focus-visible:ring-offset-2",
        "focus-visible:ring-offset-[#F0F0F5] dark:focus-visible:ring-offset-[#0D0F16]",
      )}
    >
      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-2xl border p-6",
          "transition-all duration-300 ease-out",
          // Light
          "border-[#EBEBF0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]",
          "hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(0,144,255,0.12)]",
          "hover:border-[#0090FF]/30",
          // Dark
          "dark:border-white/5 dark:bg-[#111118]/80 dark:shadow-none dark:backdrop-blur-md",
          "dark:hover:border-[#0090FF]/30",
          "dark:hover:shadow-[0_8px_30px_rgba(0,144,255,0.1)]",
        )}
      >
        {/* ── ROW 1: Client + Menu ─────────────────────────────── */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            {/* Client avatar — Syne initials */}
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                "text-[10px] font-bold",
                "border border-[#EBEBF0] bg-[#F0F0F5] text-[#0D0D14]",
                "dark:border-white/10 dark:bg-white/8 dark:text-gray-50",
              )}
            >
              {vm.clientInitials}
            </div>
            <span className="truncate text-[11px] font-(--font-data) tracking-widest text-[#6B6B7E] uppercase dark:text-gray-400">
              {vm.clientName}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => e.preventDefault()}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-200",
              "text-[#9B9BA8] hover:bg-[rgba(0,0,0,0.04)] hover:text-[#0D0D14]",
              "dark:text-gray-500 dark:hover:bg-white/6 dark:hover:text-gray-50",
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* ── ROW 2: Project Name + Status Pill ────────────────── */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 truncate text-xl leading-tight font-semibold text-[#0D0D14] dark:text-gray-50">
            {vm.project.name}
          </h3>
          <StatusBadge
            status={vm.project.status}
            isOverdue={isOverdue}
            className="shrink-0"
          />
        </div>

        {/* ── ROW 3: Progress ──────────────────────────────────── */}
        {progress > 0 && (
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-(--font-data) tracking-widest text-[#6B6B7E] uppercase dark:text-gray-400">
                Progress
              </span>
              <span className="text-[14px] font-(--font-metrics) tracking-tight text-[#0D0D14] dark:text-gray-50">
                {progress}%
              </span>
            </div>
            {/* 2px precision progress bar */}
            <div className="h-[2px] w-full overflow-hidden rounded-full bg-[#EBEBF0] dark:bg-white/6">
              <div
                className="h-full rounded-full transition-[width] duration-800 ease-out"
                style={{
                  width: `${progress}%`,
                  backgroundColor: progressColor,
                }}
              />
            </div>
          </div>
        )}

        {/* Spacer for flex alignment */}
        <div className="flex-1" />

        {/* ── ROW 4: Footer — Priority · Due · Budget ──────────── */}
        <div className="border-t border-[#EBEBF0] pt-4 dark:border-white/5">
          <div className="grid grid-cols-3 gap-2">
            {/* Priority */}
            <div className="flex min-w-0 items-center gap-1.5">
              <span
                className={cn(
                  "h-[6px] w-[6px] shrink-0 rounded-full",
                  priorityCfg.dot,
                  vm.project.priority === "urgent" && "animate-pulse",
                )}
              />
              <span className="truncate text-[11px] font-(--font-data) tracking-widest text-[#6B6B7E] uppercase dark:text-gray-400">
                {vm.priorityLabel}
              </span>
            </div>

            {/* Due Date */}
            <div className="flex min-w-0 items-center justify-center gap-1">
              <Calendar
                className={cn(
                  "h-3 w-3 shrink-0",
                  isOverdue
                    ? "text-[#EF4444]"
                    : "text-[#9B9BA8] dark:text-gray-500",
                )}
              />
              <span
                className={cn(
                  "truncate text-[11px] font-(--font-data) tracking-widest uppercase",
                  isOverdue
                    ? "text-[#EF4444]"
                    : "text-[#6B6B7E] dark:text-gray-400",
                )}
              >
                {isOverdue ? "Overdue" : vm.timelineLabel}
              </span>
            </div>

            {/* Budget */}
            <div className="flex min-w-0 items-center justify-end">
              {vm.budgetFormatted ? (
                <span className="text-[14px] font-(--font-metrics) tracking-tight text-[#0D0D14] dark:text-gray-50">
                  {formatBudgetShort(vm.budgetFormatted)}
                </span>
              ) : (
                <span className="text-[11px] font-(--font-data) text-[#9B9BA8] dark:text-gray-600">
                  —
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Quick Actions (hover reveal) ─────────────────────── */}
        <div
          className={cn(
            "absolute right-0 bottom-0 left-0 z-20",
            "translate-y-[4px] opacity-0 transition-all duration-200",
            "group-hover:translate-y-0 group-hover:opacity-100",
          )}
        >
          <div className="h-px w-full bg-[#EBEBF0] dark:bg-white/5" />
          <div className="flex items-center bg-[#FAFAFA]/95 backdrop-blur-md dark:bg-[#0D0F16]/95">
            {[
              { icon: Pencil, label: "Edit", isAccent: false },
              { icon: FileText, label: "Invoice", isAccent: false },
              { icon: Eye, label: "View", isAccent: true },
            ].map((action, i) => (
              <div key={action.label} className="flex flex-1 items-center">
                {i > 0 && (
                  <div className="h-4 w-px bg-[#EBEBF0] dark:bg-white/5" />
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className={cn(
                    "flex w-full items-center justify-center gap-1.5 py-2.5",
                    "text-[11px] font-(--font-data) tracking-widest uppercase",
                    "transition-colors duration-200",
                    action.isAccent
                      ? "text-[#0090FF] hover:text-[#006ACC] dark:text-[#00C8FF] dark:hover:text-[#00F7FF]"
                      : cn(
                          "text-[#6B6B7E] hover:text-[#0D0D14]",
                          "dark:text-gray-500 dark:hover:text-gray-50",
                        ),
                  )}
                >
                  <action.icon className="h-3.5 w-3.5 transition-colors" />
                  {action.label}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── List View (Industrial Antigravity) ────────────────────────────── */

function ListProjectCard({ vm }: { vm: ProjectCardViewModel }) {
  const router = useRouter();
  const statusCfg = STATUS_CONFIG[vm.project.status];
  const progress = STATUS_PROGRESS[vm.project.status];
  const priorityCfg = PRIORITY_CONFIG[vm.project.priority];
  const isOverdue = vm.project.isOverdue;

  const handleMouseEnter = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      router.prefetch(`/projects/${vm.project.id}`);
    }
  };

  return (
    <Link
      href={`/projects/${vm.project.id}`}
      onMouseEnter={handleMouseEnter}
      className={cn(
        "group block rounded-xl outline-hidden",
        "focus-visible:ring-2 focus-visible:ring-[#0090FF] focus-visible:ring-offset-2",
        "focus-visible:ring-offset-[#F0F0F5] dark:focus-visible:ring-offset-[#0D0F16]",
      )}
    >
      <div
        className={cn(
          "relative flex items-center gap-4 rounded-xl border px-5 py-3 transition-all duration-300 ease-out md:gap-6",
          // Light
          "border-[#EBEBF0] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
          "hover:border-[rgba(0,144,255,0.3)] hover:bg-[#FAFAFA]",
          // Dark
          "dark:border-white/5 dark:bg-[#111118]/60 dark:shadow-none dark:backdrop-blur-md",
          "dark:hover:border-white/10 dark:hover:bg-white/4",
        )}
      >
        {/* Status dot */}
        <div
          className="h-[6px] w-[6px] shrink-0 rounded-full"
          style={{ backgroundColor: isOverdue ? "#EF4444" : statusCfg.hex }}
        />

        {/* Project name */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-medium text-[#0D0D14] dark:text-gray-50">
            {vm.project.name}
          </h3>
        </div>

        {/* Client */}
        <div className="hidden min-w-[120px] items-center gap-2 lg:flex">
          <div
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
              "text-[8px] font-bold",
              "border border-[#EBEBF0] bg-[#F0F0F5] text-[#0D0D14]",
              "dark:border-white/10 dark:bg-white/8 dark:text-gray-50",
            )}
          >
            {vm.clientInitials}
          </div>
          <span className="truncate text-[11px] font-(--font-data) tracking-widest text-[#6B6B7E] uppercase dark:text-gray-400">
            {vm.clientName}
          </span>
        </div>

        {/* Status badge */}
        <div className="hidden shrink-0 lg:block">
          <StatusBadge status={vm.project.status} isOverdue={isOverdue} />
        </div>

        {/* Priority */}
        <div className="hidden shrink-0 items-center gap-1.5 xl:flex">
          <span
            className={cn(
              "h-[6px] w-[6px] shrink-0 rounded-full",
              priorityCfg.dot,
            )}
          />
          <span className="text-[11px] font-(--font-data) tracking-widest text-[#6B6B7E] uppercase dark:text-gray-400">
            {vm.priorityLabel}
          </span>
        </div>

        {/* Deadline */}
        <div className="hidden min-w-[100px] shrink-0 xl:block">
          <span
            className={cn(
              "text-[11px] font-(--font-data) tracking-widest uppercase",
              isOverdue
                ? "text-[#EF4444]"
                : "text-[#6B6B7E] dark:text-gray-400",
            )}
          >
            {vm.timelineLabel}
          </span>
          {isOverdue && (
            <span className="block text-[10px] font-(--font-data) tracking-widest text-[#EF4444] uppercase">
              overdue
            </span>
          )}
        </div>

        {/* Budget */}
        {vm.budgetFormatted && (
          <div className="hidden min-w-[80px] shrink-0 text-right xl:block">
            <span className="text-[14px] font-(--font-metrics) tracking-tight text-[#0D0D14] dark:text-gray-50">
              {formatBudgetShort(vm.budgetFormatted)}
            </span>
          </div>
        )}

        {/* Progress */}
        <div className="hidden min-w-[80px] shrink-0 items-center gap-2 xl:flex">
          <div className="h-[2px] w-[60px] overflow-hidden rounded-full bg-[#EBEBF0] dark:bg-white/6">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: isOverdue ? "#EF4444" : statusCfg.hex,
              }}
            />
          </div>
          <span className="text-[11px] font-(--font-data) tracking-widest text-[#6B6B7E] dark:text-gray-400">
            {progress}%
          </span>
        </div>

        {/* View button */}
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1",
            "text-[11px] font-(--font-data) tracking-widest uppercase",
            "border-[#0090FF]/20 text-[#0090FF] dark:text-[#00C8FF]",
            "opacity-0 transition-all duration-200 group-hover:opacity-100",
            "hover:border-[#0090FF]/40 hover:bg-[rgba(0,144,255,0.08)]",
          )}
        >
          View
        </button>
      </div>
    </Link>
  );
}

/* ─── Export ─────────────────────────────────────────────────────────── */

export function ProjectCardUI({ vm, viewMode }: ProjectCardUIProps) {
  if (viewMode === "list") {
    return <ListProjectCard vm={vm} />;
  }

  return <GridProjectCard vm={vm} />;
}
