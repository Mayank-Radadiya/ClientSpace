/**
 * UpgradeProButton Component
 * -------------------------
 * Renders a visually prominent call-to-action inside the sidebar
 * that encourages users to upgrade to the Pro plan.
 *
 * Responsibilities:
 *  - Display a premium-themed upgrade button
 *  - Adapt content visibility based on sidebar open/collapsed state
 *  - Provide smooth hover, tap, and enter/exit animations
 *
 * This component is memoized to prevent unnecessary re-renders
 * when sidebar state has not changed.
 */

"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown } from "lucide-react";
import Link from "next/link";
import { useSidebar } from "./SidebarContext";
import { cn } from "@/lib/utils";

export const UpgradeProButton = memo(() => {
  /**
   * Sidebar context state
   * ---------------------
   * open    → whether sidebar is expanded
   * animate → whether sidebar animations are enabled
   */
  const { open, animate } = useSidebar();

  /**
   * Determines whether descriptive text should be shown.
   * - Always shown when animations are disabled
   * - Shown only when sidebar is expanded otherwise
   */
  const isExpanded = !animate || open;

  return (
    <Link href="/#">
      <motion.div
        whileHover={{ scale: 1.02 }} // Subtle emphasis on hover
        whileTap={{ scale: 0.98 }} // Press feedback
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className={cn(
          // Base container styling with premium gradient
          "relative flex items-center gap-3 rounded-xl px-2 py-2.5",
          "bg-linear-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10",
          "dark:from-violet-500/15 dark:via-purple-500/15 dark:to-fuchsia-500/15",
          "border border-amber-500/20 dark:border-purple-500/20",
        )}
      >
        {/* Icon container */}
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-amber-400 via-orange-500 to-yellow-500 text-white shadow-sm dark:from-violet-500 dark:via-purple-500 dark:to-fuchsia-500">
          <Crown size={18} />
        </span>

        {/* Descriptive text */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -6 }} // Slide in from left
              animate={{ opacity: 1, x: 0 }} // Fully visible
              exit={{ opacity: 0, x: -6 }} // Slide out on collapse
              transition={{ duration: 0.2 }}
              className="flex flex-col overflow-hidden"
            >
              <span className="text-sm font-semibold whitespace-nowrap text-amber-700 dark:text-purple-300">
                Upgrade to Pro
              </span>
              <span className="text-[11px] whitespace-nowrap text-amber-600/70 dark:text-purple-300/70">
                Unlock all features
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );
});
