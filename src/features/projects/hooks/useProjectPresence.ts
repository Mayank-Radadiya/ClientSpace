'use client';

// src/features/projects/hooks/useProjectPresence.ts
// Custom hook that manages a Supabase Realtime presence channel for a project.
//
// Key design decisions:
// - Uses 'sync' event for ALL state updates (fires on join AND leave)
// - presence.key = userId → same user in multiple tabs appears ONCE
// - Reconnection detection: if channel not SUBSCRIBED for >5s, shows status
// - Cleanup: channel.untrack() then supabase.removeChannel() on unmount

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PresenceUser } from '../presence/presenceTypes';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface UseProjectPresenceReturn {
  /** All online users excluding the current user, sorted by joinedAt (stable) */
  onlineUsers: PresenceUser[];
  /** Update the current user's tracked activeTab in the channel */
  updateActiveTab: (tab: PresenceUser['activeTab']) => Promise<void>;
  /** Current WebSocket connection state */
  connectionStatus: ConnectionStatus;
}

export function useProjectPresence(
  projectId: string,
  currentUser: PresenceUser,
): UseProjectPresenceReturn {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

  // Ref to channel so updateActiveTab can access it without stale closure
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  // Ref to current user so sync handler always has latest value
  const currentUserRef = useRef<PresenceUser>(currentUser);
  // Reconnect timer ref
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep currentUserRef up to date when props change (e.g. activeTab changes)
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    const supabase = createClient();

    const channelName = `project_presence:${projectId}`;

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          // Using userId as the key deduplicates across browser tabs.
          // If the same user has 2 tabs open, they appear only ONCE
          // in other users' lists (most recently active tab's payload wins).
          key: currentUserRef.current.userId,
        },
      },
    });

    channelRef.current = channel;

    // ── Presence event handlers ──────────────────────────────────────
    channel
      .on('presence', { event: 'sync' }, () => {
        try {
          const state = channel.presenceState<PresenceUser>();
          // presenceState() returns { [key: userId]: PresenceUser[] }
          // Flatten, filter out self, sort by joinedAt for stable ordering
          const users = Object.values(state)
            .flatMap((arr) => arr as PresenceUser[])
            .filter((u) => u.userId !== currentUserRef.current.userId)
            .sort((a, b) => a.joinedAt - b.joinedAt);

          setOnlineUsers(users);
        } catch (err) {
          console.error('[useProjectPresence] Failed to process presence sync:', err);
        }
      })
      // join and leave are handled by sync — these are here for logging only
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        // No action needed — sync handles state
        void newPresences;
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        // No action needed — sync handles state
        void leftPresences;
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Clear any reconnect timer
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
          }
          setConnectionStatus('connected');

          try {
            // Announce our presence on the channel
            await channel.track(currentUserRef.current);
          } catch (err) {
            console.error('[useProjectPresence] Failed to track presence:', err);
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('error');
          console.error('[useProjectPresence] Channel error:', status);
        } else if (status === 'CLOSED') {
          setConnectionStatus('reconnecting');
        } else {
          // JOINING or other transitional states
          // Start a 5s timer — if we're still not SUBSCRIBED, show "reconnecting"
          if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = setTimeout(() => {
            setConnectionStatus((prev) => {
              if (prev !== 'connected') return 'reconnecting';
              return prev;
            });
          }, 5000);
        }
      });

    // ── Cleanup ──────────────────────────────────────────────────────
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);

      // Untrack FIRST so other clients receive the leave event immediately,
      // then remove the channel from the Supabase client registry.
      channel.untrack().catch((err) => {
        console.error('[useProjectPresence] Failed to untrack presence:', err);
      });
      supabase.removeChannel(channel).catch((err) => {
        console.error('[useProjectPresence] Failed to remove channel:', err);
      });

      channelRef.current = null;
    };
    // Re-run when projectId changes (navigating between projects).
    // currentUser.userId is stable; activeTab changes are handled via updateActiveTab.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, currentUser.userId]);

  /**
   * Update the current user's active tab in the presence payload.
   * This re-tracks the user with the new activeTab value, which triggers
   * a 'sync' event for all other subscribers.
   */
  const updateActiveTab = useCallback(async (tab: PresenceUser['activeTab']) => {
    if (!channelRef.current) return;
    try {
      await channelRef.current.track({
        ...currentUserRef.current,
        activeTab: tab,
      });
    } catch (err) {
      console.error('[useProjectPresence] Failed to update active tab:', err);
    }
  }, []);

  return { onlineUsers, updateActiveTab, connectionStatus };
}
