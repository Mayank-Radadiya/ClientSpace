// src/features/dashboard/components/RecentProjectsCard.tsx
// Displays recent projects with status badges

"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { ChevronRight, FolderKanban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  status: string;
  priority: string;
  deadline: string | null;
  updatedAt: Date;
  clientName: string;
}

interface RecentProjectsCardProps {
  projects: Project[];
  loading?: boolean;
}

// ─── Status Badge Mapping ─────────────────────────────────────────────────────

function getStatusVariant(status: string) {
  switch (status) {
    case "completed":
      return "success";
    case "in_progress":
      return "info";
    case "review":
      return "warning";
    case "on_hold":
      return "secondary";
    case "archived":
      return "outline";
    default:
      return "default";
  }
}

function getStatusLabel(status: string) {
  return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RecentProjectsCard({
  projects,
  loading = false,
}: RecentProjectsCardProps) {
  if (loading) {
    return <RecentProjectsCardSkeleton />;
  }

  if (projects.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="font-heading mb-4 text-lg font-semibold">
          Recent Projects
        </h3>
        <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
          <FolderKanban className="mb-3 h-10 w-10 opacity-30" />
          <p className="text-sm">No projects yet</p>
          <p className="mt-1 text-xs">
            Create your first project to get started
          </p>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1, ease: "easeOut" }}
    >
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold">
            Recent Projects
          </h3>
          <Link
            href="/projects"
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium transition-colors"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15, delay: index * 0.05 }}
            >
              <Link
                href={`/projects/${project.id}`}
                className="border-border hover:bg-accent/50 group block rounded-lg border p-3 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h4 className="truncate font-sans text-sm font-medium">
                        {project.name}
                      </h4>
                      <Badge
                        variant={getStatusVariant(project.status)}
                        className="shrink-0"
                      >
                        {getStatusLabel(project.status)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground truncate text-xs">
                      {project.clientName}
                    </p>
                  </div>
                  <div className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
                    <span>
                      {formatDistanceToNow(new Date(project.updatedAt), {
                        addSuffix: true,
                      })}
                    </span>
                    <ChevronRight className="group-hover:text-foreground h-4 w-4 transition-colors" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RecentProjectsCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-border rounded-lg border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
