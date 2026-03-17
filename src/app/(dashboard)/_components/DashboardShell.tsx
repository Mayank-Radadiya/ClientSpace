/**
 * WorkspaceShell
 * --------------
 * Acts as the core structural wrapper for the workspace experience.
 *
 * Responsibilities:
 *  - Provide sidebar state management via SidebarProvider
 *  - Render persistent workspace UI elements (background and sidebar)
 *  - Wrap the main page content inside a controlled layout container
 *
 * This component centralizes all workspace-level layout concerns,
 * ensuring consistent behavior and appearance across workflow pages.
 */

"use client";

import type { ReactNode } from "react";
import Sidebar from "@/components/global/sidebar/Sidebar";
import { SidebarProvider } from "@/components/global/sidebar/components";
import MainContentWrapper from "./MainContentWrapper";

export default function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      {/* Persistent navigation sidebar */}
      <Sidebar />

      {/* Main scrollable content area */}
      <MainContentWrapper>{children}</MainContentWrapper>
    </SidebarProvider>
  );
}
