import Link from "next/link";
import { format } from "date-fns";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Milestone = { id: string; completed: boolean };

interface ClientProjectCardProps {
  project: {
    id: string;
    name: string;
    status: string;
    deadline: string | Date;
    milestones: Milestone[];
  };
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "completed":
      return "success" as const;
    case "review":
      return "warning" as const;
    case "on_hold":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export function ClientProjectCard({ project }: ClientProjectCardProps) {
  const deadlineDate = new Date(project.deadline);
  const overdue =
    deadlineDate < new Date() &&
    project.status !== "completed" &&
    project.status !== "archived";

  const total = project.milestones.length;
  const done = project.milestones.filter((m) => m.completed).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Link
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
          {overdue ? " - Overdue" : ""}
        </span>
      </div>

      <div className="space-y-2">
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>Milestones</span>
          <span>
            {done}/{total}
          </span>
        </div>
        <Progress value={progress} />
      </div>

      {project.status === "completed" ? (
        <div className="text-primary mt-4 inline-flex items-center text-sm font-medium">
          Need revisions? Request a follow-up
          <ArrowRight className="ml-1 h-4 w-4" />
        </div>
      ) : null}
    </Link>
  );
}
