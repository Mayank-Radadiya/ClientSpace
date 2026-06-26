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
  FileSignature,
  Settings,
  BarChart3,
  Activity,
  Bell,
} from "lucide-react";

/**
 * NAV_ITEMS
 * ---------
 * Primary navigation destinations — shown prominently in the sidebar.
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
    label: "Contracts",
    href: "/contracts",
    icon: <FileSignature size={18} strokeWidth={1.7} />,
  },
];

/**
 * NAV_SECONDARY_ITEMS
 * -------------------
 * Secondary navigation — analytics, activity, notifications, settings.
 * Rendered below a divider in the sidebar.
 */
export const NAV_SECONDARY_ITEMS = [
  {
    label: "Analytics",
    href: "/analytics",
    icon: <BarChart3 size={18} strokeWidth={1.7} />,
  },
  {
    label: "Activity",
    href: "/activity",
    icon: <Activity size={18} strokeWidth={1.7} />,
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: <Bell size={18} strokeWidth={1.7} />,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings size={18} strokeWidth={1.7} />,
  },
];
