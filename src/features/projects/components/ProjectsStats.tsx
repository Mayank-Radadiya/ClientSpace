"use client";

import {
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ProjectStats = {
  total: number;
  inProgress: number;
  completed: number;
  overdue: number;
};

type ProjectsStatsProps = {
  stats: ProjectStats;
};

export function ProjectsStats({ stats }: ProjectsStatsProps) {
  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const cards = [
    {
      title: "Total Projects",
      value: stats.total,
      icon: FolderKanban,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "In Progress",
      value: stats.inProgress,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950",
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Overdue",
      value: stats.overdue,
      icon: AlertCircle,
      color: stats.overdue > 0 ? "text-red-600" : "text-muted-foreground",
      bgColor: stats.overdue > 0 ? "bg-red-50 dark:bg-red-950" : "bg-muted",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  {card.title}
                </p>
                <p className="mt-1 text-2xl font-bold">{card.value}</p>
              </div>
              <div className={cn("rounded-lg p-2", card.bgColor)}>
                <card.icon className={cn("h-4 w-4", card.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="col-span-2 overflow-hidden lg:col-span-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-950">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  Completion Rate
                </p>
                <p className="text-2xl font-bold">{completionRate}%</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <div className="bg-muted h-2 w-24 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
