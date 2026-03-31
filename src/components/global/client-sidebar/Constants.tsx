/**
 * Client Portal Navigation Items
 * ------------------------------
 * Navigation configuration for client-facing portal.
 *
 * Clients have read-only access to their projects, invoices,
 * files, and profile settings.
 */

import {
  LayoutDashboard,
  FolderKanban,
  ReceiptText,
  FileText,
  Settings,
} from "lucide-react";

/**
 * CLIENT_NAV_ITEMS
 * ----------------
 * Array of navigation definitions for client portal sidebar.
 *
 * Each object represents one navigational destination:
 *  - label → Display name
 *  - href  → Route path (all under /client-portal)
 *  - icon  → Lucide icon component
 */
export const CLIENT_NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/client-portal",
    icon: <LayoutDashboard size={18} strokeWidth={1.7} />,
  },
  {
    label: "Projects",
    href: "/client-portal/projects",
    icon: <FolderKanban size={18} strokeWidth={1.7} />,
  },
  {
    label: "Invoices",
    href: "/client-portal/invoices",
    icon: <ReceiptText size={18} strokeWidth={1.7} />,
  },
  {
    label: "Files",
    href: "/client-portal/files",
    icon: <FileText size={18} strokeWidth={1.7} />,
  },
  {
    label: "Settings",
    href: "/client-portal/settings",
    icon: <Settings size={18} strokeWidth={1.7} />,
  },
];
