/**
 * SidebarFn (Sidebar Root Wrapper)
 * -------------------------------
 * High-level wrapper component that initializes sidebar state
 * and provides it to all nested sidebar components.
 *
 * This component exists to:
 *  - Encapsulate SidebarProvider usage
 *  - Keep sidebar initialization clean and declarative
 *  - Allow optional external control of sidebar behavior
 *
 * It acts as the root entry point for the sidebar system.
 */

"use client";

import type { ReactNode } from "react";
import { SidebarProvider } from "./SidebarContext";

interface SidebarProviderProps {
  children: ReactNode;
  open?: boolean;                   // Optional controlled open state
  setOpen?: (value: boolean) => void; // Optional controlled setter
  animate?: boolean;                // Enables or disables animations
}

interface SidebarProps extends SidebarProviderProps {
  children: ReactNode;
}

/**
 * SidebarFn
 * ---------
 * Thin wrapper around SidebarProvider.
 *
 * It forwards all provider-related props and
 * ensures children are wrapped with sidebar context.
 */
export const SidebarFn = ({ children, ...providerProps }: SidebarProps) => {
  return <SidebarProvider {...providerProps}>{children}</SidebarProvider>;
};
