"use client";

import type { ActiveSection } from "../../types";

interface Tab {
  id: ActiveSection;
  label: string;
  count?: number;
}

interface ProjectTabNavProps {
  activeTab: ActiveSection;
  onTabChange: (tab: ActiveSection) => void;
  counts: {
    milestones: number;
    files: number;
    invoices: number;
    activity: number;
  };
}

export function ProjectTabNav({
  activeTab,
  onTabChange,
  counts,
}: ProjectTabNavProps) {
  const tabs: Tab[] = [
    { id: "milestones", label: "Milestones", count: counts.milestones },
    { id: "files", label: "Files & Assets", count: counts.files },
    { id: "invoices", label: "Invoices", count: counts.invoices },
    { id: "activity", label: "Activity Log", count: counts.activity },
  ];

  return (
    <div
      className="pd-animate-fade-up w-full px-8"
      style={{
        background: "var(--pd-body)",
        animationDelay: "280ms",
      }}
    >
      {/* Full-width bottom border line */}
      <div style={{ borderBottom: "1px solid var(--pd-divider)" }}>
        <div className="flex" style={{ gap: 24 }}>
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative transition-colors"
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: 13,
                  color: isActive
                    ? "var(--pd-text-primary)"
                    : "var(--pd-text-muted)",
                  fontWeight: isActive ? 500 : 400,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 2px",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.color = "var(--pd-text-secondary)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    e.currentTarget.style.color = "var(--pd-text-muted)";
                }}
              >
                <span className="flex items-center" style={{ gap: 6 }}>
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className="inline-flex items-center justify-center rounded-full"
                      style={{
                        background: isActive
                          ? "var(--pd-accent-subtle)"
                          : "var(--pd-accent-subtle)",
                        color: "var(--pd-accent)",
                        fontFamily: "var(--font-data)",
                        fontSize: 10,
                        fontWeight: 600,
                        lineHeight: 1,
                        height: 18,
                        minWidth: 18,
                        padding: "0 5px",
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </span>

                {/* Active underline — 2px blue */}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 rounded-full"
                    style={{
                      height: 2,
                      background: "var(--pd-accent)",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
