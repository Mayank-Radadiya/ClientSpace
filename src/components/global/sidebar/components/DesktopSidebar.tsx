/**
 * DesktopSidebar Component
 * -----------------------
 * Desktop-only animated sidebar container.
 *
 * Responsibilities:
 *  - Render a fixed sidebar on the left for desktop screens
 *  - Animate width expansion/collapse based on sidebar state
 *  - React to hover interactions (open on hover, collapse on leave)
 *  - Provide a styled container for navigation and sidebar content
 *
 * The sidebar state (open / animate) is controlled via SidebarContext,
 * keeping layout logic centralized and consistent across the app.
 */

"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

interface DesktopSidebarProps
  extends React.ComponentProps<typeof motion.aside> {}

export const DesktopSidebar = ({
  className,
  children,
  ...rest
}: DesktopSidebarProps) => {
  /**
   * Sidebar state from context
   * --------------------------
   * open     → whether sidebar is currently expanded
   * setOpen  → updates open state (used on hover)
   * animate  → enables/disables width animation
   */
  const { open, setOpen, animate } = useSidebar();

  return (
    <motion.aside
      className={cn(
        // Base sidebar styles: fixed layout, glassmorphism, dark/light support
        "group/sidebar fixed left-0 top-0 z-40 hidden h-screen w-[280px] shrink-0 border-r border-neutral-200/50 bg-white/80 backdrop-blur-xl shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] transition-colors dark:border-neutral-800/50 dark:bg-neutral-950/80 md:flex overflow-hidden",
        className
      )}
      initial={false}
      animate={{
        /**
         * Width animation logic
         * ---------------------
         * - When animation is enabled:
         *     open   → full width (280px)
         *     closed → compact width (88px)
         * - When animation is disabled:
         *     always render full width
         */
        width: animate ? (open ? 280 : 88) : 280,

        /**
         * Shadow intensity changes slightly based on open state
         * to give better visual depth feedback.
         */
        boxShadow: open
          ? "0 0 60px -15px rgba(0,0,0,0.15)"
          : "0 0 40px -15px rgba(0,0,0,0.1)",
      }}
      transition={{
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
        width: { duration: 0.35 },
      }}
      /**
       * Hover behavior
       * --------------
       * - Expands sidebar on mouse enter
       * - Collapses sidebar on mouse leave
       * This creates an intuitive, low-effort navigation experience.
       */
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...rest}
    >
      {/* Animated vertical border glow shown when sidebar is open */}
      <motion.div
        className="absolute right-0 top-0 bottom-0 w-px bg-linear-to-b from-transparent via-primary/20 to-transparent pointer-events-none"
        initial={{ opacity: 0, scaleY: 0.5 }}
        animate={{ opacity: open ? 1 : 0, scaleY: open ? 1 : 0.5 }}
        transition={{ duration: 0.4 }}
      />

      {/* Sidebar content container */}
      <div className="relative flex h-full w-full flex-col gap-6 px-4 py-6">
        {children as ReactNode}
      </div>
    </motion.aside>
  );
};
