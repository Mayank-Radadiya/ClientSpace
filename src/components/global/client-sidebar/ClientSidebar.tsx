/**
 * ClientSidebar Component
 * -----------------------
 * Client-facing portal sidebar navigation.
 *
 * Responsibilities:
 *  - Render sidebar for client portal with client-specific navigation
 *  - Reuse existing sidebar building blocks from team dashboard
 *  - Provide navigation to: Dashboard, Projects, Invoices, Files, Settings
 *
 * This component mirrors the team dashboard sidebar structure
 * but with client-appropriate navigation items.
 */

"use client";

import {
  SidebarBody,
  SidebarHeader,
  SidebarFooter,
  SidebarLink,
  SidebarNav,
  SidebarUserContainer,
} from "@/components/global/sidebar/components";
import { CLIENT_NAV_ITEMS } from "./Constants";
import { OrgDropdown } from "../org-switcher/OrgDropdown";

type Organization = {
  orgId: string;
  orgName: string;
  orgSlug: string;
  role: string;
};

type ClientSidebarProps = {
  organizations: Organization[];
  currentOrgId: string;
  currentOrgName: string;
  currentRole: string;
};

function ClientSidebar({
  organizations,
  currentOrgId,
  currentOrgName,
  currentRole,
}: ClientSidebarProps) {
  return (
    <SidebarBody>
      {/* Top branding section */}
      <SidebarHeader />

      {/* Organization switcher */}
      <div className="px-3 pb-3">
        <OrgDropdown
          organizations={organizations}
          currentOrgId={currentOrgId}
          currentOrgName={currentOrgName}
          currentRole={currentRole}
        />
      </div>

      {/* Main navigation section */}
      <SidebarNav title="Portal">
        {CLIENT_NAV_ITEMS.map((item) => (
          <SidebarLink key={item.href} {...item} />
        ))}
      </SidebarNav>

      {/* Footer actions */}
      <SidebarFooter>
        <SidebarUserContainer />
      </SidebarFooter>
    </SidebarBody>
  );
}

export default ClientSidebar;
