'use client';

// src/features/projects/presence/PresenceContext.tsx
// React context for sharing presence state across the project detail page tree.
// Use usePresenceContext() in any child component that needs online users.

import { createContext, useContext } from 'react';
import type { PresenceUser } from './presenceTypes';
import type { ConnectionStatus } from '../hooks/useProjectPresence';

export interface PresenceContextValue {
  /** Online users (excluding the current user) */
  onlineUsers: PresenceUser[];
  /** Update the current user's active tab in the presence payload */
  updateActiveTab: (tab: PresenceUser['activeTab']) => Promise<void>;
  /** Current WebSocket connection status */
  connectionStatus: ConnectionStatus;
}

export const PresenceContext = createContext<PresenceContextValue | null>(null);

/**
 * Hook to access presence state.
 * Must be used inside a PresenceProvider.
 * Returns null if used outside — allows safe opt-out in non-presence contexts.
 */
export function usePresenceContext(): PresenceContextValue | null {
  return useContext(PresenceContext);
}
