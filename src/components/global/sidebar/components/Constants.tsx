/**
 * Sidebar Navigation Items
 * -----------------------
 * Central configuration for primary application navigation.
 *
 * This file defines all sidebar menu entries in a structured format,
 * allowing UI components to render navigation consistently without
 * hardcoding routes or labels.
 */

import {
  LayoutDashboard,
  FolderKanban,
  Users,
  ReceiptText,
  Settings,
} from "lucide-react";

/**
 * NAV_ITEMS
 * ---------
 * Array of navigation definitions used by the sidebar.
 *
 * Each object represents one navigational destination and includes:
 *  - label → Human-readable name shown in the UI
 *  - href  → Route path used for navigation
 *  - icon  → Visual indicator to improve recognition and UX
 */
export const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={18} strokeWidth={1.7} />,
  },
  {
    label: "Projects",
    href: "/projects",
    icon: <FolderKanban size={18} strokeWidth={1.7} />,
  },
  {
    label: "Clients",
    href: "/clients",
    icon: <Users size={18} strokeWidth={1.7} />,
  },
  {
    label: "Invoices",
    href: "/invoices",
    icon: <ReceiptText size={18} strokeWidth={1.7} />,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings size={18} strokeWidth={1.7} />,
  },
];
