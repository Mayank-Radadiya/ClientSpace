import Link from "next/link";
import { format, isToday, differenceInDays } from "date-fns";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { STATUS_LABELS, PRIORITY_LABELS } from "../schemas";
import { cn } from "@/lib/utils";
import {
  Calendar,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Circle,
  PauseCircle,
  Archive,
  RotateCcw,
} from "lucide-react";

// ─── Status Config ─────────────────────────────────────────────────────────
// Using more muted backgrounds and colored text/icons for a premium look

const STATUS_CONFIG = {
  not_started: {
    color: "from-slate-400 to-slate-500",
    bg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-500/20",
    dot: "bg-slate-500",
    icon: Circle,
  },
  in_progress: {
    color: "from-blue-500 to-indigo-500",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
    dot: "bg-blue-500",
    icon: RotateCcw,
  },
  review: {
    color: "from-amber-400 to-orange-500",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
    icon: Clock,
  },
  completed: {
    color: "from-emerald-400 to-teal-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  on_hold: {
    color: "from-orange-400 to-red-500",
    bg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-500/20",
    dot: "bg-orange-500",
    icon: PauseCircle,
  },
  archived: {
    color: "from-zinc-400 to-zinc-500",
    bg: "bg-zinc-500/10",
    text: "text-zinc-500 dark:text-zinc-400",
    border: "border-zinc-500/20",
    dot: "bg-zinc-500",
    icon: Archive,
  },
};

// ─── Priority Config ────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  low: {
    dot: "bg-slate-400",
    badge:
      "text-slate-600 bg-slate-500/10 border-slate-500/20 dark:text-slate-400",
  },
  medium: {
    dot: "bg-blue-500",
    badge: "text-blue-600 bg-blue-500/10 border-blue-500/20 dark:text-blue-400",
  },
  high: {
    dot: "bg-orange-500",
    badge:
      "text-orange-600 bg-orange-500/10 border-orange-500/20 dark:text-orange-400",
  },
  urgent: {
    dot: "bg-red-500",
    badge: "text-red-600 bg-red-500/10 border-red-500/20 dark:text-red-400",
  },
};

// ─── Type ───────────────────────────────────────────────────────────────────

