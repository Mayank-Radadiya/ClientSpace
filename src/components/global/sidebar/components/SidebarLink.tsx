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
 *  - Prefetch primary query for each route on hover for instant navigation
 *
 * This component is memoized to minimize unnecessary re-renders.
 */

"use client";

import { memo, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";
import { trpc } from "@/lib/trpc/client";

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
   * tRPC utilities for prefetching
   */
  const utils = trpc.useUtils();

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

  /**
   * Prefetch on hover
   * -----------------
   * When the user hovers over a sidebar link, we prefetch the primary query
   * for that route. This means by the time they click, the data is already
   * in the React Query cache and the page renders instantly.
   *
   * We skip prefetch if the link is already active (data is already loaded).
   * Each prefetch respects the existing cache — if data is already fresh,
   * no network request is made.
   */
  const handleMouseEnter = useCallback(() => {
    if (isActive) return; // Already on this page, data is loaded

    switch (href) {
      case "/dashboard":
        void utils.dashboard.getMetrics.prefetch();
        void utils.dashboard.getRecentProjects.prefetch();
        break;
      case "/projects":
        void utils.project.getBootstrap.prefetch({
          search: "",
          status: [],
          priority: [],
          limit: 50,
        });
        break;
      case "/clients":
        void utils.clients.getBootstrap.prefetch();
        break;
      case "/invoices":
        void utils.invoice.getAll.prefetch({ status: undefined });
        break;
      // /settings — no heavy query to prefetch
    }
  }, [href, isActive, utils]);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 },
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full"
    >
      <Link
        href={href}
        className="block w-full outline-offset-2"
        onMouseEnter={handleMouseEnter}
      >
        <div
          className={cn(
            "group relative flex h-[44px] w-full items-center gap-3 rounded-[10px] px-3 text-[13px] transition-all duration-200",
            isActive
              ? "bg-[rgba(59,111,239,0.06)] font-bold text-[#0D0D14] dark:bg-[rgba(79,127,255,0.08)] dark:text-[#F2F2F5]"
              : "text-[#6B6B7E] hover:bg-black/5 hover:text-[#0D0D14] dark:hover:bg-white/5 dark:hover:text-[#F2F2F5]",
            className,
          )}
        >
          {/* Active state inside left border */}
          {isActive && (
            <span className="absolute top-1/2 left-0 h-[60%] w-[2px] -translate-y-1/2 rounded-r-full bg-[#3B6FEF] dark:bg-[#4F7FFF]" />
          )}

          {/* Icon container */}
          <span
            className={cn(
              "flex h-[24px] w-[24px] shrink-0 items-center justify-center transition-all duration-200",
              isActive
                ? "text-[#3B6FEF] dark:text-[#4F7FFF]"
                : "text-[#6B6B7E] group-hover:text-[#0D0D14] dark:group-hover:text-[#F2F2F5]",
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
