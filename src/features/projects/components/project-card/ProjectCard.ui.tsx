"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { getProjectCardViewModel } from "./ProjectCard.logic";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";

type ProjectCardViewModel = ReturnType<typeof getProjectCardViewModel>;

type ProjectCardUIProps = {
  vm: ProjectCardViewModel;
  viewMode: "grid" | "list";
};

// ─── List View ───────────────────────────────────────────────────────────────

function ListProjectCard({ vm }: { vm: ProjectCardViewModel }) {
  const router = useRouter();

  const handleMouseEnter = () => {
    // Prefetch only on desktop (hover is desktop-only behavior)
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      router.prefetch(`/projects/${vm.project.id}`);
    }
  };

  return (
    <Link
      href={`/projects/${vm.project.id}`}
      onMouseEnter={handleMouseEnter}
      className="group focus-visible:ring-ring block rounded-xl outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <div className="bg-card flex items-center gap-4 rounded-xl p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md md:gap-6">
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

        {/* Badges */}
        <div className="hidden min-w-[240px] shrink-0 items-center justify-end gap-3 lg:flex">
          <PriorityBadge priority={vm.project.priority} />
          <StatusBadge status={vm.project.status} />
        </div>

        {/* Arrow indicator */}
        <div className="text-muted-foreground/50 group-hover:text-foreground flex shrink-0 items-center justify-end pl-2 transition-colors">
          <ArrowUpRight className="h-5 w-5 transition-transform duration-200 group-hover:rotate-12" />
        </div>
      </div>
    </Link>
  );
}

// ─── Grid View ───────────────────────────────────────────────────────────────

function GridProjectCard({ vm }: { vm: ProjectCardViewModel }) {
  const router = useRouter();

  const handleMouseEnter = () => {
    // Prefetch only on desktop (hover is desktop-only behavior)
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      router.prefetch(`/projects/${vm.project.id}`);
    }
  };

  return (
    <Link
      href={`/projects/${vm.project.id}`}
      onMouseEnter={handleMouseEnter}
      className="group focus-visible:ring-ring block h-full rounded-2xl outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <div className="bg-card flex h-full flex-col justify-between rounded-2xl p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-foreground group-hover:text-primary truncate text-base leading-tight font-semibold tracking-tight transition-colors">
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
              <StatusBadge status={vm.project.status} />
              <PriorityBadge priority={vm.project.priority} />
            </div>
          </div>

          {/* Description */}
          <div className="mt-4">
            {vm.project.description ? (
              <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                {vm.project.description}
              </p>
            ) : (
              <p className="text-muted-foreground/70 text-sm leading-relaxed italic">
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
        <div className="border-border/50 mt-6 flex items-center justify-between border-t pt-4">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            <span className="text-foreground/80 font-medium">
              {vm.timelineLabel}
            </span>
          </div>
          {vm.budgetFormatted && (
            <div className="text-foreground/80 flex items-center gap-1.5 text-sm font-medium">
              <DollarSign className="h-4 w-4" />
              <span>{vm.budgetFormatted}</span>
            </div>
          )}
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