type ProjectCardProps = {
  project: {
    id: string;
    name: string;
    status: string;
    priority: string;
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
  viewMode?: "grid" | "list";
};

// ─── Deadline Info Helper ────────────────────────────────────────────────────

function getDeadlineInfo(deadline: Date | null, isOverdue: boolean) {
  if (!deadline) return null;

  if (isOverdue) {
    const daysOverdue = Math.abs(differenceInDays(new Date(), deadline));
    return {
      text: `${daysOverdue}d overdue`,
      className: "text-red-600 dark:text-red-400 font-semibold",
      bgClassName: "bg-red-500/10 border border-red-500/20",
      icon: AlertTriangle,
    };
  }
  if (isToday(deadline)) {
    return {
      text: "Due today",
      className: "text-amber-600 dark:text-amber-400 font-semibold",
      bgClassName: "bg-amber-500/10 border border-amber-500/20",
      icon: AlertTriangle,
    };
  }

  const daysUntil = differenceInDays(deadline, new Date());
  if (daysUntil <= 7 && daysUntil > 0) {
    return {
      text: `${daysUntil}d left`,
      className: "text-amber-600 dark:text-amber-400",
      bgClassName: "bg-amber-500/10 border border-amber-500/20",
      icon: Clock,
    };
  }

  return {
    text: format(deadline, "MMM d, yyyy"),
    className: "text-muted-foreground",
    bgClassName: "",
    icon: Calendar,
  };
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ProjectCard({ project, viewMode = "grid" }: ProjectCardProps) {
  const deadlineDate = project.deadline ? new Date(project.deadline) : null;
  const startDate = project.startDate ? new Date(project.startDate) : null;
  const statusCfg =
    (STATUS_CONFIG as any)[project.status] ?? STATUS_CONFIG.not_started;
  const priorityCfg =
    (PRIORITY_CONFIG as any)[project.priority] ?? PRIORITY_CONFIG.medium;
  const StatusIcon = statusCfg.icon;
  const deadlineInfo = getDeadlineInfo(deadlineDate, project.isOverdue);

  const clientInitials = project.clientCompanyName
    ? project.clientCompanyName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : (project.clientEmail?.slice(0, 2).toUpperCase() ?? "--");

  const budgetFormatted =
    project.budget != null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(project.budget)
      : null;

  // ── LIST VIEW ───────────────────────────────────────────────────────────────

  if (viewMode === "list") {
    return (
      <Link href={`/project/${project.id}`}>
        <Card className="group hover:border-primary/50 bg-card hover:bg-card/40 relative cursor-pointer overflow-hidden border-white/5 ring-1 ring-white/10 backdrop-blur-3xl transition-[border-color,background-color,box-shadow] duration-500 ease-in-out hover:shadow-[0_0_20px_rgba(var(--primary),0.1)]">
          <CardContent className="p-0">
            <div className="flex items-center gap-0">
              {/* Subtle status indicator */}
              <div
                className={cn(
                  "w-1 self-stretch bg-linear-to-b opacity-80 transition-all duration-500 group-hover:w-[6px] group-hover:opacity-100",
                  statusCfg.color,
                )}
              />

              <div className="flex flex-1 items-center gap-4 px-5 py-4">
                {/* Project name + client */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="group-hover:text-primary truncate text-sm font-semibold transition-colors">
                      {project.name}
                    </h3>
                    {project.isOverdue && (
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500/80" />
                    )}
                  </div>
                  <p className="text-muted-foreground truncate text-xs">
                    {project.clientCompanyName ??
                      project.clientEmail ??
                      "No client"}
                  </p>
                </div>

                {/* Badges */}
                <div className="hidden items-center gap-3 md:flex">
                  <span
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest backdrop-blur-md transition-colors",
                      priorityCfg.badge,
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor]",
                        priorityCfg.dot,
                      )}
                    />
                    {PRIORITY_LABELS[
                      project.priority as keyof typeof PRIORITY_LABELS
                    ]?.toUpperCase() ?? project.priority.toUpperCase()}
                  </span>

                  <span
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest backdrop-blur-md transition-colors",
                      statusCfg.bg,
                      statusCfg.text,
                      statusCfg.border,
                    )}
                  >
                    <StatusIcon className="h-3 w-3 opacity-80" />
                    {STATUS_LABELS[
                      project.status as keyof typeof STATUS_LABELS
                    ]?.toUpperCase() ?? project.status.toUpperCase()}
                  </span>
                </div>

                {/* Deadline */}
                <div className="min-w-[80px] shrink-0 text-right">
                  {deadlineInfo && (
                    <p
                      className={cn(
                        "text-[11px] tabular-nums",
                        deadlineInfo.className,
                      )}
                    >
                      {deadlineInfo.text}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // ── GRID VIEW ───────────────────────────────────────────────────────────────

  return (
    <Link href={`/projects/${project.id}`}>
      <Card
        className={cn(
          "group bg-card hover:bg-card/50 relative flex h-full cursor-pointer flex-col overflow-hidden ring-1 ring-white/10 backdrop-blur-3xl transition-all duration-500 ease-in-out hover:shadow-[0_0_30px_rgba(0,0,0,0.4)] active:scale-[0.98]",
          "hover:ring-offset-background hover:ring-2 hover:ring-offset-2",
          project.status === "in_progress" && "hover:ring-blue-500/50",
          project.status === "completed" && "hover:ring-emerald-500/50",
          project.status === "review" && "hover:ring-amber-500/50",
          project.status === "on_hold" && "hover:ring-orange-500/50",
          project.status === "archived" && "hover:ring-zinc-500/50",
          project.status === "not_started" && "hover:ring-slate-500/50",
        )}
      >
        {/* Subtle top indicator */}
        <div
          className={cn(
            "h-[3px] w-full bg-gradient-to-r opacity-40 transition-all duration-500 group-hover:h-[6px] group-hover:opacity-100",
            statusCfg.color,
          )}
        />
        {/* Subtle internal shine */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <CardHeader className="flex-none pt-5 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="group-hover:text-primary line-clamp-2 text-sm leading-tight font-bold transition-colors">
                {project.name}
              </h3>

              {/* Client row */}
              <div className="mt-2.5 flex items-center gap-2">
                <Avatar className="h-5 w-5 border border-white/10">
                  <AvatarFallback
                    className={cn(
                      "text-[9px] font-black",
                      statusCfg.bg,
                      statusCfg.text,
                    )}
                  >
                    {clientInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground truncate text-[11px] font-medium">
                  {project.clientCompanyName ??
                    project.clientEmail ??
                    "No client"}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-4 py-2">
          {/* Status + Priority chips */}
          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                "flex items-center gap-2 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest backdrop-blur-md",
                statusCfg.bg,
                statusCfg.text,
                statusCfg.border,
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor]",
                  statusCfg.dot,
                )}
              />
              {STATUS_LABELS[
                project.status as keyof typeof STATUS_LABELS
              ]?.toUpperCase() ?? project.status.toUpperCase()}
            </span>

            <span
              className={cn(
                "flex items-center gap-2 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest backdrop-blur-md",
                priorityCfg.badge,
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor]",
                  priorityCfg.dot,
                )}
              />
              {PRIORITY_LABELS[
                project.priority as keyof typeof PRIORITY_LABELS
              ]?.toUpperCase() ?? project.priority.toUpperCase()}
            </span>

            {project.isOverdue && (
              <span className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-red-500 backdrop-blur-md">
                <AlertTriangle className="h-3 w-3" />
                OVERDUE
              </span>
            )}
          </div>

          {/* Description */}
          {project.description && (
            <p className="text-muted-foreground line-clamp-2 text-[11px] leading-relaxed opacity-80">
              {project.description}
            </p>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-sm bg-white/5 px-1.5 py-0.5 text-[9px] font-bold tracking-tighter text-white/40 uppercase ring-1 ring-white/10"
                >
                  {tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="text-muted-foreground py-0.5 text-[9px] opacity-60">
                  +{project.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex-none border-t border-white/5 px-5 pt-4 pb-4">
          <div className="flex w-full items-center justify-between gap-2">
            {/* Date range */}
            <div className="text-muted-foreground flex min-w-0 items-center gap-2 text-[10px] font-bold tracking-widest uppercase opacity-70">
              <Calendar className="h-3.5 w-3.5 shrink-0 opacity-50" />
              <span className="truncate font-mono">
                {startDate && format(startDate, "MMM d")}
                {startDate && deadlineDate && " — "}
                {deadlineDate && format(deadlineDate, "MMM d")}
              </span>
            </div>

            {/* Budget */}
            {budgetFormatted && (
              <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-black text-emerald-400">
                <DollarSign className="h-3.5 w-3.5 opacity-70" />
                <span className="font-mono">{budgetFormatted}</span>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
