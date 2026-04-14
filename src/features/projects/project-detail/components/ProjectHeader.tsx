"use client";

import { Project, ProjectMember } from "../types";
import { ProjectPermissions } from "../hooks/useProjectPermissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Share, Edit3 } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { getPriorityStyle } from "../../utils/formatters";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ProjectHeaderProps {
  project: Project;
  members: ProjectMember[];
  permissions: ProjectPermissions;
  onUpdate: (updates: Partial<Project>) => void;
  onAddMember: (email: string, role: string) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onChangeRole: (userId: string, role: string) => Promise<void>;
}

export function ProjectHeader({
  project,
  members,
  permissions,
  onUpdate,
  onAddMember,
  onRemoveMember,
  onChangeRole,
}: ProjectHeaderProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return (
          <Badge
            variant="default"
            className="border-transparent bg-blue-500 text-white hover:bg-blue-600"
          >
            In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="default"
            className="border-transparent bg-green-500 text-white hover:bg-green-600"
          >
            Completed
          </Badge>
        );
      case "on_hold":
        return (
          <Badge
            variant="default"
            className="border-transparent bg-amber-500 text-white hover:bg-amber-600"
          >
            On Hold
          </Badge>
        );
      case "archived":
        return <Badge variant="secondary">Archived</Badge>;
      case "not_started":
        return <Badge variant="secondary">Not Started</Badge>;
      case "review":
        return (
          <Badge
            variant="default"
            className="border-transparent bg-indigo-500 text-white hover:bg-indigo-600"
          >
            Review
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="capitalize">
            {status.replace(/_/g, " ")}
          </Badge>
        );
    }
  };

  const clientName =
    project.client?.company_name || project.client?.contact_name || "No Client";
  const deadlineStr = new Date(project.deadline).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="mb-6 flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/projects" className="text-[14px]">
                Projects
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-foreground max-w-[200px] truncate text-[14px] sm:max-w-none">
                {project.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-3">
          {getStatusBadge(project.status)}
          {permissions.canViewPriority &&
            (() => {
              const ps = getPriorityStyle(project.priority);
              return (
                <Badge
                  variant="outline"
                  className={`capitalize ${ps.bg} ${ps.text} ${ps.border}`}
                >
                  {ps.label}
                </Badge>
              );
            })()}
          <Button
            variant="outline"
            size="sm"
            onClick={() => gooeyToast.success("Share dialog opened")}
          >
            <Share className="mr-2 h-4 w-4" /> Share
          </Button>
          {permissions.canEdit && (
            <Sheet>
              <SheetTrigger>
                <Button variant="default" size="sm" id="edit-project-trigger">
                  <Edit3 className="mr-2 h-4 w-4" /> Edit Project
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:max-w-[400px]">
                <SheetHeader>
                  <SheetTitle>Edit Project</SheetTitle>
                </SheetHeader>
                <div className="text-muted-foreground py-6 text-sm">
                  <p>Edit project settings form goes here.</p>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-foreground text-[22px] font-medium tracking-tight">
          {project.name}
        </h1>
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-[14px]">
          <span className="text-foreground font-medium">{clientName}</span>
          <span className="text-muted-foreground/50">·</span>
          <span>{deadlineStr}</span>
          {project.tags && project.tags.length > 0 && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <div className="flex items-center gap-1.5">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-muted text-muted-foreground border-border/50 rounded-md border px-2 py-0.5 text-[12px] font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
