"use client";

import { cn } from "@/lib/utils";
import { formatRelative } from "../../utils/formatters";

const STATUS_COLOR: Record<string, { text: string; bg: string }> = {
  not_started: { text: "text-[#6B6B7E]", bg: "bg-[rgba(107,107,126,0.1)]" },
  in_progress: { text: "text-[#4F7FFF]", bg: "bg-[rgba(79,127,255,0.1)]" },
  review: { text: "text-[#F59E0B]", bg: "bg-[rgba(245,158,11,0.1)]" },
  completed: { text: "text-[#22C55E]", bg: "bg-[rgba(34,197,94,0.1)]" },
  on_hold: { text: "text-[#F59E0B]", bg: "bg-[rgba(245,158,11,0.08)]" },
  archived: { text: "text-[#3D3D4E]", bg: "bg-[rgba(61,61,78,0.1)]" },
};

type Project = {
  id: string;
  name: string;
  status: string;
  updatedAt: Date | null;
};

type ProjectsTabProps = {
  clientId: string;
  query: { data?: Project[] | null; isLoading?: boolean };
};

export function ProjectsTab({ query }: ProjectsTabProps) {
  const projects = query.data ?? [];

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted h-16 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="border-border bg-card flex flex-col items-center justify-center rounded-2xl border py-16">
        <p className="text-muted-foreground text-[13px] font-medium">
          No projects yet
        </p>
      </div>
    );
  }

  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border">
      <table className="w-full">
        <thead>
          <tr className="border-border border-b bg-[rgba(255,255,255,0.01)]">
            <th className="text-muted-foreground px-5 py-3 text-left text-[9px] font-bold tracking-[0.22em] uppercase">
              Project
            </th>
            <th className="text-muted-foreground px-5 py-3 text-left text-[9px] font-bold tracking-[0.22em] uppercase">
              Status
            </th>
            <th className="text-muted-foreground px-5 py-3 text-left text-[9px] font-bold tracking-[0.22em] uppercase">
              Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => {
            const s = STATUS_COLOR[p.status] ?? {
              text: "text-muted-foreground",
              bg: "bg-muted/30",
            };
            const updatedStr = p.updatedAt
              ? p.updatedAt instanceof Date
                ? p.updatedAt.toISOString()
                : p.updatedAt
              : null;
            return (
              <tr
                key={p.id}
                className="border-b border-[rgba(255,255,255,0.03)] transition-colors hover:bg-[rgba(255,255,255,0.02)]"
              >
                <td className="text-foreground px-5 py-3 text-[13px] font-medium">
                  {p.name}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase",
                      s.text,
                      s.bg,
                    )}
                  >
                    {p.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="text-muted-foreground px-5 py-3 text-[11px]">
                  {formatRelative(updatedStr)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
