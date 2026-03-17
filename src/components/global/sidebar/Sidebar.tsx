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
  SidebarUserContainer,
} from "./components";

function Sidebar() {
  return (
    <SidebarBody>
      {/* Top branding section */}
      <SidebarHeader />

      {/* Main navigation section */}
      <SidebarNav title="Main">
        {NAV_ITEMS.map((item) => (
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
