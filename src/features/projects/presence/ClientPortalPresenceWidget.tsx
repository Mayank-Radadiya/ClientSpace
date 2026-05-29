'use client';

// src/features/projects/presence/ClientPortalPresenceWidget.tsx
// Simplified presence indicator for the client portal.
//
// Design decisions (matching spec):
// - Client sees only agency team members (isClient === false)
// - Simplified display: first online agency member's avatar + name + "online" status
// - Does NOT show all agency members (too much info for client-facing view)
// - Agency dashboard DOES show both agency + client (handled in ProjectDetailPage)

import { useEffect } from 'react';
import { useProjectPresence } from '../hooks/useProjectPresence';
import { getAvatarColor, getInitials } from './presenceTypes';
import type { PresenceUser } from './presenceTypes';

interface ClientPortalPresenceWidgetProps {
  projectId: string;
  currentUser: PresenceUser; // isClient: true
}

export function ClientPortalPresenceWidget({
  projectId,
  currentUser,
}: ClientPortalPresenceWidgetProps) {
  const { onlineUsers, updateActiveTab, connectionStatus } = useProjectPresence(
    projectId,
    currentUser,
  );

  // Update tab on mount — client is viewing the portal project page
  useEffect(() => {
    void updateActiveTab('overview');
  }, [updateActiveTab]);

  // Filter to only show agency team members
  const onlineAgencyMembers = onlineUsers.filter((u) => !u.isClient);

  // If no agency members are online, show nothing
  if (onlineAgencyMembers.length === 0) return null;
  if (connectionStatus === 'error') return null;

  const primaryMember = onlineAgencyMembers[0]!;
  const bgColor = getAvatarColor(primaryMember.userId);
  const initials = getInitials(primaryMember.name);

  return (
    <div
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
      style={{
        background: 'rgba(34, 197, 94, 0.08)',
        border: '1px solid rgba(34, 197, 94, 0.2)',
      }}
      role="status"
      aria-live="polite"
      aria-label="Account manager online status"
    >
      {/* Avatar */}
      <div
        className="relative shrink-0 overflow-hidden rounded-full"
        style={{
          width: 32,
          height: 32,
          background: primaryMember.avatarUrl ? 'transparent' : bgColor,
          boxShadow: '0 0 0 2px #fff, 0 0 0 3.5px #22c55e',
        }}
      >
        {primaryMember.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryMember.avatarUrl}
            alt={primaryMember.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-white">
            {initials}
          </span>
        )}

        {/* Animated online ring pulse */}
        <span
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.3)',
            animation: 'presence-pulse 2s ease-in-out infinite',
          }}
        />
      </div>

      {/* Text */}
      <div>
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {primaryMember.name} is online
        </p>
        <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70">
          Your account manager is available
        </p>
      </div>

      {/* Live indicator */}
      <div className="ml-auto">
        <span
          className="block h-2 w-2 rounded-full bg-emerald-500"
          style={{ animation: 'live-dot-pulse 2s ease-in-out infinite' }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
