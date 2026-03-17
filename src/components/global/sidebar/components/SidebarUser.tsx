/**
 * SidebarUser Component
 * --------------------
 * Displays the authenticated user's profile summary inside the sidebar.
 *
 * Responsibilities:
 *  - Render user avatar with graceful fallback
 *  - Show user name and email when sidebar is expanded
 *  - Provide a logout action with visual feedback
 *  - Adapt layout and animations based on sidebar state
 *
 * This component is memoized to reduce unnecessary re-renders.
 */

"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogOut } from "lucide-react";
import { useSidebar } from "./SidebarContext";
import Image from "next/image";

interface SidebarUserProps {
  name: string | null;
  email: string | null;
  image: string | null;
  onLogout: () => void;
}

export const SidebarUser = memo(function SidebarUser({
  name,
  email,
  image,
  onLogout,
}: SidebarUserProps) {
  /**
   * Sidebar context state
   * ---------------------
   * open    → sidebar expanded
   * animate → whether animations are enabled
   */
  const { open, animate } = useSidebar();

  /**
   * Determines whether user details should be visible.
   * - Always visible when animations are disabled
   * - Visible only when sidebar is expanded otherwise
   */
  const showInfo = !animate || open;

  /**
   * Avatar fallback logic
   * ---------------------
   * Uses the first letter of the user's name.
   * Defaults to "U" if name is unavailable.
   */
  const avatarFallback = name?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <motion.div
      layout
      className="bg-background relative flex items-center gap-3 rounded-xl border border-neutral-200/60 px-2 py-2 dark:border-neutral-800"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* Avatar */}
      <motion.div
        className="bg-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
        whileHover={{ scale: 1.08 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {image ? (
          <Image
            src={image || ""}
            width={40}
            height={40}
            alt={name ?? "User"}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          avatarFallback
        )}
      </motion.div>

      {/* User Information (name & email) */}
      <AnimatePresence initial={false}>
        {showInfo && (
          <motion.div
            key="info"
            className="flex-1 overflow-hidden"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.2 }}
          >
            <p className="truncate text-sm font-medium">{name ?? "User"}</p>
            <p className="text-muted-foreground truncate text-xs">{email}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Button */}
      <AnimatePresence initial={false}>
        {showInfo && (
          <motion.button
            key="logout"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.15 }}
            onClick={onLogout}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex h-8 w-8 items-center justify-center rounded-md"
            title="Logout"
          >
            <LogOut size={16} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
