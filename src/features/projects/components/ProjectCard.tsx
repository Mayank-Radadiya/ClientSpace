import Link from "next/link";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { STATUS_LABELS, PRIORITY_LABELS } from "../schemas";
import { cn } from "@/lib/utils";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline" | "warning"
> = {
  not_started: "secondary",
  in_progress: "default",
  review: "outline",
  completed: "default",
  on_hold: "secondary",
  archived: "secondary",
};

const STATUS_COLOR: Record<string, string> = {
  not_started: "bg-gray-500",
  in_progress: "bg-blue-600",
  review: "bg-amber-500",
  completed: "bg-green-600",
  on_hold: "bg-orange-500",
  archived: "bg-zinc-500",
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

const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-zinc-400",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

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

export function ProjectCard({ project, viewMode = "grid" }: ProjectCardProps) {
  const deadlineDate = project.deadline ? new Date(project.deadline) : null;
  const startDate = project.startDate ? new Date(project.startDate) : null;

  const getDeadlineText = () => {
    if (!deadlineDate) return null;

    if (project.isOverdue) {
      return { text: "Overdue", className: "text-red-600 font-medium" };
    }
    if (isToday(deadlineDate)) {
      return { text: "Due today", className: "text-amber-600 font-medium" };
    }

    const daysUntil = Math.ceil(
      (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntil <= 7 && daysUntil > 0) {
      return {
        text: `Due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`,
        className: "text-amber-600",
      };
    }

    return {
      text: format(deadlineDate, "MMM d, yyyy"),
      className: "text-muted-foreground",
    };
  };

  const deadlineInfo = getDeadlineText();
  const clientInitials = project.clientCompanyName
    ? project.clientCompanyName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : (project.clientEmail?.slice(0, 2).toUpperCase() ?? "--");

  if (viewMode === "list") {
    return (
      <Link href={`/dashboard/projects/${project.id}`}>
        <Card className="group hover:border-primary/30 cursor-pointer transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "min-h-[48px] w-1.5 self-stretch rounded-full",
                  STATUS_COLOR[project.status],
                )}
              />

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="group-hover:text-primary truncate font-semibold transition-colors">
                    {project.name}
                  </h3>
                  {project.isOverdue && (
                    <span className="text-xs text-red-500">● Overdue</span>
                  )}
                </div>
                <p className="text-muted-foreground truncate text-sm">
                  {project.clientCompanyName ??
                    project.clientEmail ??
                    "No client"}
                </p>
              </div>

              <div className="hidden items-center gap-4 md:flex">
                <Badge
                  variant={PRIORITY_VARIANT[project.priority] ?? "outline"}
                  className="text-xs"
                >
                  {PRIORITY_LABELS[
                    project.priority as keyof typeof PRIORITY_LABELS
                  ] ?? project.priority}
                </Badge>

                <Badge
                  variant={STATUS_VARIANT[project.status] ?? "secondary"}
                  className="text-xs"
                >
                  {STATUS_LABELS[
                    project.status as keyof typeof STATUS_LABELS
                  ] ?? project.status}
                </Badge>
              </div>

              <div className="text-right">
                {deadlineInfo && (
                  <p className={cn("text-sm", deadlineInfo.className)}>
                    {deadlineInfo.text}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <Card className="group hover:border-primary/30 flex h-full cursor-pointer flex-col overflow-hidden transition-all hover:shadow-md">
        <div className={cn("h-1.5 w-full", STATUS_COLOR[project.status])} />

        <CardHeader className="flex-none pt-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="group-hover:text-primary line-clamp-2 text-base leading-tight font-semibold transition-colors">
                {project.name}
              </h3>
              <div className="mt-2 flex items-center gap-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px]">
                    {clientInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground truncate text-xs">
                  {project.clientCompanyName ??
                    project.clientEmail ??
                    "No client"}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-3 py-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant={STATUS_VARIANT[project.status] ?? "secondary"}
              className="text-xs"
            >
              {STATUS_LABELS[project.status as keyof typeof STATUS_LABELS] ??
                project.status}
            </Badge>
            <Badge
              variant={PRIORITY_VARIANT[project.priority] ?? "outline"}
              className="text-xs"
            >
              {PRIORITY_LABELS[
                project.priority as keyof typeof PRIORITY_LABELS
              ] ?? project.priority}
            </Badge>
          </div>

          {project.description && (
            <p className="text-muted-foreground line-clamp-2 text-xs">
              {project.description}
            </p>
          )}

          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 text-[10px]"
                >
                  {tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="text-muted-foreground text-[10px]">
                  +{project.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex-none border-t pt-2 pb-4">
          <div className="flex w-full items-center justify-between text-xs">
            <div className="text-muted-foreground flex items-center gap-1.5">
              {startDate && (
                <span className="truncate">
                  {format(new Date(startDate), "MMM d")}
                </span>
              )}
              {startDate && deadlineDate && (
                <span className="text-muted-foreground">→</span>
              )}
              {deadlineDate && (
                <span className="truncate">
                  {format(deadlineDate, "MMM d")}
                </span>
              )}
            </div>

            {deadlineInfo && (
              <span className={deadlineInfo.className}>
                {deadlineInfo.text}
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
