'use client';

// src/features/projects/presence/PresenceProvider.tsx
// Client Component that bootstraps the presence system for a project page.
//
// Responsibilities:
// 1. Calls useProjectPresence to open the Realtime channel
// 2. Provides PresenceContext to all children
// 3. Tracks activeTab changes (passed as prop from the parent that controls routing)
// 4. Shows a reconnection banner when connection drops

import { useEffect, type ReactNode } from 'react';
import { PresenceContext } from './PresenceContext';
import { useProjectPresence } from '../hooks/useProjectPresence';
import type { PresenceUser } from './presenceTypes';

interface PresenceProviderProps {
  projectId: string;
  currentUser: PresenceUser;
  /** The currently active tab — changes are tracked in the channel payload */
  activeTab: PresenceUser['activeTab'];
  children: ReactNode;
}

export function PresenceProvider({
  projectId,
  currentUser,
  activeTab,
  children,
}: PresenceProviderProps) {
  const { onlineUsers, updateActiveTab, connectionStatus } = useProjectPresence(
    projectId,
    // Include activeTab in the presence payload so initial track is correct
    { ...currentUser, activeTab },
  );

  // Sync active tab changes back into the presence channel
  useEffect(() => {
    void updateActiveTab(activeTab);
    // Only re-run when the tab actually changes (not on every render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <PresenceContext.Provider value={{ onlineUsers, updateActiveTab, connectionStatus }}>
      {/* Reconnecting banner removed to avoid stuck intrusive toasts. 
          Connection status can be handled by PresenceAvatars if needed. */}

      {children}
    </PresenceContext.Provider>
  );
}
