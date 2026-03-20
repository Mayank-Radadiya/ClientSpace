import Link from "next/link";
import { AlertTriangle, Calendar, DollarSign } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PROJECT_CARD_COPY } from "./ProjectCard.content";
import type { getProjectCardViewModel } from "./ProjectCard.logic";

type ProjectCardViewModel = ReturnType<typeof getProjectCardViewModel>;

type ProjectCardUIProps = {
  vm: ProjectCardViewModel;
  viewMode: "grid" | "list";
};

function ListProjectCard({ vm }: { vm: ProjectCardViewModel }) {
  const StatusIcon = vm.statusCfg.icon;

  return (
    <Link href={`/projects/${vm.project.id}`}>
      <Card className="group border-border/70 bg-card/95 hover:border-primary/30 relative cursor-pointer overflow-hidden shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-linear-to-br to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100",
            vm.statusCfg.glow,
          )}
        />

        <CardContent className="relative p-0">
          <div className="flex items-stretch">
            <div
              className={cn(
                "w-1 bg-linear-to-b opacity-90 transition-all duration-300 group-hover:w-1.5",
                vm.statusCfg.color,
              )}
            />

            <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3.5 md:gap-4 md:px-5">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7 border border-white/20">
                    <AvatarFallback
                      className={cn(
                        "text-[10px] font-semibold",
                        vm.statusCfg.bg,
                        vm.statusCfg.text,
                      )}
                    >
                      {vm.clientInitials}
                    </AvatarFallback>
                  </Avatar>

                  <h3 className="truncate text-sm font-semibold tracking-tight">
                    {vm.project.name}
                  </h3>

                  {vm.project.isOverdue && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-3 w-3" />
                      {PROJECT_CARD_COPY.overdueBadge}
                    </span>
                  )}
                </div>

                <p className="text-muted-foreground truncate text-xs">
                  {vm.clientName}
                </p>

                <div className="flex items-center gap-2">
                  <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className={cn(
                        "h-full rounded-full bg-linear-to-r",
                        vm.statusCfg.color,
                      )}
                      style={{ width: `${vm.progressValue}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-9 shrink-0 text-right text-[10px] font-semibold">
                    {vm.progressValue}%
                  </span>
                </div>
              </div>

              <div className="hidden shrink-0 items-center gap-2 lg:flex">
                <span
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide",
                    vm.priorityCfg.badge,
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full shadow-[0_0_10px_currentColor]",
                      vm.priorityCfg.dot,
                    )}
                  />
                  {vm.priorityLabel}
                </span>

                <span
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide",
                    vm.statusCfg.bg,
                    vm.statusCfg.text,
                    vm.statusCfg.border,
                  )}
                >
                  <StatusIcon className="h-3 w-3" />
                  {vm.statusLabel}
                </span>
              </div>

              <div className="min-w-24 shrink-0 space-y-1 text-right">
                <p className="text-muted-foreground text-[10px] font-medium uppercase">
                  Timeline
                </p>
                <p className="truncate text-[11px] font-medium">
                  {vm.timelineLabel}
                </p>
                {vm.deadlineInfo ? (
                  <p
                    className={cn(
                      "text-[11px] tabular-nums",
                      vm.deadlineInfo.className,
                    )}
                  >
                    {vm.deadlineInfo.text}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-[11px]">
                    {PROJECT_CARD_COPY.noTimeline}
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

function GridProjectCard({ vm }: { vm: ProjectCardViewModel }) {
  const StatusIcon = vm.statusCfg.icon;

  return (
    <Link href={`/projects/${vm.project.id}`}>
      <Card
        className={cn(
          "group border-border/70 bg-card/95 relative flex h-full cursor-pointer flex-col overflow-hidden shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl",
          "hover:ring-offset-background hover:ring-2 hover:ring-offset-2",
          vm.statusCfg.ring,
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-linear-to-br to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100",
            vm.statusCfg.glow,
          )}
        />

        <div
          className={cn(
            "h-1 w-full bg-linear-to-r opacity-90 transition-all duration-300 group-hover:h-1.5",
            vm.statusCfg.color,
          )}
        />

        <CardHeader className="relative pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-[15px] leading-tight font-semibold tracking-tight">
                {vm.project.name}
              </h3>

              <div className="mt-2.5 flex items-center gap-2">
                <Avatar className="h-6 w-6 border border-white/10">
                  <AvatarFallback
                    className={cn(
                      "text-[10px] font-semibold",
                      vm.statusCfg.bg,
                      vm.statusCfg.text,
                    )}
                  >
                    {vm.clientInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground truncate text-[11px]">
                  {vm.clientName}
                </span>
              </div>
            </div>

            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold tracking-wide",
                vm.statusCfg.bg,
                vm.statusCfg.text,
                vm.statusCfg.border,
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {vm.statusLabel}
            </span>
          </div>
        </CardHeader>

        <CardContent className="relative flex-1 space-y-3 pb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                vm.priorityCfg.badge,
              )}
            >
              <span
                className={cn("h-1.5 w-1.5 rounded-full", vm.priorityCfg.dot)}
              />
              {vm.priorityLabel}
            </span>

            {vm.project.isOverdue && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                <AlertTriangle className="h-3 w-3" />
                {PROJECT_CARD_COPY.overdueBadge}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="text-muted-foreground flex items-center justify-between text-[10px] font-medium uppercase">
              <span>{PROJECT_CARD_COPY.progressLabel}</span>
              <span>{vm.progressValue}%</span>
            </div>
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className={cn(
                  "h-full rounded-full bg-linear-to-r",
                  vm.statusCfg.color,
                )}
                style={{ width: `${vm.progressValue}%` }}
              />
            </div>
          </div>

          {vm.project.description && (
            <p className="text-muted-foreground line-clamp-2 text-[11px] leading-relaxed">
              {vm.project.description}
            </p>
          )}

          {vm.project.tags && vm.project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {vm.project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-black/5 px-1.5 py-0.5 text-[9px] font-medium uppercase ring-1 ring-black/10 dark:bg-white/5 dark:ring-white/10"
                >
                  {tag}
                </span>
              ))}
              {vm.project.tags.length > 3 && (
                <span className="text-muted-foreground py-0.5 text-[10px]">
                  +{vm.project.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t border-black/5 pt-3 dark:border-white/5">
          <div className="flex w-full flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-[10px] font-medium uppercase">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{vm.timelineLabel}</span>
              </div>

              {vm.budgetFormatted && (
                <div className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>{vm.budgetFormatted}</span>
                </div>
              )}
            </div>

            <div className="text-muted-foreground flex items-center justify-between text-[10px]">
              <span>
                {PROJECT_CARD_COPY.createdPrefix} {vm.createdAtLabel}
              </span>
              {vm.deadlineInfo ? (
                <span className={cn("font-medium", vm.deadlineInfo.className)}>
                  {vm.deadlineInfo.text}
                </span>
              ) : (
                <span>{PROJECT_CARD_COPY.noTimeline}</span>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

export function ProjectCardUI({ vm, viewMode }: ProjectCardUIProps) {
  if (viewMode === "list") {
    return <ListProjectCard vm={vm} />;
  }

  return <GridProjectCard vm={vm} />;
}
