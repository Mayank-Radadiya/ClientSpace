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

function ActorAvatar({ name }: { name: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const colors = ["#3B6FF0", "#3DAA72", "#C47F2A", "#E05C5C", "#8B5CF6"];
  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
      style={{ background: colors[name.length % colors.length], color: "#fff", fontFamily: "var(--font-data)", fontSize: 9, fontWeight: 600 }}
      title={name}>{initials}</div>
  );
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
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "var(--pd-text-primary)" }}>Activity Log</h2>
      </div>

      {/* Filter chips */}
      <div className="mb-5 flex gap-2">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="rounded-md px-3 py-1 transition-colors"
            style={{
              background: filter === f.id ? "var(--pd-accent-subtle)" : "transparent",
              color: filter === f.id ? "var(--pd-accent)" : "var(--pd-text-secondary)",
              border: `1px solid ${filter === f.id ? "var(--pd-accent)" : "var(--pd-border)"}`,
              fontFamily: "var(--font-data)", fontSize: 12, borderRadius: 6,
            }}
            onMouseEnter={(e) => { if (filter !== f.id) e.currentTarget.style.borderColor = "var(--pd-accent)"; }}
            onMouseLeave={(e) => { if (filter !== f.id) e.currentTarget.style.borderColor = "var(--pd-border)"; }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative pl-8">
        {/* Vertical rail — 2px, accent-blue at 20% */}
        <div className="absolute top-1 bottom-1 left-[11px]"
          style={{ width: 2, background: "rgba(59,111,240,0.2)" }} />

        <div className="flex flex-col gap-0">
          {filtered.map((entry, i) => {
            const isRecent = i < 3;
            return (
              <div key={entry.id} className="relative flex items-start gap-3" style={{ padding: "12px 0" }}>
                {/* Node circle — 8px */}
                <div className="absolute top-[18px] z-10 flex items-center justify-center rounded-full"
                  style={{
                    left: -22, width: 8, height: 8,
                    background: isRecent ? dotColor(entry.color) : "var(--pd-text-muted)",
                    boxShadow: `0 0 0 3px var(--pd-body)`,
                  }} />

                {/* Actor avatar — 24px */}
                <ActorAvatar name={entry.actor} />

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span style={{ fontFamily: "var(--font-data)", fontSize: 12, color: "var(--pd-text-primary)", fontWeight: 500 }}>
                        {entry.actor}
                      </span>
                      <span style={{ fontFamily: "var(--font-data)", fontSize: 12, color: "var(--pd-text-muted)", marginLeft: 6 }}>
                        {entry.description}
                      </span>
                    </div>
                    <span style={{ fontFamily: "var(--font-data)", fontSize: 11, color: "var(--pd-text-muted)", whiteSpace: "nowrap" }}
                      title={new Date(entry.timestamp).toLocaleString()}>
                      {timeAgo(entry.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
