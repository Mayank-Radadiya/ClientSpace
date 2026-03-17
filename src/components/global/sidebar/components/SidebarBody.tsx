/**
 * SidebarBody Component
 * --------------------
 * Responsive wrapper that renders the appropriate sidebar
 * implementation based on screen size.
 *
 * This component:
 *  - Renders DesktopSidebar for larger screens
 *  - Renders MobileSidebar for smaller screens
 *  - Shares the same children and animation props across both
 *
 * It acts as a layout bridge between desktop and mobile sidebar variants.
 */

"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileSidebar } from "./MobileSidebar";

export const SidebarBody = (
  props: Omit<React.ComponentProps<typeof motion.div>, "children"> & {
    children?: ReactNode;
  }
) => {
  const { children, ...rest } = props;

  return (
    <>
      {/* Desktop sidebar (visible on medium and larger screens) */}
      <DesktopSidebar {...(rest as React.ComponentProps<typeof motion.aside>)}>
        {children}
      </DesktopSidebar>

      {/* Mobile sidebar (visible on small screens) */}
      <MobileSidebar {...(rest as React.ComponentProps<"div">)}>
        {children}
      </MobileSidebar>
    </>
  );
};
