"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Search, AlertTriangle, ArrowRight, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Milestone = { id: string; completed: boolean; title: string | null };
type Project = {
  id: string;
  name: string;
  status: string;
  deadline: string | Date;
  description?: string | null;
  milestones: Milestone[];
};

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "completed":
      return "success" as const;
    case "review":
      return "warning" as const;
    case "on_hold":
      return "secondary" as const;
    default:
      return "default" as const;
  }
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function calcProgress(milestones: Milestone[]) {
  const total = milestones.length;
  const done = milestones.filter((m) => m.completed).length;
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

const STATUS_FILTERS = [
  "all",
  "active",
  "review",
  "completed",
  "on_hold",
] as const;

export function ProjectsPageClient({ projects }: { projects: Project[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = projects.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Track progress on all your projects.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-muted-foreground h-4 w-4" />
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                filter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent",
              )}
            >
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-muted-foreground bg-card rounded-xl border p-8 text-center text-sm">
          {projects.length === 0
            ? "No projects yet. They'll appear here once your agency assigns them."
            : "No projects match your search."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((project) => {
            const deadlineDate = new Date(project.deadline);
            const overdue =
              deadlineDate < new Date() &&
              project.status !== "completed" &&
              project.status !== "archived";
            const progress = calcProgress(project.milestones);

            return (
              <Link
                key={project.id}
                href={`/portal/projects/${project.id}`}
                className="group bg-card hover:border-primary/40 block rounded-xl border p-5 transition-colors"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold">{project.name}</h3>
                  <Badge
                    variant={getStatusBadgeVariant(project.status)}
                    className="capitalize"
                  >
                    {statusLabel(project.status)}
                  </Badge>
                </div>

                {project.description && (
                  <p className="text-muted-foreground mb-4 line-clamp-1 text-sm">
                    {project.description}
                  </p>
                )}

                <div className="mb-4 flex items-center gap-2 text-sm">
                  {overdue ? (
                    <AlertTriangle className="text-destructive h-4 w-4" />
                  ) : null}
                  <span
                    className={cn(
                      "text-muted-foreground",
                      overdue && "text-destructive font-medium",
                    )}
                  >
                    Due {format(deadlineDate, "MMM d, yyyy")}
                    {overdue ? " — Overdue" : ""}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-muted-foreground flex items-center justify-between text-xs">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>

                {project.status === "completed" ? (
                  <div className="text-primary mt-4 inline-flex items-center text-sm font-medium">
                    View project
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
