// src/features/projects/presence/index.ts
// Barrel export for the presence module.
// Import from here instead of individual files for clean imports.

export type { PresenceUser } from './presenceTypes';
export { PROJECT_TABS, PRESENCE_AVATAR_COLORS, getAvatarColor, getInitials, hashUserIdToColorIndex } from './presenceTypes';
export type { PresenceContextValue } from './PresenceContext';
export { PresenceContext, usePresenceContext } from './PresenceContext';
export { PresenceProvider } from './PresenceProvider';
export type { PresenceAvatarsProps } from './PresenceAvatars';
export { PresenceAvatars } from './PresenceAvatars';
export { ClientPortalPresenceWidget } from './ClientPortalPresenceWidget';
