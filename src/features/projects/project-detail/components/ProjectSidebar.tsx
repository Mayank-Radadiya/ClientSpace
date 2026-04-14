"use client";

import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { Project, ProjectMember } from "../types";
import { ProjectPermissions } from "../hooks/useProjectPermissions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArchiveDialog } from "./ArchiveDialog";
import { DeleteDialog } from "./DeleteDialog";
import { ChevronRight, CalendarIcon, ArchiveX, Trash2 } from "lucide-react";
import {
  formatClientName,
  formatStatus,
  STATUS_LABELS,
} from "../../utils/formatters";

interface ProjectSidebarProps {
  project: Project;
  members: ProjectMember[];
  permissions: ProjectPermissions;
  onUpdate: (updates: Partial<Project>) => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function ProjectSidebar({
  project,
  members,
  permissions,
  onUpdate,
  onArchive,
  onDelete,
}: ProjectSidebarProps) {
  const [showArchive, setShowArchive] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const handleFieldUpdate = (updates: Partial<Project>) => {
    onUpdate(updates);
  };

  const hasClient = project.client != null;
  const clientName = hasClient
    ? formatClientName(project.client?.company_name)
    : "No client assigned";
  const clientEmail = project.client?.email;

  // Mock activity feed for the UI redesign
  const mockActivities = [
    {
      id: 1,
      user: "You",
      action: "changed status to In Progress",
      time: "2h ago",
      initials: "Y",
    },
    {
      id: 2,
      user: "Alex R.",
      action: "uploaded Phase 1 Assets.zip",
      time: "5h ago",
      initials: "AR",
    },
    {
      id: 3,
      user: "Sam T.",
      action: "completed milestone 'Design Approvals'",
      time: "1d ago",
      initials: "ST",
    },
    {
      id: 4,
      user: "You",
      action: "created the project",
      time: "3d ago",
      initials: "Y",
    },
  ];

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Panel 1: Client */}
      <div className="border-border bg-card flex flex-col overflow-hidden rounded-xl border shadow-sm">
        <div className="border-border/50 bg-muted/30 border-b px-4 py-3">
          <h3 className="text-muted-foreground text-[13px] font-medium tracking-wide uppercase">
            Client
          </h3>
        </div>
        <div className="p-4">
          {hasClient ? (
            <div className="group flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="bg-muted border-border/50 h-9 w-9 rounded-full border">
                  <AvatarFallback className="text-muted-foreground bg-transparent text-[12px] font-medium">
                    {clientName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-card-foreground text-[14px] leading-tight font-medium">
                    {clientName}
                  </span>
                  {clientEmail && (
                    <span className="text-muted-foreground mt-0.5 text-[13px] leading-tight">
                      {clientEmail}
                    </span>
                  )}
                </div>
              </div>
              <Link
                href={`/clients/${project.client_id}`}
                className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <div className="bg-muted/50 hover:bg-muted border-border/50 flex h-7 w-7 items-center justify-center rounded-full border">
                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                </div>
              </Link>
            </div>
          ) : (
            <span className="text-muted-foreground flex h-9 items-center text-sm">
              No client assigned
            </span>
          )}
        </div>
      </div>

      {/* Panel 2: Project Details */}
      <div className="border-border bg-card flex flex-col overflow-hidden rounded-xl border shadow-sm">
        <div className="border-border/50 bg-muted/30 border-b px-4 py-3">
          <h3 className="text-muted-foreground text-[13px] font-medium tracking-wide uppercase">
            Details
          </h3>
        </div>
        <div className="divide-border/50 flex flex-col divide-y">
          <div className="flex items-center justify-between px-4 py-3 text-[14px]">
            <span className="text-muted-foreground">Status</span>
            <Select
              value={project.status}
              onValueChange={(v) =>
                handleFieldUpdate({ status: v as Project["status"] })
              }
              disabled={!permissions.canEdit}
            >
              <SelectTrigger className="hover:bg-muted/50 text-card-foreground h-8 w-auto gap-2 border-transparent bg-transparent p-0 pr-2 text-right font-medium shadow-none focus:ring-0 focus:ring-offset-0">
                <SelectValue>{formatStatus(project.status)}</SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {permissions.canViewPriority && (
            <div className="flex items-center justify-between px-4 py-3 text-[14px]">
              <span className="text-muted-foreground">Priority</span>
              <Select
                value={project.priority}
                onValueChange={(v) =>
                  handleFieldUpdate({ priority: v as Project["priority"] })
                }
                disabled={!permissions.canEdit}
              >
                <SelectTrigger className="hover:bg-muted/50 text-card-foreground h-8 w-auto gap-2 border-transparent bg-transparent p-0 pr-2 text-right font-medium capitalize shadow-none focus:ring-0 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-3 text-[14px]">
            <span className="text-muted-foreground">Deadline</span>
            <button className="hover:bg-muted/50 text-card-foreground -mr-2 flex h-8 items-center gap-2 rounded-md border border-transparent px-2 font-medium transition-colors">
              {project.deadline
                ? format(new Date(project.deadline), "MMM d, yyyy")
                : "Not set"}
              <CalendarIcon className="text-muted-foreground/70 h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between px-4 py-3 text-[14px]">
            <span className="text-muted-foreground">Tags</span>
            <div className="flex flex-wrap items-center justify-end gap-1">
              {project.tags?.length ? (
                project.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-muted hover:bg-muted/80 text-muted-foreground border-border/50 rounded-sm border px-1.5 py-0 font-normal"
                  >
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground/70 hover:text-primary cursor-pointer text-[13px]">
                  Add tags...
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-3 text-[14px]">
            <span className="text-muted-foreground">Created</span>
            <span className="text-card-foreground">
              {format(new Date(project.created_at), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </div>

      {/* Panel 3: Activity Feed */}
      <div className="border-border bg-card flex flex-col overflow-hidden rounded-xl border shadow-sm">
        <div className="border-border/50 bg-muted/30 border-b px-4 py-3">
          <h3 className="text-muted-foreground text-[13px] font-medium tracking-wide uppercase">
            Activity
          </h3>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <div className="before:via-border/50 relative before:absolute before:inset-0 before:ml-3.5 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:to-transparent md:before:mx-auto md:before:translate-x-0">
            {mockActivities.map((act, i) => (
              <div
                key={act.id}
                className={`group is-active relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse ${i !== 0 ? "mt-4" : ""}`}
              >
                <div className="border-background bg-muted text-muted-foreground z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold shadow-sm md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  {act.initials}
                </div>
                <div className="border-border/50 bg-card flex w-[calc(100%-2.5rem)] flex-col rounded border p-3 pt-2 pb-2.5 shadow-sm md:w-[calc(50%-1.5rem)]">
                  <span className="text-foreground text-[13px] leading-tight">
                    <span className="text-card-foreground font-semibold">
                      {act.user}
                    </span>{" "}
                    {act.action}
                  </span>
                  <span className="text-muted-foreground mt-1 text-[11px]">
                    {act.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-2 w-full rounded-lg bg-indigo-500/10 py-2 text-center text-[13px] font-medium text-indigo-500 transition-colors hover:bg-indigo-500/20 hover:text-indigo-400">
            View all activity
          </button>
        </div>
      </div>

      {/* Danger Zone (kept minimal at the bottom for functionality) */}
      {permissions.canArchiveDelete && (
        <div className="mt-4 flex items-center gap-2 opacity-50 transition-opacity hover:opacity-100">
          <button
            onClick={() => setShowArchive(true)}
            className="text-muted-foreground hover:text-foreground bg-card border-border hover:border-border/80 flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-[13px] font-medium"
          >
            <ArchiveX className="h-4 w-4" /> Archive
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="bg-card flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-500/20 py-2 text-[13px] font-medium text-red-500 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
          <ArchiveDialog
            open={showArchive}
            onOpenChange={setShowArchive}
            projectName={project.name}
            onConfirm={onArchive}
          />
          <DeleteDialog
            open={showDelete}
            onOpenChange={setShowDelete}
            projectName={project.name}
            onConfirm={onDelete}
          />
        </div>
      )}
    </div>
  );
}
