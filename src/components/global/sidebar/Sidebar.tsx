/**
 * Sidebar Component
 * -----------------
 * Composes the complete application sidebar by assembling
 * all sidebar building blocks together.
 *
 * Responsibilities:
 *  - Render the sidebar layout (header, navigation, footer)
 *  - Map navigation configuration into sidebar links
 *  - Integrate upgrade CTA and user account section
 *
 * This component acts as the final composition layer
 * for the sidebar system.
 */

"use client";

import {
  SidebarBody,
  SidebarHeader,
  SidebarFooter,
  SidebarLink,
  SidebarNav,
  UpgradeProButton,
  NAV_ITEMS,
  NAV_SECONDARY_ITEMS,
  SidebarUserContainer,
} from "./components";
import { OrgDropdown } from "../org-switcher/OrgDropdown";

type Organization = {
  orgId: string;
  orgName: string;
  orgSlug: string;
  role: string;
};

type SidebarProps = {
  organizations: Organization[];
  currentOrgId: string;
  currentOrgName: string;
  currentRole: string;
};

function Sidebar({
  organizations,
  currentOrgId,
  currentOrgName,
  currentRole,
}: SidebarProps) {
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
      <SidebarNav title="Main">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.href} {...item} />
        ))}
      </SidebarNav>

      {/* Divider */}
      <div className="mx-3 h-px bg-border/50" />

      {/* Secondary navigation: analytics, activity, settings */}
      <SidebarNav title="More">
        {NAV_SECONDARY_ITEMS.map((item) => (
          <SidebarLink key={item.href} {...item} />
        ))}
      </SidebarNav>

      {/* Footer actions */}
      <SidebarFooter>
        <UpgradeProButton />
        <SidebarUserContainer />
      </SidebarFooter>
    </SidebarBody>
  );
}

export default Sidebar;
