"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Milestone } from "../../types";

interface MilestoneListViewProps {
  milestones: Milestone[];
  onUpdateMilestone: (id: string, updates: Partial<Milestone>) => void;
  onMilestoneClick: (milestone: Milestone) => void;
}

type SortKey = "title" | "status" | "priority" | "due_date";
type SortDir = "asc" | "desc";

const STATUS_LABEL: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const STATUS_ORDER: Record<string, number> = {
  todo: 0,
  in_progress: 1,
  done: 2,
};
const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function deriveStatus(m: Milestone): string {
  if (m.status) return m.status;
  return m.completed ? "done" : "todo";
}

export function MilestoneListView({
  milestones,
  onUpdateMilestone,
  onMilestoneClick,
}: MilestoneListViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>("due_date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    const copy = [...milestones];
    const dir = sortDir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      switch (sortKey) {
        case "title":
          return a.title.localeCompare(b.title) * dir;
        case "status": {
          const sa = STATUS_ORDER[deriveStatus(a)] ?? 0;
          const sb = STATUS_ORDER[deriveStatus(b)] ?? 0;
          return (sa - sb) * dir;
        }
        case "priority": {
          const pa = PRIORITY_ORDER[a.priority ?? "low"] ?? 2;
          const pb = PRIORITY_ORDER[b.priority ?? "low"] ?? 2;
          return (pa - pb) * dir;
        }
        case "due_date": {
          const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          return (da - db) * dir;
        }
        default:
          return 0;
      }
    });
    return copy;
  }, [milestones, sortKey, sortDir]);

  const SortIndicator = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return (
      <span className="text-primary ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
    );
  };

  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead
              className="text-foreground/70 cursor-pointer"
              onClick={() => toggleSort("title")}
            >
              Title <SortIndicator col="title" />
            </TableHead>
            <TableHead className="text-foreground/70">Assignee</TableHead>
            <TableHead
              className="text-foreground/70 cursor-pointer"
              onClick={() => toggleSort("status")}
            >
              Status <SortIndicator col="status" />
            </TableHead>
            <TableHead
              className="text-foreground/70 cursor-pointer"
              onClick={() => toggleSort("priority")}
            >
              Priority <SortIndicator col="priority" />
            </TableHead>
            <TableHead
              className="text-foreground/70 cursor-pointer"
              onClick={() => toggleSort("due_date")}
            >
              Due <SortIndicator col="due_date" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((m) => {
            const status = deriveStatus(m);
            return (
              <TableRow
                key={m.id}
                className="border-border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onMilestoneClick(m)}
              >
                <TableCell className="text-foreground text-[13px] font-medium">
                  {m.title}
                </TableCell>
                <TableCell>
                  {m.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={m.assignee.avatar_url || ""} />
                        <AvatarFallback className="text-[8px]">
                          {m.assignee.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-foreground/70 text-[12px]">
                        {m.assignee.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-[12px]">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      status === "done"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : status === "in_progress"
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-foreground/70"
                    }`}
                  >
                    {STATUS_LABEL[status] || status}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`text-[12px] ${
                      m.priority === "high"
                        ? "text-red-400"
                        : m.priority === "medium"
                          ? "text-amber-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    {m.priority
                      ? m.priority.charAt(0).toUpperCase() + m.priority.slice(1)
                      : "—"}
                  </span>
                </TableCell>
                <TableCell className="text-foreground/70 text-[12px]">
                  {m.due_date ? format(new Date(m.due_date), "MMM d") : "—"}
                </TableCell>
              </TableRow>
            );
          })}
          {sorted.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-muted-foreground py-12 text-center text-[13px]"
              >
                No milestones yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
