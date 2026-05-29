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
      {/* Reconnecting banner — appears only when WS drops for >5s */}
      {connectionStatus === 'reconnecting' && (
        <div
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium shadow-lg"
          style={{
            background: 'var(--pd-surface, #fff)',
            border: '1px solid var(--pd-border, #e5e7eb)',
            color: 'var(--pd-text-secondary, #6b7280)',
            fontFamily: 'var(--font-data, sans-serif)',
          }}
          role="status"
          aria-live="polite"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background: '#f59e0b',
              animation: 'live-dot-pulse 1s ease-in-out infinite',
            }}
          />
          Reconnecting to live updates…
        </div>
      )}

      {connectionStatus === 'error' && (
        <div
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium shadow-lg"
          style={{
            background: 'var(--pd-status-overdue-bg, #fef2f2)',
            border: '1px solid var(--pd-status-overdue, #ef4444)',
            color: 'var(--pd-status-overdue, #ef4444)',
            fontFamily: 'var(--font-data, sans-serif)',
          }}
          role="alert"
          aria-live="assertive"
        >
          <span className="h-2 w-2 rounded-full" style={{ background: '#ef4444' }} />
          Live presence unavailable
        </div>
      )}

      {children}
    </PresenceContext.Provider>
  );
}
