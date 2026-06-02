"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Eye, FileText, MoreHorizontal, Pencil, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STATUS_CONFIG,
  STATUS_PROGRESS,
  PRIORITY_CONFIG,
  type ProjectStatus,
} from "./ProjectCard.constants";
import type { getProjectCardViewModel } from "./ProjectCard.logic";
import { StatusBadge } from "./StatusBadge";
import { useState } from "react";

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

/* ─── Client initial gradient ───────────────────────────────────────── */

function getClientGradient(name: string): string {
  const colors = [
    ["#6C63FF", "#9B59B6"],
    ["#00F5D4", "#00B4D8"],
    ["#F59E0B", "#EF4444"],
    ["#34D399", "#06B6D4"],
    ["#FF4D6D", "#C0392B"],
    ["#6366F1", "#8B5CF6"],
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return `linear-gradient(135deg, ${colors[idx]![0]}, ${colors[idx]![1]})`;
}

/* ─── Status accent color ───────────────────────────────────────────── */

function getStatusAccent(status: string, isOverdue: boolean): string {
  if (isOverdue) return "#FF4D6D";
  switch (status) {
    case "completed": return "#34D399";
    case "in_progress": return "#6C63FF";
    case "review": return "#00F5D4";
    case "on_hold": return "#F59E0B";
    default: return "rgba(255,255,255,0.2)";
  }
}

/* ─── Grid View ────────────────────────────────────────────────────── */

function GridProjectCard({ vm }: { vm: ProjectCardViewModel }) {
  const router = useRouter();
  const progress = STATUS_PROGRESS[vm.project.status];
  const priorityCfg = PRIORITY_CONFIG[vm.project.priority];
  const isOverdue = vm.project.isOverdue;
  const accentColor = getStatusAccent(vm.project.status, isOverdue);
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = () => {
    setHovered(true);
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      router.prefetch(`/projects/${vm.project.id}`);
    }
  };

  return (
    <Link
      href={`/projects/${vm.project.id}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "group block h-full rounded-2xl outline-hidden bg-white dark:bg-transparent",
        "focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus-visible:ring-offset-2",
        "focus-visible:ring-offset-[#08090D]",
      )}
    >
      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 ease-out",
          hovered ? "dark:bg-white/[0.06] bg-black/[0.02]" : "dark:bg-white/[0.03] bg-white",
          !hovered && "shadow-sm border border-black/5 dark:shadow-none dark:border-white/[0.07]"
        )}
        style={{
          border: hovered ? `1px solid ${accentColor}40` : undefined,
          boxShadow: hovered
            ? `0 0 0 1px ${accentColor}15, 0 20px 60px rgba(0,0,0,0.5), 0 8px 24px ${accentColor}15`
            : undefined,
          transform: hovered ? "translateY(-6px)" : "translateY(0)",
        }}
      >
        {/* Top status accent bar */}
        <div
          className="h-[2px] w-full flex-shrink-0 transition-all duration-300"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accentColor} 40%, ${accentColor} 60%, transparent 100%)`,
            opacity: hovered ? 1 : 0.6,
          }}
        />

        {/* Ambient glow orb */}
        <div
          className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl transition-opacity duration-500"
          style={{
            background: accentColor,
            opacity: hovered ? 0.12 : 0.05,
          }}
        />

        <div className="flex flex-1 flex-col p-5">
          {/* ── ROW 1: Client + Menu ─────────────────────────────── */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-2.5">
              {/* Client avatar — gradient initials */}
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md"
                style={{ background: getClientGradient(vm.clientName) }}
              >
                {vm.clientInitials}
              </div>
              <span
                className="truncate text-[10px] tracking-[0.08em] uppercase text-gray-500 dark:text-[#F4F4FF]/45"
                style={{
                  fontFamily: "var(--font-data, monospace)",
                }}
              >
                {vm.clientName}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => e.preventDefault()}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200 text-gray-400 dark:text-[#F4F4FF]/30 hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-[#F4F4FF]"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          {/* ── ROW 2: Project Name + Status Pill ────────────────── */}
          <div className="mb-4 flex items-start justify-between gap-3">
            <h3
              className="min-w-0 flex-1 text-lg font-semibold leading-tight text-gray-900 dark:text-[#F4F4FF]"
            >
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
                <span
                  className="text-[10px] tracking-[0.08em] uppercase text-gray-500 dark:text-white/35"
                  style={{
                    fontFamily: "var(--font-data, monospace)",
                  }}
                >
                  Progress
                </span>
                <span
                  className="text-[13px] font-bold tabular-nums"
                  style={{
                    color: accentColor,
                    fontFamily: "var(--font-metrics, 'Barlow Condensed', sans-serif)",
                  }}
                >
                  {progress}%
                </span>
              </div>
              {/* Precision progress bar */}
              <div
                className="h-[3px] w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/[0.07]"
              >
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-out"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${accentColor}80, ${accentColor})`,
                    boxShadow: hovered ? `0 0 6px ${accentColor}80` : "none",
                    transition: "width 700ms ease-out, box-shadow 300ms ease",
                  }}
                />
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* ── ROW 4: Footer metadata ─────────────────────────── */}
          <div
            className="border-t border-black/10 dark:border-white/[0.06] pt-4"
          >
            <div className="grid grid-cols-3 gap-2">
              {/* Priority */}
              <div className="flex min-w-0 items-center gap-1.5">
                <span
                  className={cn(
                    "h-[5px] w-[5px] shrink-0 rounded-full",
                    vm.project.priority === "urgent" && "animate-pulse",
                  )}
                  style={{ backgroundColor: priorityCfg.hex ?? accentColor }}
                />
                <span
                  className="truncate text-[10px] tracking-[0.08em] uppercase text-gray-500 dark:text-white/40"
                  style={{
                    fontFamily: "var(--font-data, monospace)",
                  }}
                >
                  {vm.priorityLabel}
                </span>
              </div>

              {/* Due Date */}
              <div className="flex min-w-0 items-center justify-center gap-1">
                <Calendar
                  className={cn("h-3 w-3 shrink-0", isOverdue ? "text-[#FF4D6D]" : "text-gray-400 dark:text-white/30")}
                />
                <span
                  className={cn("truncate text-[10px] tracking-[0.08em] uppercase", isOverdue ? "text-[#FF4D6D]" : "text-gray-500 dark:text-white/40")}
                  style={{
                    fontFamily: "var(--font-data, monospace)",
                  }}
                >
                  {isOverdue ? "Overdue" : vm.timelineLabel}
                </span>
              </div>

              {/* Budget */}
              <div className="flex min-w-0 items-center justify-end">
                {vm.budgetFormatted ? (
                  <span
                    className="text-[13px] font-bold tabular-nums text-gray-900 dark:text-[#F4F4FF]"
                    style={{
                      fontFamily: "var(--font-metrics, 'Barlow Condensed', sans-serif)",
                    }}
                  >
                    {formatBudgetShort(vm.budgetFormatted)}
                  </span>
                ) : (
                  <span
                    className="text-[10px] text-gray-400 dark:text-white/20"
                  >
                    —
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Hover Action Tray ─────────────────────────────────── */}
        <div
          className={cn(
            "absolute right-0 bottom-0 left-0 z-20",
            "translate-y-[8px] opacity-0 transition-all duration-250",
            "group-hover:translate-y-0 group-hover:opacity-100",
          )}
        >
          <div
            className="flex items-center border-t border-black/5 dark:border-white/[0.08] bg-white/95 dark:bg-black/90"
            style={{
              backdropFilter: "blur(12px)",
            }}
          >
            {[
              { icon: Pencil, label: "Edit", accent: false },
              { icon: FileText, label: "Invoice", accent: false },
              { icon: Eye, label: "View", accent: true },
            ].map((action, i) => (
              <div key={action.label} className="flex flex-1 items-center">
                {i > 0 && (
                  <div
                    className="h-4 w-px bg-black/10 dark:bg-white/[0.07]"
                  />
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="flex w-full items-center justify-center gap-1.5 py-2.5 text-[10px] tracking-[0.08em] uppercase transition-colors duration-150 text-gray-500 hover:text-gray-900 hover:bg-black/5 dark:text-white/45 dark:hover:text-[#F4F4FF] dark:hover:bg-white/[0.04]"
                  style={{
                    fontFamily: "var(--font-data, monospace)",
                    color: action.accent ? accentColor : undefined,
                  }}
                >
                  <action.icon className="h-3.5 w-3.5" />
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

/* ─── List View ────────────────────────────────────────────────────── */

function ListProjectCard({ vm }: { vm: ProjectCardViewModel }) {
  const router = useRouter();
  const progress = STATUS_PROGRESS[vm.project.status];
  const priorityCfg = PRIORITY_CONFIG[vm.project.priority];
  const isOverdue = vm.project.isOverdue;
  const accentColor = getStatusAccent(vm.project.status, isOverdue);
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = () => {
    setHovered(true);
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      router.prefetch(`/projects/${vm.project.id}`);
    }
  };

  return (
    <Link
      href={`/projects/${vm.project.id}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "group block rounded-xl outline-hidden bg-white dark:bg-transparent",
        "focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus-visible:ring-offset-2",
        "focus-visible:ring-offset-[#08090D]",
      )}
    >
      <div
        className={cn(
          "relative flex items-center gap-4 overflow-hidden rounded-xl px-5 py-3 transition-all duration-300 ease-out md:gap-6",
          hovered ? "dark:bg-white/[0.055] bg-black/[0.02]" : "dark:bg-white/[0.025] bg-white",
          !hovered && "shadow-sm border border-black/5 dark:shadow-none dark:border-white/[0.07]"
        )}
        style={{
          border: hovered ? `1px solid ${accentColor}35` : undefined,
          boxShadow: hovered
            ? `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${accentColor}10`
            : undefined,
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
        }}
      >
        {/* Left accent line */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl transition-opacity duration-300"
          style={{
            background: accentColor,
            opacity: hovered ? 1 : 0.4,
          }}
        />

        {/* Status dot */}
        <div
          className="h-[6px] w-[6px] shrink-0 rounded-full ml-1"
          style={{ backgroundColor: accentColor }}
        />

        {/* Project name */}
        <div className="min-w-0 flex-1">
          <h3
            className="truncate text-[15px] font-medium transition-colors duration-200"
            style={{ color: hovered ? "#F4F4FF" : "rgba(244,244,255,0.85)" }}
          >
            {vm.project.name}
          </h3>
        </div>

        {/* Client */}
        <div className="hidden min-w-[120px] items-center gap-2 lg:flex">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
            style={{ background: getClientGradient(vm.clientName) }}
          >
            {vm.clientInitials}
          </div>
          <span
            className="truncate text-[10px] tracking-[0.08em] uppercase text-gray-500 dark:text-white/40"
            style={{
              fontFamily: "var(--font-data, monospace)",
            }}
          >
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
            className="h-[5px] w-[5px] shrink-0 rounded-full"
            style={{ backgroundColor: priorityCfg.hex ?? accentColor }}
          />
          <span
            className="text-[10px] tracking-[0.08em] uppercase text-gray-500 dark:text-white/40"
            style={{
              fontFamily: "var(--font-data, monospace)",
            }}
          >
            {vm.priorityLabel}
          </span>
        </div>

        {/* Deadline */}
        <div className="hidden min-w-[100px] shrink-0 xl:block">
          <span
            className={cn("text-[10px] tracking-[0.08em] uppercase", isOverdue ? "text-[#FF4D6D]" : "text-gray-500 dark:text-white/40")}
            style={{
              fontFamily: "var(--font-data, monospace)",
            }}
          >
            {vm.timelineLabel}
          </span>
          {isOverdue && (
            <span
              className="block text-[9px] tracking-[0.08em] uppercase text-[#FF4D6D]"
              style={{ fontFamily: "var(--font-data, monospace)" }}
            >
              overdue
            </span>
          )}
        </div>

        {/* Budget */}
        {vm.budgetFormatted && (
          <div className="hidden min-w-[80px] shrink-0 text-right xl:block">
            <span
              className="text-[14px] font-bold tabular-nums text-gray-900 dark:text-[#F4F4FF]"
              style={{
                fontFamily: "var(--font-metrics, 'Barlow Condensed', sans-serif)",
              }}
            >
              {formatBudgetShort(vm.budgetFormatted)}
            </span>
          </div>
        )}

        {/* Progress mini */}
        <div className="hidden min-w-[80px] shrink-0 items-center gap-2 xl:flex">
          <div
            className="h-[2px] w-[60px] overflow-hidden rounded-full bg-black/5 dark:bg-white/[0.07]"
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${accentColor}60, ${accentColor})`,
              }}
            />
          </div>
          <span
            className="text-[10px] tabular-nums text-gray-500 dark:text-white/40"
            style={{
              fontFamily: "var(--font-data, monospace)",
            }}
          >
            {progress}%
          </span>
        </div>

        {/* View pill */}
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className="shrink-0 rounded-full border px-3 py-1 text-[10px] tracking-[0.08em] uppercase opacity-0 transition-all duration-200 group-hover:opacity-100"
          style={{
            borderColor: accentColor + "40",
            color: accentColor,
            fontFamily: "var(--font-data, monospace)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = accentColor + "15";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
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
