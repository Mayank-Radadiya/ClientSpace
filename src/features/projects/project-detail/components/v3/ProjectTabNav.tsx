"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ActiveSection } from "../../types";
import { useState } from "react";
import {
  Flag,
  FolderOpen,
  ReceiptText,
  Activity,
} from "lucide-react";

interface Tab {
  id: ActiveSection;
  label: string;
  icon: typeof Flag;
  count?: number;
  hasUnread?: boolean;
  accent?: string;
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

import { cn } from "@/lib/utils";

export function ProjectTabNav({
  activeTab,
  onTabChange,
  counts,
  unreadTabs,
  hideInvoices = false,
}: ProjectTabNavProps) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const allTabs: Tab[] = [
    {
      id: "milestones",
      label: "Milestones",
      icon: Flag,
      count: counts.milestones,
      hasUnread: unreadTabs?.has("milestones"),
      accent: "#6C63FF",
    },
    {
      id: "files",
      label: "Files & Assets",
      icon: FolderOpen,
      count: counts.files,
      hasUnread: unreadTabs?.has("files"),
      accent: "#00F5D4",
    },
    {
      id: "invoices",
      label: "Invoices",
      icon: ReceiptText,
      count: counts.invoices,
      hasUnread: unreadTabs?.has("invoices"),
      accent: "#F59E0B",
    },
    {
      id: "activity",
      label: "Activity",
      icon: Activity,
      count: counts.activity,
      hasUnread: unreadTabs?.has("activity"),
      accent: "#34D399",
    },
  ];

  const tabs = hideInvoices
    ? allTabs.filter((t) => t.id !== "invoices")
    : allTabs;

  return (
    <div className="w-full">
      <div className="relative mx-auto flex max-w-fit items-center rounded-2xl bg-white shadow-sm border border-black/5 p-1.5 dark:bg-[#0C0D14] dark:border-white/10">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          const accent = tab.accent ?? "#6C63FF";

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              className={cn(
                "relative z-10 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-300",
                isActive
                  ? "text-gray-900 dark:text-[#F4F4FF]"
                  : "text-gray-500 hover:text-gray-700 dark:text-[#F4F4FF]/50 dark:hover:text-[#F4F4FF]/80"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.span
                  layoutId="tab-active-bg"
                  className="absolute inset-0 z-0 rounded-[10px] bg-gray-100 shadow-sm dark:bg-white/10"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}

              <Icon
                className="relative z-10 h-4 w-4 flex-shrink-0 transition-colors duration-200"
                style={{ color: isActive ? accent : "inherit" }}
              />

              <span className="relative z-10 hidden sm:block">{tab.label}</span>

              {/* Count badge */}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={cn(
                    "relative z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
                    !isActive && "bg-black/5 text-gray-500 dark:bg-white/10 dark:text-white/40"
                  )}
                  style={{
                    background: isActive ? `${accent}25` : undefined,
                    color: isActive ? accent : undefined,
                  }}
                >
                  {tab.count}
                </span>
              )}

              {/* Unread dot */}
              {tab.hasUnread && !isActive && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative z-10 inline-block rounded-full"
                  style={{
                    width: 5,
                    height: 5,
                    background: accent,
                    boxShadow: `0 0 6px ${accent}`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
