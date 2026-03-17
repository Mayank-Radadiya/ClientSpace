/**
 * SidebarFooter Component
 * ----------------------
 * Renders the footer section of the sidebar.
 *
 * Responsibilities:
 *  - Display persistent footer content at the bottom of the sidebar
 *  - Provide a theme toggle control
 *  - Adapt its layout and animations based on sidebar open state
 *
 * This component reacts to sidebar context state to ensure
 * smooth UX when the sidebar is collapsed or expanded.
 */

"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";
import { ThemeToggleButton } from "../../ThemeToggleButton";

interface SidebarFooterProps {
  children: ReactNode;
  className?: string;
}

export const SidebarFooter = ({ children, className }: SidebarFooterProps) => {
  /**
   * Sidebar state
   * -------------
   * open    → whether sidebar is expanded
   * animate → whether width animations are enabled
   */
  const { open, animate } = useSidebar();

  /**
   * Toggle label visibility
   * -----------------------
   * - If animations are disabled → always show label
   * - If animations are enabled → show only when sidebar is open
   */
  const showToggle = !animate || open;

  return (
    <>
      <motion.div
        className={cn("mt-auto flex flex-col gap-4", className)}
        initial={false}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Theme toggle container */}
        <motion.div
          className="relative flex items-center justify-center gap-3 pt-3"
          initial={false}
        >
          {/* Animated horizontal divider */}
          <motion.div
            className="absolute top-0 right-0 left-0 h-px bg-linear-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />

          {/* Theme toggle button with interaction feedback */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="ml-2"
          >
            <ThemeToggleButton />
          </motion.div>

          {/* Theme label text */}
          <motion.span
            className="text-sm font-medium whitespace-nowrap text-neutral-500 dark:text-neutral-400"
            initial={false}
            animate={{
              width: showToggle ? "auto" : 0,
              opacity: showToggle ? 1 : 0,
              x: showToggle ? 0 : -10,
            }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            Change Theme
          </motion.span>
        </motion.div>

        {/* Additional footer content (user info, actions, etc.) */}
        {children}
      </motion.div>
    </>
  );
};
