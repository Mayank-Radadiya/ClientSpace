import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { PROJECT_CARD_COPY } from "./ProjectCard.content";
import type { getProjectCardViewModel } from "./ProjectCard.logic";

type ProjectCardViewModel = ReturnType<typeof getProjectCardViewModel>;

type ProjectCardUIProps = {
  vm: ProjectCardViewModel;
  viewMode: "grid" | "list";
};

// ─── List view ───────────────────────────────────────────────────────────────

function ListProjectCard({ vm }: { vm: ProjectCardViewModel }) {
  const StatusIcon = vm.statusCfg.icon;

  return (
    <Link
      href={`/projects/${vm.project.id}`}
      className="group focus-visible:ring-ring block rounded-xl outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <div className="border-border bg-card hover:bg-accent/40 flex items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-xs md:gap-6">
        {/* Left avatar */}
        <Avatar className="border-border/50 h-10 w-10 shrink-0 border shadow-xs">
          <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
            {vm.clientInitials}
          </AvatarFallback>
        </Avatar>

        {/* Title and Client */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-foreground group-hover:text-primary truncate text-sm font-semibold transition-colors">
              {vm.project.name}
            </h3>
            {vm.project.isOverdue && (
              <AlertTriangle className="text-destructive h-4 w-4 shrink-0" />
            )}
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <span className="truncate">{vm.clientName}</span>
            <span className="bg-border h-1 w-1 rounded-full" />
            <span className="shrink-0 font-medium">{vm.timelineLabel}</span>
          </div>
        </div>

        {/* Progress bar */}
        {/* <div className="bg-pink hidden w-24 shrink-0 sm:block xl:w-32 bg-pink-300">
          <div className="text-muted-foreground mb-1.5 flex items-center justify-between text-xs font-medium">
            <span>{PROJECT_CARD_COPY.progressLabel}</span>
            <span>{vm.progressValue}%</span>
          </div>
          <div className="bg-secondary/80 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                vm.statusCfg.dot,
              )}
              style={{ width: `${vm.progressValue}%` }}
            />
          </div>
        </div> */}

        {/* Badges */}
        <div className="hidden min-w-[240px] shrink-0 items-center justify-end gap-3 lg:flex">
          <span
            className={cn(
              "inline-flex flex-1 shrink-0 items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
              vm.priorityCfg.badge,
            )}
          >
            <span
              className={cn("h-1.5 w-1.5 rounded-full", vm.priorityCfg.dot)}
            />
            {vm.priorityLabel}
          </span>
          <span
            className={cn(
              "inline-flex flex-1 shrink-0 items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
              vm.statusCfg.bg,
              vm.statusCfg.text,
              vm.statusCfg.border,
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {vm.statusLabel}
          </span>
        </div>

        {/* Arrow indicator */}
        <div className="text-muted-foreground/50 group-hover:text-foreground flex shrink-0 items-center justify-end pl-2 transition-colors">
          <ArrowUpRight className="h-5 w-5 transition-transform duration-200 group-hover:rotate-12" />
        </div>
      </div>
    </Link>
  );
}

// ─── Grid view ───────────────────────────────────────────────────────────────

function GridProjectCard({ vm }: { vm: ProjectCardViewModel }) {
  const StatusIcon = vm.statusCfg.icon;

  return (
    <Link
      href={`/projects/${vm.project.id}`}
      className="group ring-offset-background focus-visible:ring-ring block h-full rounded-xl outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <div className="border-border bg-card hover:border-border/80 flex h-full flex-col justify-between rounded-xl border p-6 shadow-xs transition-all hover:shadow-md">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <h3 className="text-foreground group-hover:text-primary truncate text-base font-semibold tracking-tight transition-colors">
                  {vm.project.name}
                </h3>
                {vm.project.isOverdue && (
                  <AlertTriangle className="text-destructive h-4 w-4 shrink-0" />
                )}
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Avatar className="border-border/50 h-5 w-5 border">
                  <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-medium">
                    {vm.clientInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{vm.clientName}</span>
              </div>
            </div>

            {/* Badges container (Status & Priority) */}
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  vm.statusCfg.bg,
                  vm.statusCfg.text,
                  vm.statusCfg.border,
                )}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {vm.statusLabel}
              </span>
              <span
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  vm.priorityCfg.badge,
                )}
              >
                <span
                  className={cn("h-1.5 w-1.5 rounded-full", vm.priorityCfg.dot)}
                />
                {vm.priorityLabel}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="mt-5">
            {vm.project.description ? (
              <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                {vm.project.description}
              </p>
            ) : (
              <p className="text-muted-foreground/70 text-sm italic">
                No description provided.
              </p>
            )}
          </div>

          {/* Tags */}
          {vm.project.tags && vm.project.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {vm.project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="bg-secondary/60 text-secondary-foreground hover:bg-secondary inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition-colors"
                >
                  {tag}
                </span>
              ))}
              {vm.project.tags.length > 3 && (
                <span className="text-muted-foreground inline-flex items-center px-1 text-xs font-medium">
                  +{vm.project.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-border/50 mt-6 flex flex-col gap-4 border-t pt-4">
          <div className="text-muted-foreground flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-foreground/80 font-medium">
                {vm.timelineLabel}
              </span>
            </div>
            {vm.budgetFormatted && (
              <div className="text-foreground/80 flex items-center gap-1.5 font-medium">
                <DollarSign className="h-4 w-4" />
                <span>{vm.budgetFormatted}</span>
              </div>
            )}
          </div>

          {/* Progress Section */}
          {/* <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground tracking-wider uppercase">
                {PROJECT_CARD_COPY.progressLabel}
              </span>
              <span className="text-foreground">{vm.progressValue}%</span>
            </div>
            <div className="bg-secondary/80 h-2 w-full overflow-hidden rounded-full">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  vm.statusCfg.dot,
                )}
                style={{ width: `${vm.progressValue}%` }}
              />
            </div>
          </div> */}
        </div>
      </div>
    </Link>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function ProjectCardUI({ vm, viewMode }: ProjectCardUIProps) {
  if (viewMode === "list") {
    return <ListProjectCard vm={vm} />;
  }

  return <GridProjectCard vm={vm} />;
}
