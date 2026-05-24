// src/features/projects/project-detail/hooks/useTabUnreadState.ts
// localStorage-based per-tab visited tracking for unread dot indicators.
// SSR-safe — all reads happen inside useEffect.

import { useState, useEffect, useCallback } from "react";

function storageKey(projectId: string, tabName: string): string {
  return `cs_tab_${projectId}_${tabName}`;
}

/**
 * Tracks whether a tab has unread content since the user last visited it.
 *
 * @param projectId - The project ID
 * @param tabName - The tab name (e.g., "milestones", "files")
 * @param latestTimestamp - ISO timestamp of the most recent activity for this tab's content
 * @returns [hasUnread, markAsRead] — boolean + callback to clear the unread state
 */
export function useTabUnreadState(
  projectId: string,
  tabName: string,
  latestTimestamp: string | null,
): [boolean, () => void] {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!latestTimestamp) {
      setHasUnread(false);
      return;
    }

    try {
      const key = storageKey(projectId, tabName);
      const lastVisit = localStorage.getItem(key);

      if (!lastVisit) {
        // Never visited — show dot
        setHasUnread(true);
        return;
      }

      const lastVisitTime = new Date(lastVisit).getTime();
      const latestTime = new Date(latestTimestamp).getTime();

      setHasUnread(latestTime > lastVisitTime);
    } catch {
      // localStorage unavailable — default to no unread
      setHasUnread(false);
    }
  }, [projectId, tabName, latestTimestamp]);

  const markAsRead = useCallback(() => {
    try {
      const key = storageKey(projectId, tabName);
      localStorage.setItem(key, new Date().toISOString());
      setHasUnread(false);
    } catch {
      // ignore
    }
  }, [projectId, tabName]);

  return [hasUnread, markAsRead];
}
