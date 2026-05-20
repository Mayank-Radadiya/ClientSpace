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
      className="pd-animate-fade-up flex w-full px-6"
      style={{
        background: "var(--pd-body)",
        animationDelay: "280ms",
      }}
    >
      <div
        className="flex gap-0"
        style={{ borderBottom: "1px solid var(--pd-divider)" }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative px-4 py-3 transition-colors"
              style={{
                fontFamily: "var(--font-data)",
                fontSize: 13,
                color: isActive
                  ? "var(--pd-text-primary)"
                  : "var(--pd-text-secondary)",
                fontWeight: isActive ? 500 : 400,
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  e.currentTarget.style.color = "var(--pd-text-primary)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  e.currentTarget.style.color = "var(--pd-text-secondary)";
              }}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1"
                    style={{
                      background: isActive
                        ? "var(--pd-accent)"
                        : "var(--pd-accent-subtle)",
                      color: isActive ? "#fff" : "var(--pd-accent)",
                      fontFamily: "var(--font-data)",
                      fontSize: 10,
                      fontWeight: 600,
                      lineHeight: 1,
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </span>

              {/* Active underline */}
              {isActive && (
                <span
                  className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                  style={{ background: "var(--pd-accent)" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
