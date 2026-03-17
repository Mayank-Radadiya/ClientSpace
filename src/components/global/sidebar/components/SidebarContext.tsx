/**
 * SidebarContext & Provider
 * ------------------------
 * Centralized state management for sidebar behavior.
 *
 * This file defines:
 *  - Sidebar context shape and types
 *  - A safe hook for consuming sidebar state
 *  - A flexible provider that supports both
 *    controlled and uncontrolled usage
 *
 * All sidebar components rely on this context
 * to stay synchronized.
 */

"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * SidebarContextValue
 * -------------------
 * Defines the shape of data exposed to sidebar consumers.
 */
export interface SidebarContextValue {
  open: boolean; // Whether the sidebar is expanded
  setOpen: (value: boolean) => void; // Controls open state
  animate: boolean; // Enables or disables animations
}

/**
 * SidebarContext
 * --------------
 * Holds the current sidebar state.
 *
 * Initialized as null to allow runtime safety checks.
 */
export const SidebarContext = createContext<SidebarContextValue | null>(null);

/**
 * useSidebar
 * ----------
 * Safe hook for consuming sidebar context.
 *
 * Throws a clear error if used outside of SidebarProvider,
 * preventing silent failures.
 */
export const useSidebar = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return ctx;
};

interface SidebarProviderProps {
  children: ReactNode;
  open?: boolean; // Optional controlled open state
  setOpen?: (value: boolean) => void; // Optional controlled setter
  animate?: boolean; // Enables/disables sidebar animations
}

/**
 * SidebarProvider
 * ---------------
 * Provides sidebar state to all descendant components.
 *
 * Supports:
 *  - Uncontrolled mode (internal state)
 *  - Controlled mode (external open/setOpen)
 */
export const SidebarProvider = ({
  children,
  open,
  setOpen,
  animate = true,
}: SidebarProviderProps) => {
  /**
   * Internal state
   * --------------
   * Used only when open/setOpen are not provided.
   */
  const [internalOpen, internalSetOpen] = useState(false);

  /**
   * Memoized context value
   * ---------------------
   * Prevents unnecessary re-renders of consumers.
   *
   * Priority:
   *  - Controlled props if provided
   *  - Internal state otherwise
   */
  const contextValue = useMemo<SidebarContextValue>(
    () => ({
      open: open ?? internalOpen,
      setOpen: setOpen ?? internalSetOpen,
      animate,
    }),
    [open, setOpen, animate, internalOpen]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
};
