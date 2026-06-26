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
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { PageTransition } from "@/components/PageTransition";
import { CommandPalette } from "@/components/global/CommandPalette";

type Organization = {
  orgId: string;
  orgName: string;
  orgSlug: string;
  role: string;
};

type WorkspaceShellProps = {
  children: ReactNode;
  organizations: Organization[];
  currentOrgId: string;
  currentOrgName: string;
  currentRole: string;
};

export default function WorkspaceShell({
  children,
  organizations,
  currentOrgId,
  currentOrgName,
  currentRole,
}: WorkspaceShellProps) {
  return (
    <SidebarProvider>
      {/* Persistent navigation sidebar */}
      <Sidebar
        organizations={organizations}
        currentOrgId={currentOrgId}
        currentOrgName={currentOrgName}
        currentRole={currentRole}
      />

      <div className="pointer-events-none fixed inset-0">
        {/* Ambient glows — using theme primary color */}
        <div
          className="absolute top-0 -right-40 h-[500px] w-[500px] rounded-full"
          style={{
            background: "color-mix(in oklab, var(--primary) 12%, transparent)",
            filter: "blur(120px)",
          }}
        />
        <div
          className="absolute -bottom-20 -left-40 h-[400px] w-[400px] rounded-full"
          style={{
            background: "color-mix(in oklab, var(--primary) 8%, transparent)",
            filter: "blur(100px)",
          }}
        />
      </div>

      {/* Main scrollable content area */}
      <MainContentWrapper
        headerActions={
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        }
      >
        <PageTransition>{children}</PageTransition>
      </MainContentWrapper>

      {/* Global command palette — Cmd+K / Ctrl+K */}
      <CommandPalette />
    </SidebarProvider>
  );
}
