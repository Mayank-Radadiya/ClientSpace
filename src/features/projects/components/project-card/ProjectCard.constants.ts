import {
  AlertTriangle,
  Archive,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  PauseCircle,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";

export type ProjectStatus =
  | "not_started"
  | "in_progress"
  | "review"
  | "completed"
  | "on_hold"
  | "archived";

export type ProjectPriority = "low" | "medium" | "high" | "urgent";

export type ProjectCardData = {
  id: string;
  name: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  deadline: string | null;
  startDate: string | null;
  isOverdue: boolean;
  clientCompanyName: string | null;
  clientEmail: string | null;
  tags: string[] | null;
  description: string | null;
  budget: number | null;
  createdAt: string;
};

/* ─── Obsidian Luxury Status Colors ─────────────────────────────────── */

type StatusVisual = {
  /** Hex color for dots, lines, fills */
  hex: string;
  /** Tailwind bg at 10% opacity */
  bg: string;
  /** Text color */
  text: string;
  /** Border at 25% opacity */
  border: string;
  /** Solid dot bg */
  dot: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Left-edge / top-edge line inline style color */
  lineColor: string;
};

type PriorityVisual = {
  hex: string;
  dot: string;
  text: string;
};

export const STATUS_CONFIG: Record<ProjectStatus, StatusVisual> = {
  not_started: {
    hex: "#6B6B7E",
    bg: "bg-[rgba(107,107,126,0.10)]",
    text: "text-[#6B6B7E]",
    border: "border-[rgba(107,107,126,0.25)]",
    dot: "bg-[#6B6B7E]",
    icon: Circle,
    lineColor: "#6B6B7E",
  },
  in_progress: {
    hex: "#4F7FFF",
    bg: "bg-[rgba(79,127,255,0.10)]",
    text: "text-[#4F7FFF]",
    border: "border-[rgba(79,127,255,0.25)]",
    dot: "bg-[#4F7FFF]",
    icon: RotateCcw,
    lineColor: "#4F7FFF",
  },
  review: {
    hex: "#F59E0B",
    bg: "bg-[rgba(245,158,11,0.10)]",
    text: "text-[#F59E0B]",
    border: "border-[rgba(245,158,11,0.25)]",
    dot: "bg-[#F59E0B]",
    icon: Clock,
    lineColor: "#F59E0B",
  },
  completed: {
    hex: "#22C55E",
    bg: "bg-[rgba(34,197,94,0.10)]",
    text: "text-[#22C55E]",
    border: "border-[rgba(34,197,94,0.25)]",
    dot: "bg-[#22C55E]",
    icon: CheckCircle2,
    lineColor: "#22C55E",
  },
  on_hold: {
    hex: "#F59E0B",
    bg: "bg-[rgba(245,158,11,0.10)]",
    text: "text-[#F59E0B]",
    border: "border-[rgba(245,158,11,0.25)]",
    dot: "bg-[#F59E0B]",
    icon: PauseCircle,
    lineColor: "#F59E0B",
  },
  archived: {
    hex: "#6B6B7E",
    bg: "bg-[rgba(107,107,126,0.10)]",
    text: "text-[#6B6B7E]",
    border: "border-[rgba(107,107,126,0.25)]",
    dot: "bg-[#6B6B7E]",
    icon: Archive,
    lineColor: "#6B6B7E",
  },
};

export const PRIORITY_CONFIG: Record<ProjectPriority, PriorityVisual> = {
  low: {
    hex: "#22C55E",
    dot: "bg-[#22C55E]",
    text: "text-[#22C55E]",
  },
  medium: {
    hex: "#F59E0B",
    dot: "bg-[#F59E0B]",
    text: "text-[#F59E0B]",
  },
  high: {
    hex: "#EF4444",
    dot: "bg-[#EF4444]",
    text: "text-[#EF4444]",
  },
  urgent: {
    hex: "#EF4444",
    dot: "bg-[#EF4444]",
    text: "text-[#EF4444]",
  },
};

export const DEADLINE_ICONS = {
  overdue: AlertTriangle,
  soon: Clock,
  date: Calendar,
} as const;

export const STATUS_PROGRESS: Record<ProjectStatus, number> = {
  not_started: 10,
  in_progress: 55,
  review: 85,
  completed: 100,
  on_hold: 45,
  archived: 100,
};

/* ─── Shared Design Tokens ──────────────────────────────────────────── */

export const OBSIDIAN = {
  cubic: [0.16, 1, 0.3, 1] as [number, number, number, number],
  noise: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
} as const;
