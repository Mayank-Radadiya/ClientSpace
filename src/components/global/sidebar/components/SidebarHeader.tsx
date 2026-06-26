/**
 * SidebarHeader Component
 * ----------------------
 * Renders the top section of the sidebar containing the application logo
 * and branding text.
 *
 * Responsibilities:
 *  - Display the app logo with interactive animations
 *  - Show or hide branding text based on sidebar state
 *  - React smoothly to sidebar expand/collapse transitions
 *  - Provide a Cmd+K search trigger button when sidebar is expanded
 *
 * This component is memoized to avoid unnecessary re-renders when
 * sidebar state or props do not change.
 */

"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { useSidebar } from "./SidebarContext";

export const SidebarHeader = memo(() => {
  /**
   * Sidebar context state
   * ---------------------
   * open    → whether sidebar is expanded
   * animate → whether sidebar animations are enabled
   */
  const { open, animate } = useSidebar();

  /**
   * Determines whether branding text should be visible.
   * - Always visible if animations are disabled
   * - Visible only when sidebar is expanded if animations are enabled
   */
  const showText = !animate || open;

  /**
   * Fires a synthetic Cmd+K keyboard event so the CommandPalette
   * listener picks it up, opening the palette from the sidebar button.
   */
  const openCommandPalette = () => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <Link href="/" className="flex items-center gap-3 px-1 py-2">
        {/* Logo container */}
        <motion.div
          className="bg-background/50 ring-border hover:ring-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 transition-all hover:ring-1"
          whileHover={{ scale: 1.06 }} // Slight scale-up on hover
          whileTap={{ scale: 0.95 }} // Press-down effect on click
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Image
            src="/logo.svg"
            alt="Logo"
            width={36}
            height={36}
            style={{ width: "auto", height: "auto" }}
            priority
          />
        </motion.div>

        {/* Branding text (conditionally rendered) */}
        <AnimatePresence initial={false}>
          {showText && (
            <motion.div
              initial={{ opacity: 0, x: -8 }} // Enter from left
              animate={{ opacity: 1, x: 0 }} // Fully visible
              exit={{ opacity: 0, x: -8 }} // Exit to left
              transition={{ duration: 0.25 }}
              className="absolute top-8 left-22 flex flex-col leading-tight"
            >
              <span className="text-xl font-bold tracking-tight">
                Client
                <span className="text-[#ef5226] ml-0.5 font-mono text-2xl font-bold">
                  Space
                </span>
              </span>
              <span className="text-muted-foreground text-xs">
                The Client Portal for Freelancers
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>

      {/* Cmd+K search trigger — only visible when sidebar is expanded */}
      <AnimatePresence initial={false}>
        {showText && (
          <motion.button
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            onClick={openCommandPalette}
            className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Open command palette"
          >
            <Search size={12} className="shrink-0" />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="rounded border border-border bg-background px-1 py-0.5 text-[10px]">
              ⌘K
            </kbd>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
});