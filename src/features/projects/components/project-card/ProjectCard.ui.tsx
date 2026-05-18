"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  DollarSign,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STATUS_CONFIG,
  STATUS_PROGRESS,
  type ProjectStatus,
} from "./ProjectCard.constants";
import type { getProjectCardViewModel } from "./ProjectCard.logic";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";

type ProjectCardViewModel = ReturnType<typeof getProjectCardViewModel>;

type ProjectCardUIProps = {
  vm: ProjectCardViewModel;
  viewMode: "grid" | "list";
};

/* ─── Avatar Gradient by initial ────────────────────────────────────── */

function getAvatarGradient(initial: string): string {
  const code = initial.toUpperCase().charCodeAt(0);
  if (code <= 69) return "linear-gradient(135deg, #3B6FEF, #6B8FFF)";
  if (code <= 74) return "linear-gradient(135deg, #0D9488, #2DD4BF)";
  if (code <= 79) return "linear-gradient(135deg, #7C3AED, #A78BFA)";
  if (code <= 84) return "linear-gradient(135deg, #E11D48, #FB7185)";
  return "linear-gradient(135deg, #D97706, #FCD34D)";
}

/* ─── Budget formatter ──────────────────────────────────────────────── */

function formatBudgetShort(raw: string | null | undefined): string {
  if (!raw) return "";
  const num = parseFloat(raw.replace(/[$,]/g, ""));
  if (isNaN(num)) return raw;
  if (num >= 1000) return `$${Math.round(num / 1000)}K`;
  return `$${num}`;
}

/* ─── Grid View ─────────────────────────────────────────────────────── */

