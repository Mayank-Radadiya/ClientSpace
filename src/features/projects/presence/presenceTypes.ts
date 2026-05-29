// src/features/projects/presence/presenceTypes.ts
// Shared types and constants for the Supabase Realtime presence system.
// SECURITY: Only include non-sensitive data — no email, role, org plan tier.

/**
 * The presence payload broadcast to all users on the channel.
 * Keep this minimal — it is transmitted in cleartext over WebSockets.
 */
export interface PresenceUser {
  userId: string;
  name: string;
  avatarUrl: string | null;
  /** Which tab the user is currently viewing */
  activeTab: 'overview' | 'milestones' | 'files' | 'invoices' | 'activity' | string;
  /** Unix ms timestamp — used for stable join-order sorting */
  joinedAt: number;
  /** true = client portal user; false = agency team member */
  isClient: boolean;
}

/**
 * Canonical tab identifiers. Use these everywhere to prevent
 * string mismatch between tabs and presence tracking.
 */
export const PROJECT_TABS = {
  OVERVIEW: 'overview',
  MILESTONES: 'milestones',
  FILES: 'files',
  INVOICES: 'invoices',
  ACTIVITY: 'activity',
  CONTRACTS: 'contracts',
} as const;

export type ProjectTab = (typeof PROJECT_TABS)[keyof typeof PROJECT_TABS];

/**
 * Deterministic avatar background colors.
 * Derived via userId hash → index % 6.
 * These are oklch-compatible color tokens — they look good on both
 * light and dark themes.
 */
export const PRESENCE_AVATAR_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
] as const;

/**
 * Hash a userId string to a stable index in [0, PRESENCE_AVATAR_COLORS.length).
 * Pure function — same userId always yields same color.
 */
export function hashUserIdToColorIndex(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % PRESENCE_AVATAR_COLORS.length;
}

export function getAvatarColor(userId: string): string {
  return PRESENCE_AVATAR_COLORS[hashUserIdToColorIndex(userId)] ?? '#6366f1';
}

/**
 * Extract initials from a display name (first + last name initials).
 * e.g. "John Smith" → "JS", "Alice" → "A"
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0];
  if (!first) return '?';
  if (parts.length === 1) return first.charAt(0).toUpperCase();
  const last = parts[parts.length - 1];
  if (!last) return first.charAt(0).toUpperCase();
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

