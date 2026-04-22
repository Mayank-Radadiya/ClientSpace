/**
 * MainContentWrapper
 * ------------------
 * Controls the main content layout in relation to the sidebar state.
 *
 * Responsibilities:
 *  - Adjust horizontal spacing based on sidebar open/collapsed state
 *  - Animate layout shifts smoothly when the sidebar changes
 *  - Constrain content width and apply consistent padding
 *
 * This component ensures the main content always aligns correctly
 * with the sidebar without overlapping or layout jumps.
 */

"use client";

import type { ReactNode } from "react";
import { useSidebar } from "@/components/global/sidebar/components";
import { cn } from "@/lib/utils";

function MainContentWrapper({
  children,
  headerActions,
}: {
  children: React.ReactNode;
  headerActions?: ReactNode;
}) {
  /**
   * Sidebar state
   * -------------
   * open → indicates whether the sidebar is expanded or collapsed
   */
  const { open } = useSidebar();

  return (
    <main
      className={cn(
        // Base layout styles
        "h-full w-full transition-[padding] duration-300",

        // Dynamic left padding based on sidebar width
        // Expanded sidebar: 280px
        // Collapsed sidebar: 64px
        open ? "pl-[280px]" : "pl-[64px]",
      )}
    >
      {headerActions ? (
        <div className="pointer-events-none sticky top-0 z-30 flex justify-end px-6 pt-4">
          <div className="pointer-events-auto">{headerActions}</div>
        </div>
      ) : null}

      {/* Content container */}
      <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
    </main>
  );
}

export default MainContentWrapper;
