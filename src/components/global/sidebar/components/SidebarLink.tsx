/**
 * SidebarLink Component
 * --------------------
 * Renders a single navigational link inside the sidebar.
 *
 * Responsibilities:
 *  - Display icon and label for a navigation route
 *  - Highlight the active route based on the current pathname
 *  - Adapt label visibility based on sidebar open/collapsed state
 *  - Provide smooth hover and tap animations
 *
 * This component is memoized to minimize unnecessary re-renders.
 */

"use client";

import { memo } from "react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  className?: string;
}

export const SidebarLink = memo(function SidebarLink({
  href,
  label,
  icon,
  className,
}: SidebarLinkProps) {
  /**
   * Current route path
   * ------------------
   * Used to determine whether this link is active.
   */
  const pathname = usePathname();

  /**
   * Sidebar context state
   * ---------------------
   * open    → sidebar expanded
   * animate → whether animations are enabled
   */
  const { open, animate } = useSidebar();

  /**
   * Active route detection
   * ----------------------
   * - Exact match: pathname === href
   * - Nested match: /route/sub-route
   *
   * Prevents "/" from matching every route.
   */
  const isActive =
    pathname === href || (href !== "/" && pathname?.startsWith(href + "/"));

  /**
   * Label visibility logic
   * ----------------------
   * - Always visible when animations are disabled
   * - Visible only when sidebar is expanded otherwise
   */
  const showLabel = !animate || open;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 },
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full"
    >
      <Link href={href} className="mt-1 block w-full outline-offset-2">
        <div
          className={cn(
            "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-all duration-300 ease-out hover:scale-105",
            isActive
              ? "bg-primary/15 text-primary font-black tracking-wide shadow-[0_0_15px_rgba(255,255,255,0.05)] ring-1 ring-white/10"
              : "text-muted-foreground hover:text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800/60",
            className,
          )}
        >
          {/* Active state indicator */}
          {isActive && (
            <span className="bg-primary absolute top-1/2 left-0 h-9/10 w-0.5 -translate-y-1/2 rounded-r-full shadow-[0_0_8px_currentColor]" />
          )}

          {/* Icon container */}
          <span
            className={cn(
              "flex shrink-0 items-center justify-center transition-all duration-300 group-hover:scale-110",
              isActive
                ? "text-primary scale-110"
                : "text-muted-foreground group-hover:text-foreground opacity-70 group-hover:opacity-100",
            )}
          >
            {icon}
          </span>

          {/* Label text */}
          {showLabel && <span className="truncate">{label}</span>}
        </div>
      </Link>
    </motion.div>
  );
});