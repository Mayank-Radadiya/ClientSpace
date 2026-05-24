"use client";

// src/features/projects/project-detail/components/v3/ProjectTabNav.tsx
// Tab navigation with count badges and unread dot indicators.

import { motion } from "framer-motion";
import type { ActiveSection } from "../../types";

interface Tab {
  id: ActiveSection;
  label: string;
  count?: number;
  hasUnread?: boolean;
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
  unreadTabs?: Set<string>;
  hideInvoices?: boolean;
}

export function ProjectTabNav({
  activeTab,
  onTabChange,
  counts,
  unreadTabs,
  hideInvoices = false,
}: ProjectTabNavProps) {
  const allTabs: Tab[] = [
    {
      id: "milestones",
      label: "Milestones",
      count: counts.milestones,
      hasUnread: unreadTabs?.has("milestones"),
    },
    {
      id: "files",
      label: "Files & Assets",
      count: counts.files,
      hasUnread: unreadTabs?.has("files"),
    },
    {
      id: "invoices",
      label: "Invoices",
      count: counts.invoices,
      hasUnread: unreadTabs?.has("invoices"),
    },
    {
      id: "activity",
      label: "Activity Log",
      count: counts.activity,
      hasUnread: unreadTabs?.has("activity"),
    },
  ];

  const tabs = hideInvoices
    ? allTabs.filter((t) => t.id !== "invoices")
    : allTabs;

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

                  {/* Count badge */}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className="inline-flex items-center justify-center rounded-full"
                      style={{
                        background: "var(--pd-accent-subtle)",
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

                  {/* Unread dot — teal, 6px, animated */}
                  {tab.hasUnread && !isActive && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                        duration: 0.15,
                      }}
                      className="inline-block rounded-full"
                      style={{
                        width: 6,
                        height: 6,
                        background: "var(--pd-accent)",
                        flexShrink: 0,
                      }}
                      aria-label="New activity"
                    />
                  )}
                </span>

                {/* Active underline — 2px accent */}
                {isActive && (
                  <motion.span
                    className="absolute bottom-0 left-0 right-0 rounded-full"
                    style={{
                      height: 2,
                      background: "var(--pd-accent)",
                    }}
                    layoutId="tab-underline"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
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
