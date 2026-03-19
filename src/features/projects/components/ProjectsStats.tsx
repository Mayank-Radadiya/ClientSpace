"use client";

import {
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
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

const STAT_CARDS = [
  {
    key: "total" as const,
    title: "TOTAL PROJECTS",
    icon: FolderKanban,
    iconCls: "text-blue-500",
    iconBg: "from-blue-500/20 to-indigo-500/20",
    border: "border-blue-500/20",
  },
  {
    key: "inProgress" as const,
    title: "IN PROGRESS",
    icon: Clock,
    iconCls: "text-amber-500",
    iconBg: "from-amber-400/20 to-orange-500/20",
    border: "border-amber-500/20",
  },
  {
    key: "completed" as const,
    title: "COMPLETED",
    icon: CheckCircle2,
    iconCls: "text-emerald-500",
    iconBg: "from-emerald-400/20 to-teal-500/20",
    border: "border-emerald-500/20",
  },
  {
    key: "overdue" as const,
    title: "OVERDUE",
    icon: AlertCircle,
    iconCls: "text-red-500",
    iconBg: "from-red-400/20 to-rose-500/20",
    border: "border-red-500/20",
  },
];

export function ProjectsStats({ stats }: ProjectsStatsProps) {
  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:col-span-4 lg:grid-cols-4">
        {STAT_CARDS.map((card) => {
          const value = stats[card.key];
          const isOverdueCard = card.key === "overdue";

          return (
            <Card
              key={card.title}
              className={cn(
                "group bg-card/20 hover:bg-card/40 hover:shadow-primary/5 relative overflow-hidden rounded-xl ring-1 ring-white/10 backdrop-blur-3xl transition-all duration-500 ease-in-out hover:shadow-xl",
                isOverdueCard &&
                  value > 0 &&
                  "bg-red-500/5 ring-red-500/30 hover:bg-red-500/10",
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-[10px] font-bold tracking-widest opacity-60">
                      {card.title}
                    </p>
                    <p
                      className={cn(
                        "font-mono text-3xl font-black tracking-normal",
                        isOverdueCard && value > 0
                          ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                          : "text-foreground",
                      )}
                    >
                      {value}
                    </p>
                  </div>

                  <div
                    className={cn(
                      "group-hover:shadow-primary/20 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg ring-1 ring-white/10 backdrop-blur-xl transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:scale-110 group-hover:rotate-3",
                      card.iconBg,
                    )}
                  >
                    <card.icon
                      className={cn("h-6 w-6 opacity-80", card.iconCls)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Completion Rate column */}
      <Card className="group bg-card/20 hover:bg-card/40 relative overflow-hidden rounded-xl ring-1 ring-violet-500/30 backdrop-blur-3xl transition-all duration-500 hover:shadow-xl hover:shadow-violet-500/10">
        <CardContent className="flex h-full flex-col justify-between p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-muted-foreground text-[10px] font-bold tracking-widest opacity-60">
                COMPLETION
              </p>
              <p className="font-mono text-3xl font-black tracking-normal text-violet-400 drop-shadow-[0_0_12px_rgba(167,139,250,0.3)]">
                {completionRate}%
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20 shadow-lg ring-1 shadow-violet-500/10 ring-violet-500/40 backdrop-blur-xl transition-all duration-500 group-hover:-translate-y-1 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-violet-500/30">
              <TrendingUp className="h-6 w-6 text-violet-400" />
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="text-muted-foreground flex justify-between text-[11px] font-bold tracking-widest uppercase opacity-70">
              <span className="text-emerald-500">
                <span className="font-mono text-xs">{stats.completed}</span>{" "}
                DONE
              </span>
              <span className="text-violet-300">
                <span className="font-mono text-xs">
                  {stats.total - stats.completed}
                </span>{" "}
                LEFT
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 shadow-[0_0_12px_rgba(139,92,246,0.5)] transition-all duration-1000 ease-out"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
