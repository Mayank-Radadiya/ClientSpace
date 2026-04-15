"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronRight,
  MessageCircle,
  Pencil,
  Command,
  MoreHorizontal,
  Archive,
  Copy,
  FileDown,
  Link2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Project, ProjectMember } from "../../types";
import { ProjectPermissions } from "../../hooks/useProjectPermissions";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { formatStatus, getPriorityStyle } from "../../../utils/formatters";

interface CommandHeaderProps {
  project: Project;
  members: ProjectMember[];
  permissions: ProjectPermissions;
  onUpdate: (updates: Partial<Project>) => void;
  onToggleChat: () => void;
  onOpenCommandPalette: () => void;
  onOpenTeamPopover: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRoleColor(role?: string): string {
  switch (role) {
    case "owner":
      return "bg-primary";
    case "admin":
      return "bg-primary";
    case "client":
      return "bg-emerald-500";
    default:
      return "bg-muted text-muted-foreground";
  }
}

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-primary",
  review: "bg-primary",
  completed: "bg-emerald-500",
  on_hold: "bg-amber-500",
  archived: "bg-muted text-muted-foreground",
};

const PRIORITY_DOT_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-zinc-400",
};

export function CommandHeader({
  project,
  members,
  permissions,
  onUpdate,
  onToggleChat,
  onOpenCommandPalette,
  onOpenTeamPopover,
  onArchive,
  onDelete,
}: CommandHeaderProps) {
  const reduced = useReducedMotion();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  const handleNameSubmit = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== project.name) {
      onUpdate({ name: trimmed });
    } else {
      setEditName(project.name);
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleNameSubmit();
    if (e.key === "Escape") {
      setEditName(project.name);
      setIsEditingName(false);
    }
  };

  const clientName =
    project.client?.company_name || project.client?.contact_name || "No Client";

  const visibleMembers = members.slice(0, 4);
  const overflowCount = Math.max(0, members.length - 4);

  const priorityStyle = getPriorityStyle(project.priority);

  return (
    <motion.header
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-background/85 sticky top-0 z-50 flex h-16 w-full items-center justify-between gap-4 px-5 backdrop-blur-[20px]"
    >
      {/* Left side */}
      <div className="flex min-w-0 flex-col gap-0.5">
        {/* Breadcrumb + Name */}
        <div className="flex items-center gap-2">
          <Link
            href="/projects"
            className="text-foreground/45 hover:text-foreground/70 text-xs font-medium transition-colors"
          >
            Projects
          </Link>
          <ChevronRight className="text-muted-foreground h-3 w-3" />
          {isEditingName ? (
            <input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={handleNameKeyDown}
              className="border-primary text-foreground min-w-[120px] border-b-2 bg-transparent text-[15px] font-semibold outline-none"
            />
          ) : (
            <button
              onClick={() => permissions.canEdit && setIsEditingName(true)}
              className={`text-foreground max-w-[240px] truncate text-[15px] font-semibold ${permissions.canEdit ? "hover:text-foreground/70 cursor-pointer" : ""}`}
            >
              {project.name}
            </button>
          )}
        </div>

        {/* Status row */}
        <div className="flex items-center gap-2">
          <span
            className={`text-foreground inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[project.status] || "bg-muted text-muted-foreground"}`}
          >
            {formatStatus(project.status)}
          </span>
          <span
            className={`h-2 w-2 rounded-full ${PRIORITY_DOT_COLORS[project.priority] || "bg-muted"}`}
            title={priorityStyle.label}
          />
          <span className="text-muted-foreground text-[11px]">
            {clientName}
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Avatar cluster */}
        <TooltipProvider delayDuration={200}>
          <button
            onClick={onOpenTeamPopover}
            className="flex items-center -space-x-2 rounded-full p-0.5 transition-opacity hover:opacity-80"
            aria-label="View team members"
          >
            {visibleMembers.map((m) => (
              <Tooltip key={m.user_id}>
                <TooltipTrigger asChild>
                  <div
                    className={`border-background relative h-7 w-7 rounded-full border-2 ${getRoleColor(m.role)}`}
                  >
                    {m.user?.avatar_url ? (
                      <Avatar className="h-full w-full">
                        <AvatarImage src={m.user.avatar_url} />
                        <AvatarFallback className="text-foreground text-[9px]">
                          {getInitials(m.user?.name || "?")}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <span className="text-foreground flex h-full w-full items-center justify-center text-[9px] font-medium">
                        {getInitials(m.user?.name || "?")}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <span>{m.user?.name || "Unknown"}</span>
                  {m.role && (
                    <span className="text-foreground/70 ml-1">· {m.role}</span>
                  )}
                </TooltipContent>
              </Tooltip>
            ))}
            {overflowCount > 0 && (
              <div className="border-background bg-muted text-muted-foreground flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-medium">
                +{overflowCount}
              </div>
            )}
          </button>
        </TooltipProvider>

        {/* Discuss button */}
        <Button
          variant="default"
          size="sm"
          onClick={onToggleChat}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 gap-1.5 px-3 text-xs font-medium"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Discuss
        </Button>

        {/* Edit button */}
        {permissions.canEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="text-foreground/70 hover:bg-muted hover:text-foreground h-8 gap-1.5 px-3 text-xs"
            id="edit-project-trigger"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        )}

        {/* ⌘K button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenCommandPalette}
          className="text-muted-foreground hover:bg-muted hover:text-foreground h-8 gap-1 px-2.5 text-xs"
        >
          <Command className="h-3 w-3" />K
        </Button>

        {/* Overflow menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-muted hover:text-foreground h-8 w-8"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <Archive className="mr-2 h-4 w-4" /> Archive
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileDown className="mr-2 h-4 w-4" /> Export PDF
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(window.location.href)
              }
            >
              <Link2 className="mr-2 h-4 w-4" /> Copy link
            </DropdownMenuItem>
            {permissions.canArchiveDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-400 focus:text-red-400"
                  onClick={onDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}