function GridProjectCard({ vm }: { vm: ProjectCardViewModel }) {
  const router = useRouter();
  const statusCfg = STATUS_CONFIG[vm.project.status];
  const progress = STATUS_PROGRESS[vm.project.status];
  const isOverdue = vm.project.isOverdue;
  const lineColor = isOverdue ? "#EF4444" : statusCfg.lineColor;
  const initial = vm.clientInitials?.[0] || "?";

  const handleMouseEnter = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      router.prefetch(`/projects/${vm.project.id}`);
    }
  };

  return (
    <Link
      href={`/projects/${vm.project.id}`}
      onMouseEnter={handleMouseEnter}
      className="group focus-visible:ring-[#4F7FFF] block h-full max-w-[400px] rounded-[14px] outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-[14px] border transition-all duration-180 ease-out",
          "border-[#EBEBF0] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.07)]",
          "dark:border-[rgba(255,255,255,0.06)] dark:bg-[#111118] dark:shadow-none",
          "hover:-translate-y-[2px] hover:border-[rgba(79,127,255,0.35)]",
          "hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
          "dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]",
        )}
      >
        {/* 3px left-edge status line */}
        <div
          className="absolute top-0 left-0 h-full w-[3px]"
          style={{ backgroundColor: lineColor }}
        />

        {/* ── SECTION A: Card Header ──────────────────────────── */}
        <div className="px-5 pt-[18px]">
          {/* Row 1: Client + Menu */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: getAvatarGradient(initial) }}
              >
                {vm.clientInitials}
              </div>
              <span className="font-(--font-data) truncate text-[12px] text-[#6B6B7E]">
                {vm.clientName}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => e.preventDefault()}
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-150",
                "bg-[rgba(0,0,0,0.04)] text-[#6B6B7E]",
                "hover:bg-[rgba(0,0,0,0.08)] hover:text-[#0D0D14]",
                "dark:bg-[rgba(255,255,255,0.05)]",
                "dark:hover:bg-[rgba(255,255,255,0.10)] dark:hover:text-[#F2F2F5]",
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          {/* Row 2: Project name + Status */}
          <div className="mb-1 flex items-start justify-between gap-3">
            <h3 className="font-(--font-display) min-w-0 flex-1 truncate text-[17px] font-semibold leading-tight tracking-[-0.01em] text-[#0D0D14] dark:text-[#F2F2F5]">
              {vm.project.name}
            </h3>
            <StatusBadge
              status={vm.project.status}
              isOverdue={isOverdue}
              className="shrink-0"
            />
          </div>
        </div>

        {/* ── SECTION B: Description ──────────────────────────── */}
        {vm.project.description && (
          <div className="px-5 pt-2.5 pb-0">
            <p className="font-(--font-data) line-clamp-2 text-[13px] leading-relaxed text-[#6B6B7E]">
              {vm.project.description}
            </p>
          </div>
        )}

        {/* ── SECTION C: Tags ─────────────────────────────────── */}
        {vm.project.tags && vm.project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-5 pt-3 pb-3.5">
            {vm.project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md border border-[rgba(79,127,255,0.20)] bg-[rgba(79,127,255,0.08)] px-2 py-0.5 font-(--font-data) text-[11px] text-[#4F7FFF]"
              >
                {tag}
              </span>
            ))}
            {vm.project.tags.length > 3 && (
              <span className="font-(--font-data) inline-flex items-center px-1 text-[11px] text-[#6B6B7E]">
                +{vm.project.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* ── SECTION D: Progress ─────────────────────────────── */}
        {progress > 0 && (
          <div className="px-5 pb-3.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-(--font-data) text-[10px] tracking-[0.08em] text-[#6B6B7E] uppercase">
                Progress
              </span>
              <span className="font-(--font-data) text-[12px] text-[#6B6B7E]">
                {progress}%
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-[2px] bg-[#EBEBF0] dark:bg-[rgba(255,255,255,0.06)]">
              <div
                className="h-full rounded-[2px] transition-[width] duration-800 ease-out"
                style={{
                  width: `${progress}%`,
                  backgroundColor:
                    isOverdue
                      ? "#EF4444"
                      : vm.project.status === "completed"
                        ? "#22C55E"
                        : "#4F7FFF",
                }}
              />
            </div>
          </div>
        )}

        {/* Spacer for flex alignment */}
        <div className="flex-1" />

        {/* ── SECTION E: Divider ──────────────────────────────── */}
        <div className="h-px w-full bg-[#F0F0F5] dark:bg-[rgba(255,255,255,0.04)]" />

        {/* ── SECTION F: Footer ───────────────────────────────── */}
        <div className="bg-[#FAFAFA] px-5 py-3 dark:bg-[rgba(255,255,255,0.02)]">
          <div className="flex items-center justify-between">
            {/* Left: Priority · Date */}
            <div className="flex items-center gap-1.5 min-w-0">
              <PriorityBadge priority={vm.project.priority} />

              <span className="text-[#9B9BA8] text-[10px]">·</span>

              <div className="flex items-center gap-1 min-w-0">
                <Calendar
                  className={cn(
                    "h-3 w-3 shrink-0",
                    isOverdue ? "text-[#EF4444]" : "text-[#6B6B7E]",
                  )}
                />
                <span
                  className={cn(
                    "font-(--font-data) truncate text-[12px]",
                    isOverdue
                      ? "font-medium text-[#EF4444]"
                      : "text-[#6B6B7E]",
                  )}
                >
                  {isOverdue
                    ? `${vm.timelineLabel} — overdue`
                    : vm.timelineLabel}
                </span>
              </div>
            </div>

            {/* Right: Budget */}
            {vm.budgetFormatted && (
              <div className="flex items-center gap-1 shrink-0 font-(--font-data) text-[12px] text-[#6B6B7E]">
                <DollarSign className="h-3 w-3" />
                <span className="font-(--font-metrics)">
                  {formatBudgetShort(vm.budgetFormatted)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION G: Quick Actions (hover) ────────────────── */}
        <div
          className={cn(
            "absolute right-0 bottom-0 left-0 z-20",
            "translate-y-[4px] opacity-0 transition-all duration-150",
            "group-hover:translate-y-0 group-hover:opacity-100",
          )}
        >
          <div className="h-px w-full bg-[#F0F0F5] dark:bg-[rgba(255,255,255,0.04)]" />
          <div className="flex items-center bg-[#FAFAFA] dark:bg-[#16161F]">
            {[
              { icon: Pencil, label: "Edit", isAccent: false },
              { icon: FileText, label: "Invoice", isAccent: false },
              { icon: Eye, label: "View", isAccent: true },
            ].map((action, i) => (
              <div key={action.label} className="flex flex-1 items-center">
                {i > 0 && (
                  <div className="h-4 w-px bg-[#EBEBF0] dark:bg-[rgba(255,255,255,0.06)]" />
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className={cn(
                    "flex w-full items-center justify-center gap-1.5 py-2.5",
                    "font-(--font-data) text-[11px] tracking-[0.06em] uppercase",
                    "transition-colors duration-150",
                    action.isAccent
                      ? "text-[#4F7FFF] hover:text-[#3B6FEF]"
                      : "text-[#6B6B7E] hover:text-[#0D0D14] dark:hover:text-[#F2F2F5]",
                    "[&:hover_svg]:text-[#4F7FFF]",
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

/* ─── List View ─────────────────────────────────────────────────────── */

function ListProjectCard({ vm }: { vm: ProjectCardViewModel }) {
  const router = useRouter();
  const statusCfg = STATUS_CONFIG[vm.project.status];
  const progress = STATUS_PROGRESS[vm.project.status];
  const isOverdue = vm.project.isOverdue;
  const initial = vm.clientInitials?.[0] || "?";

  const handleMouseEnter = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      router.prefetch(`/projects/${vm.project.id}`);
    }
  };

  return (
    <Link
      href={`/projects/${vm.project.id}`}
      onMouseEnter={handleMouseEnter}
      className="group focus-visible:ring-[#4F7FFF] block rounded-xl outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <div
        className={cn(
          "relative flex items-center gap-4 rounded-xl border px-5 py-3 transition-all duration-180 ease-out md:gap-6",
          "border-[#EBEBF0] bg-white",
          "dark:border-[rgba(255,255,255,0.06)] dark:bg-[#111118]",
          "hover:bg-[rgba(79,127,255,0.02)] dark:hover:bg-[rgba(79,127,255,0.04)]",
        )}
      >
        {/* Status dot */}
        <div
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: isOverdue ? "#EF4444" : statusCfg.hex }}
        />

        {/* Project name + tags */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <h3 className="font-(--font-display) truncate text-[15px] font-medium text-[#0D0D14] dark:text-[#F2F2F5]">
            {vm.project.name}
          </h3>
          {vm.project.tags && vm.project.tags.length > 0 && (
            <div className="flex gap-1.5">
              {vm.project.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="font-(--font-data) text-[11px] text-[#6B6B7E]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Client */}
        <div className="hidden min-w-[120px] items-center gap-2 lg:flex">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
            style={{ background: getAvatarGradient(initial) }}
          >
            {vm.clientInitials}
          </div>
          <span className="font-(--font-data) truncate text-[13px] text-[#6B6B7E]">
            {vm.clientName}
          </span>
        </div>

        {/* Status badge */}
        <div className="hidden shrink-0 lg:block">
          <StatusBadge status={vm.project.status} isOverdue={isOverdue} />
        </div>

        {/* Priority */}
        <div className="hidden shrink-0 xl:block">
          <PriorityBadge priority={vm.project.priority} />
        </div>

        {/* Deadline */}
        <div className="hidden min-w-[100px] shrink-0 xl:block">
          <span
            className={cn(
              "font-(--font-data) text-[13px]",
              isOverdue ? "font-medium text-[#EF4444]" : "text-[#6B6B7E]",
            )}
          >
            {vm.timelineLabel}
          </span>
          {isOverdue && (
            <span className="font-(--font-data) block text-[11px] text-[#EF4444]">
              overdue
            </span>
          )}
        </div>

        {/* Budget */}
        {vm.budgetFormatted && (
          <div className="hidden min-w-[80px] shrink-0 text-right xl:block">
            <span className="font-(--font-metrics) text-[13px] text-[#6B6B7E]">
              {formatBudgetShort(vm.budgetFormatted)}
            </span>
          </div>
        )}

        {/* Progress */}
        <div className="hidden min-w-[80px] shrink-0 items-center gap-2 xl:flex">
          <div className="h-1 w-[60px] overflow-hidden rounded-[2px] bg-[#EBEBF0] dark:bg-[rgba(255,255,255,0.06)]">
            <div
              className="h-full rounded-[2px]"
              style={{
                width: `${progress}%`,
                backgroundColor: isOverdue ? "#EF4444" : statusCfg.hex,
              }}
            />
          </div>
          <span className="font-(--font-data) text-[11px] text-[#6B6B7E]">
            {progress}%
          </span>
        </div>

        {/* View button */}
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1",
            "font-(--font-data) text-[11px] tracking-[0.04em] uppercase",
            "border-[rgba(79,127,255,0.25)] text-[#4F7FFF]",
            "opacity-0 transition-opacity duration-150 group-hover:opacity-100",
            "hover:bg-[rgba(79,127,255,0.08)]",
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
