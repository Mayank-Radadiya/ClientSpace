"use client";

import { useState, useMemo } from "react";
import type { ActivityEntry } from "./sampleData";

type Category = "all" | "milestone" | "invoice" | "file" | "status" | "project";

const FILTERS: { id: Category; label: string }[] = [
  { id: "all", label: "All" },
  { id: "milestone", label: "Milestones" },
  { id: "invoice", label: "Invoices" },
  { id: "file", label: "Files" },
  { id: "status", label: "Status Changes" },
];

function dotColor(c: string): string {
  switch (c) {
    case "blue": return "var(--pd-accent)";
    case "green": return "var(--pd-status-done)";
    case "amber": return "var(--pd-status-warning)";
    case "red": return "var(--pd-status-overdue)";
    default: return "var(--pd-text-muted)";
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface ActivityLogTabProps {
  activity: ActivityEntry[];
}

export function ActivityLogTab({ activity }: ActivityLogTabProps) {
  const [filter, setFilter] = useState<Category>("all");

  const filtered = useMemo(() => {
    const sorted = [...activity].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (filter === "all") return sorted;
    return sorted.filter((a) => a.category === filter);
  }, [activity, filter]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--pd-text-primary)" }}>Activity Log</h2>
      </div>

      {/* Filter chips */}
      <div className="mb-5 flex gap-2">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="rounded-full px-3 py-1 transition-colors"
            style={{
              background: filter === f.id ? "var(--pd-accent-subtle)" : "transparent",
              color: filter === f.id ? "var(--pd-accent)" : "var(--pd-text-secondary)",
              border: `1px solid ${filter === f.id ? "var(--pd-accent)" : "var(--pd-border)"}`,
              fontFamily: "var(--font-data)", fontSize: 12,
            }}
            onMouseEnter={(e) => { if (filter !== f.id) e.currentTarget.style.borderColor = "var(--pd-accent)"; }}
            onMouseLeave={(e) => { if (filter !== f.id) e.currentTarget.style.borderColor = "var(--pd-border)"; }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute top-1 bottom-1 left-[11px] w-px" style={{ background: "var(--pd-divider)" }} />

        <div className="flex flex-col gap-0">
          {filtered.map((entry, i) => (
            <div key={entry.id} className="relative flex gap-3 pb-5">
              {/* Dot */}
              <div className="absolute left-[-17px] top-1.5 z-10 flex h-2 w-2 items-center justify-center rounded-full"
                style={{ background: dotColor(entry.color), boxShadow: `0 0 0 3px var(--pd-body)` }} />

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p style={{ fontFamily: "var(--font-data)", fontSize: 13, color: "var(--pd-text-primary)", lineHeight: 1.4 }}>
                  {entry.description}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span style={{ fontFamily: "var(--font-data)", fontSize: 11, color: "var(--pd-text-muted)" }}>
                    by {entry.actor}
                  </span>
                  <span style={{ fontFamily: "var(--font-data)", fontSize: 11, color: "var(--pd-text-muted)" }}
                    title={new Date(entry.timestamp).toLocaleString()}>
                    {timeAgo(entry.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
