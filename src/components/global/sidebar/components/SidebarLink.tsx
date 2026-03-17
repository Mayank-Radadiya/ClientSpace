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
      <Link href={href} className="block w-full outline-offset-2">
        <div
          className={cn(
            "group relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
            isActive
              ? "bg-primary/5 text-primary border-primary/20 dark:border-primary/10 border shadow-sm"
              : "text-muted-foreground hover:text-foreground border border-transparent hover:bg-neutral-100/80 dark:hover:bg-neutral-800/50",
            className,
          )}
        >
          {/* Active state indicator */}
          {isActive && (
            <span className="bg-primary absolute top-1/2 left-[-1px] h-4 w-[3px] -translate-y-1/2 rounded-r-full" />
          )}

          {/* Icon container */}
          <span
            className={cn(
              "flex shrink-0 items-center justify-center transition-colors duration-200",
              isActive
                ? "text-primary"
                : "text-muted-foreground group-hover:text-foreground",
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
