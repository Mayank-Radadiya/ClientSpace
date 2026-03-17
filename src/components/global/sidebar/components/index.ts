/**
 * Sidebar Module Public API
 * -------------------------
 * Central export file for all sidebar-related components, hooks, and constants.
 *
 * This file defines the public surface of the Sidebar module by re-exporting:
 *  - Context and provider utilities
 *  - Core sidebar layout components
 *  - Individual sidebar building blocks
 *  - Shared constants
 *
 * Consumers of the sidebar system should import exclusively from this file
 * to maintain clean and consistent import paths.
 */

// Context and Provider
export { SidebarContext, useSidebar, SidebarProvider } from "./SidebarContext";
export type { SidebarContextValue } from "./SidebarContext";

// Main Sidebar Component
export { SidebarFn } from "./SidebarFn";

// Sidebar Body Components
export { SidebarBody } from "./SidebarBody";
export { DesktopSidebar } from "./DesktopSidebar";
export { MobileSidebar } from "./MobileSidebar";

// Sidebar Building Blocks
export { SidebarHeader } from "./SidebarHeader";
export { SidebarNav } from "./SidebarNav";
export { SidebarLink } from "./SidebarLink";
export { SidebarFooter } from "./SidebarFooter";
export { UpgradeProButton } from "./UpgradeProButton";
export { SidebarUserContainer } from "./SidebarUserContainer";

// Constants
export { NAV_ITEMS } from "./Constants";
