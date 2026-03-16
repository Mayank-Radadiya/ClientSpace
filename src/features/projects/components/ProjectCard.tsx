import Link from "next/link";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, PRIORITY_LABELS } from "../schemas";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  not_started: "secondary",
  in_progress: "default",
  review: "outline",
  completed: "default",
  on_hold: "secondary",
  archived: "secondary",
};

const PRIORITY_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  low: "secondary",
  medium: "outline",
  high: "default",
  urgent: "destructive",
};

type ProjectCardProps = {
  project: {
    id: string;
    name: string;
    status: string;
    priority: string;
    deadline: string | null;
    isOverdue: boolean; // Must come from tRPC — never computed client-side
    clientCompanyName: string | null;
    clientEmail: string | null;
    tags: string[] | null;
  };
};

export function ProjectCard({ project }: ProjectCardProps) {
  const deadlineDate = project.deadline ? new Date(project.deadline) : null;

  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <Card className="group hover:border-primary/30 flex h-full cursor-pointer flex-col transition-all hover:shadow-md">
        <CardHeader className="flex-none pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="group-hover:text-primary line-clamp-2 text-base leading-tight font-semibold transition-colors">
              {project.name}
            </CardTitle>
            <Badge
              variant={PRIORITY_VARIANT[project.priority] ?? "outline"}
              className="shrink-0 text-xs"
            >
              {PRIORITY_LABELS[
                project.priority as keyof typeof PRIORITY_LABELS
              ] ?? project.priority}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-2 pb-3">
          <p className="text-muted-foreground truncate text-sm">
            {project.clientCompanyName ?? project.clientEmail ?? "—"}
          </p>
          <Badge
            variant={STATUS_VARIANT[project.status] ?? "secondary"}
            className="text-xs"
          >
            {STATUS_LABELS[project.status as keyof typeof STATUS_LABELS] ??
              project.status}
          </Badge>
        </CardContent>

        <CardFooter className="text-muted-foreground flex-none pt-0 text-xs">
          {deadlineDate ? (
            <span
              className={
                project.isOverdue ? "text-destructive font-medium" : ""
              }
            >
              {project.isOverdue ? "⚠ Overdue: " : "Due: "}
              {format(deadlineDate, "MMM d, yyyy")}
            </span>
          ) : (
            <span>No deadline</span>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
