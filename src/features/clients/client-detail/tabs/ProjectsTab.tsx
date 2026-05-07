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

type Project = { id: string; name: string; status: string; updatedAt: Date | null };

type ProjectsTabProps = {
  clientId: string;
  query: { data?: Project[] | null; isLoading?: boolean };
};

export function ProjectsTab({ query }: ProjectsTabProps) {
  const projects = query.data ?? [];

  if (query.isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>;
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16">
        <p className="text-[13px] font-medium text-muted-foreground font-[var(--font-data)]">No projects yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-[rgba(255,255,255,0.01)]">
            <th className="px-5 py-3 text-left text-[9px] font-bold tracking-[0.22em] text-muted-foreground uppercase font-[var(--font-data)]">Project</th>
            <th className="px-5 py-3 text-left text-[9px] font-bold tracking-[0.22em] text-muted-foreground uppercase font-[var(--font-data)]">Status</th>
            <th className="px-5 py-3 text-left text-[9px] font-bold tracking-[0.22em] text-muted-foreground uppercase font-[var(--font-data)]">Updated</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => {
            const s = STATUS_COLOR[p.status] ?? { text: "text-muted-foreground", bg: "bg-muted/30" };
            const updatedStr = p.updatedAt ? (p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt) : null;
            return (
              <tr key={p.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                <td className="px-5 py-3 text-[13px] font-medium text-foreground font-[var(--font-data)]">{p.name}</td>
                <td className="px-5 py-3">
                  <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase font-[var(--font-data)]", s.text, s.bg)}>
                    {p.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-5 py-3 text-[11px] text-muted-foreground font-[var(--font-data)]">{formatRelative(updatedStr)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
