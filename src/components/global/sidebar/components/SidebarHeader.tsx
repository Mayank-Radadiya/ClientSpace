/**
 * SidebarHeader Component
 * ----------------------
 * Renders the top section of the sidebar containing the application logo
 * and branding text.
 *
 * Responsibilities:
 *  - Display the app logo with interactive animations
 *  - Show or hide branding text based on sidebar state
 *  - React smoothly to sidebar expand/collapse transitions
 *
 * This component is memoized to avoid unnecessary re-renders when
 * sidebar state or props do not change.
 */

"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useSidebar } from "./SidebarContext";

export const SidebarHeader = memo(() => {
  /**
   * Sidebar context state
   * ---------------------
   * open    → whether sidebar is expanded
   * animate → whether sidebar animations are enabled
   */
  const { open, animate } = useSidebar();

  /**
   * Determines whether branding text should be visible.
   * - Always visible if animations are disabled
   * - Visible only when sidebar is expanded if animations are enabled
   */
  const showText = !animate || open;

  return (
    <Link href="/" className="flex items-center gap-3 px-3 py-2">
      {/* Logo container */}
      <motion.div
        className="bg-background/50 ring-border hover:ring-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-1 shadow-sm ring-1 transition-all hover:ring-1"
        whileHover={{ scale: 1.06 }} // Slight scale-up on hover
        whileTap={{ scale: 0.95 }} // Press-down effect on click
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Image
          src="/logo.svg"
          alt="FlowX logo"
          width={36}
          height={36}
          style={{ width: "auto", height: "auto" }}
          priority
        />
      </motion.div>

      {/* Branding text (conditionally rendered) */}
      <AnimatePresence initial={false}>
        {showText && (
          <motion.div
            initial={{ opacity: 0, x: -8 }} // Enter from left
            animate={{ opacity: 1, x: 0 }} // Fully visible
            exit={{ opacity: 0, x: -8 }} // Exit to left
            transition={{ duration: 0.25 }}
            className="absolute top-8 left-22 flex flex-col leading-tight"
          >
            <span className="text-lg font-bold tracking-tight">
              Flow
              <span className="text-primary ml-0.5 font-mono">X</span>
            </span>
            <span className="text-muted-foreground text-xs">
              Workflow platform
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
});
