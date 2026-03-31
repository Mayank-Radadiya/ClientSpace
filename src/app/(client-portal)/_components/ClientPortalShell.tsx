/**
 * ClientPortalShell
 * -----------------
 * Acts as the core structural wrapper for the client portal experience.
 *
 * Responsibilities:
 *  - Provide sidebar state management via SidebarProvider
 *  - Render persistent client portal UI elements (background and sidebar)
 *  - Wrap the main page content inside a controlled layout container
 *
 * This component centralizes all client portal layout concerns,
 * ensuring consistent behavior and appearance across client-facing pages.
 */

"use client";

import type { ReactNode } from "react";
import ClientSidebar from "@/components/global/client-sidebar/ClientSidebar";
import { SidebarProvider } from "@/components/global/sidebar/components";
import MainContentWrapper from "./MainContentWrapper";

type Organization = {
  orgId: string;
  orgName: string;
  orgSlug: string;
  role: string;
};

type ClientPortalShellProps = {
  children: ReactNode;
  organizations: Organization[];
  currentOrgId: string;
  currentOrgName: string;
  currentRole: string;
};

export default function ClientPortalShell({
  children,
  organizations,
  currentOrgId,
  currentOrgName,
  currentRole,
}: ClientPortalShellProps) {
  return (
    <SidebarProvider>
      {/* Persistent client navigation sidebar */}
      <ClientSidebar
        organizations={organizations}
        currentOrgId={currentOrgId}
        currentOrgName={currentOrgName}
        currentRole={currentRole}
      />

      <div className="pointer-events-none fixed inset-0">
        {/* Top-right ambient glow */}
        <div className="absolute top-0 -right-40 h-[500px] w-[500px] rounded-full bg-violet-500/15 blur-[120px]" />

        {/* Bottom-left ambient glow */}
        <div className="absolute -bottom-20 -left-40 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px]" />

        {/* Center-left accent glow */}
        <div className="absolute top-1/3 left-1/4 h-[300px] w-[300px] rounded-full bg-cyan-500/8 blur-[80px]" />

        {/* Bottom-right accent glow */}
        <div className="absolute right-1/4 bottom-1/4 h-[350px] w-[350px] rounded-full bg-purple-500/10 blur-[90px]" />
      </div>

      {/* Main scrollable content area */}
      <MainContentWrapper>{children}</MainContentWrapper>
    </SidebarProvider>
  );
}
