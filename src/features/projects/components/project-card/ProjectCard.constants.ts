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

type StatusVisual = {
  color: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  icon: LucideIcon;
  ring: string;
  glow: string;
};

type PriorityVisual = {
  dot: string;
  badge: string;
};

export const STATUS_CONFIG: Record<ProjectStatus, StatusVisual> = {
  not_started: {
    color: "from-slate-500 to-slate-700",
    bg: "bg-slate-500/10",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-500/25",
    dot: "bg-slate-500",
    icon: Circle,
    ring: "hover:ring-slate-500/40",
    glow: "from-slate-500/12 via-slate-400/0",
  },
  in_progress: {
    color: "from-sky-500 to-indigo-500",
    bg: "bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-500/25",
    dot: "bg-sky-500",
    icon: RotateCcw,
    ring: "hover:ring-sky-500/40",
    glow: "from-sky-500/16 via-indigo-400/0",
  },
  review: {
    color: "from-amber-400 to-orange-500",
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/25",
    dot: "bg-amber-500",
    icon: Clock,
    ring: "hover:ring-amber-500/40",
    glow: "from-amber-500/16 via-orange-400/0",
  },
  completed: {
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/25",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
    ring: "hover:ring-emerald-500/40",
    glow: "from-emerald-500/16 via-teal-400/0",
  },
  on_hold: {
    color: "from-orange-500 to-red-500",
    bg: "bg-orange-500/10",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-500/25",
    dot: "bg-orange-500",
    icon: PauseCircle,
    ring: "hover:ring-orange-500/40",
    glow: "from-orange-500/16 via-red-400/0",
  },
  archived: {
    color: "from-zinc-500 to-zinc-700",
    bg: "bg-zinc-500/10",
    text: "text-zinc-700 dark:text-zinc-300",
    border: "border-zinc-500/25",
    dot: "bg-zinc-500",
    icon: Archive,
    ring: "hover:ring-zinc-500/40",
    glow: "from-zinc-500/12 via-zinc-400/0",
  },
};

export const PRIORITY_CONFIG: Record<ProjectPriority, PriorityVisual> = {
  low: {
    dot: "bg-slate-400",
    badge:
      "text-slate-700 bg-slate-500/10 border-slate-500/25 dark:text-slate-300",
  },
  medium: {
    dot: "bg-blue-500",
    badge: "text-blue-700 bg-blue-500/10 border-blue-500/25 dark:text-blue-300",
  },
  high: {
    dot: "bg-orange-500",
    badge:
      "text-orange-700 bg-orange-500/10 border-orange-500/25 dark:text-orange-300",
  },
  urgent: {
    dot: "bg-red-500",
    badge: "text-red-700 bg-red-500/10 border-red-500/25 dark:text-red-300",
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
