'use client';

// src/features/projects/presence/PresenceAvatars.tsx
// Figma/Linear-style live presence avatar stack.
//
// Features:
// - Overlapping avatar stack with spring entrance/exit animations (Framer Motion)
// - Green pulse ring for "online" indicator
// - Deterministic initials + color when no avatarUrl
// - Hover tooltip: name + activeTab + "Client" badge
// - +N overflow circle with dropdown list
// - Mobile: collapses to "N online" text badge (< md breakpoint)
// - "Live" green dot indicator with CSS pulse animation
// - Empty state renders null

import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getAvatarColor, getInitials } from './presenceTypes';
import type { PresenceUser } from './presenceTypes';
import { cn } from '@/lib/utils';

/* ── Constants ──────────────────────────────────────────────── */
const SIZE_CONFIG = {
  sm: { px: 28, marginLeft: -8, fontSize: 10, ringOffset: 2 },
  md: { px: 36, marginLeft: -10, fontSize: 12, ringOffset: 2 },
};

/* ── Styles injected once ────────────────────────────────────── */
const PULSE_STYLE = `
@keyframes presence-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@keyframes live-dot-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.85); opacity: 0.6; }
}
.presence-pulse-ring {
  animation: presence-pulse 2s ease-in-out infinite;
}
`;

function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('presence-styles')) return;
  const el = document.createElement('style');
  el.id = 'presence-styles';
  el.textContent = PULSE_STYLE;
  document.head.appendChild(el);
}

/* ── Individual Avatar ───────────────────────────────────────── */
interface PresenceAvatarProps {
  user: PresenceUser;
  size: 'sm' | 'md';
  index: number;
}

function PresenceAvatar({ user, size, index }: PresenceAvatarProps) {
  const { px, fontSize } = SIZE_CONFIG[size];
  const bgColor = getAvatarColor(user.userId);
  const initials = getInitials(user.name);

  const tabLabel = user.activeTab.replace(/_/g, ' ');
  const tooltipText = user.isClient
    ? `${user.name} (client) · viewing ${tabLabel}`
    : `${user.name} · viewing ${tabLabel}`;

  return (
    <motion.div
      key={user.userId}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      className="relative shrink-0 group"
      style={{
        width: px,
        height: px,
        marginLeft: index === 0 ? 0 : SIZE_CONFIG[size].marginLeft,
        zIndex: 10 - index,
      }}
      aria-label={tooltipText}
    >
      {/* Avatar circle */}
      <div
        className="relative h-full w-full overflow-hidden rounded-full select-none"
        style={{
          // Green online ring
          boxShadow: `0 0 0 2px var(--pd-body, #fff), 0 0 0 4px #22c55e`,
          background: user.avatarUrl ? 'transparent' : bgColor,
        }}
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <span
            className="absolute inset-0 flex items-center justify-center font-medium text-white"
            style={{ fontSize }}
          >
            {initials}
          </span>
        )}
      </div>

      {/* Tooltip — CSS only for performance, no JS delay needed */}
      <div
        className="
          pointer-events-none absolute bottom-full left-1/2 z-50 mb-2
          -translate-x-1/2 whitespace-nowrap rounded-lg px-2.5 py-1.5
          text-xs font-medium shadow-lg
          opacity-0 transition-opacity delay-300 group-hover:opacity-100
        "
        style={{
          background: 'var(--pd-surface, #fff)',
          border: '1px solid var(--pd-border, #e5e7eb)',
          color: 'var(--pd-text-secondary, #374151)',
          maxWidth: 'calc(100vw - 32px)',
        }}
        role="tooltip"
      >
        {tooltipText}
        {user.isClient && (
          <span
            className="ml-1.5 rounded px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{
              background: 'var(--pd-accent-subtle, #ede9fe)',
              color: 'var(--pd-accent, #7c3aed)',
            }}
          >
            Client
          </span>
        )}
        {/* Tooltip caret */}
        <span
          className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent"
          style={{ borderTopColor: 'var(--pd-border, #e5e7eb)' }}
        />
      </div>
    </motion.div>
  );
}

/* ── Overflow Dropdown ───────────────────────────────────────── */
interface OverflowDropdownProps {
  users: PresenceUser[];
  size: 'sm' | 'md';
  onClose: () => void;
}

function OverflowDropdown({ users, size, onClose }: OverflowDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { px } = SIZE_CONFIG[size];

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -4, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="absolute top-full right-0 z-50 mt-2 w-60 rounded-xl py-2 shadow-lg"
      style={{
        background: 'var(--pd-surface, #fff)',
        border: '1px solid var(--pd-border, #e5e7eb)',
      }}
      role="listbox"
      aria-label="All online users"
    >
      <p
        className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--pd-text-muted, #9ca3af)' }}
      >
        Also viewing
      </p>
      {users.map((user) => {
        const bgColor = getAvatarColor(user.userId);
        const initials = getInitials(user.name);
        const tabLabel = user.activeTab.replace(/_/g, ' ');

        return (
          <div
            key={user.userId}
            className="flex items-center gap-2.5 px-3 py-2"
            style={{ fontFamily: 'var(--font-data, sans-serif)' }}
            role="option"
            aria-selected={false}
          >
            {/* Mini avatar */}
            <div
              className="shrink-0 overflow-hidden rounded-full"
              style={{
                width: 24,
                height: 24,
                background: user.avatarUrl ? 'transparent' : bgColor,
                boxShadow: '0 0 0 1.5px var(--pd-body, #fff), 0 0 0 3px #22c55e',
              }}
            >
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span
                  className="flex h-full w-full items-center justify-center text-[9px] font-semibold text-white"
                >
                  {initials}
                </span>
              )}
            </div>

            {/* Name + tab */}
            <div className="min-w-0 flex-1">
              <div
                className="flex items-center gap-1.5 truncate text-xs font-medium"
                style={{ color: 'var(--pd-text-primary, #111827)' }}
              >
                {user.name}
                {user.isClient && (
                  <span
                    className="shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                    style={{
                      background: 'var(--pd-accent-subtle, #ede9fe)',
                      color: 'var(--pd-accent, #7c3aed)',
                    }}
                  >
                    Client
                  </span>
                )}
              </div>
              <div
                className="truncate text-[11px]"
                style={{ color: 'var(--pd-text-muted, #9ca3af)' }}
              >
                viewing {tabLabel}
              </div>
            </div>

            {/* Online dot */}
            <div
              className="shrink-0 h-2 w-2 rounded-full"
              style={{ background: '#22c55e' }}
              aria-label="Online"
            />
          </div>
        );
      })}
    </motion.div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */
export interface PresenceAvatarsProps {
  onlineUsers: PresenceUser[];
  /** Max avatars shown before +N overflow. Default: 4 */
  maxVisible?: number;
  /** Size variant. Default: 'md' */
  size?: 'sm' | 'md';
  className?: string;
}

export function PresenceAvatars({
  onlineUsers,
  maxVisible = 4,
  size = 'md',
  className,
}: PresenceAvatarsProps) {
  const [overflowOpen, setOverflowOpen] = useState(false);

  // Inject CSS keyframes once on mount
  useEffect(() => { injectStyles(); }, []);

  const handleOverflowClose = useCallback(() => setOverflowOpen(false), []);

  // Empty state — render nothing
  if (onlineUsers.length === 0) return null;

  const visibleUsers = onlineUsers.slice(0, maxVisible);
  const overflowCount = onlineUsers.length - maxVisible;
  const overflowUsers = onlineUsers.slice(maxVisible);

  const { px, fontSize } = SIZE_CONFIG[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* ── Mobile: "N online" text badge (hidden on md+) ── */}
      <div className="flex items-center gap-1.5 md:hidden">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: '#22c55e', animation: 'live-dot-pulse 2s ease-in-out infinite' }}
        />
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--pd-text-secondary, #6b7280)' }}
        >
          {onlineUsers.length} online
        </span>
      </div>

      {/* ── Desktop: Avatar stack (hidden on < md) ── */}
      <div className="hidden md:flex md:items-center md:gap-2">
        {/* Live dot + label */}
        <div className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background: '#22c55e',
              animation: 'live-dot-pulse 2s ease-in-out infinite',
              flexShrink: 0,
            }}
            aria-label="Live"
          />
          <span
            className="text-xs font-medium"
            style={{
              color: 'var(--pd-text-muted, #9ca3af)',
              fontFamily: 'var(--font-data, sans-serif)',
            }}
          >
            Live
          </span>
        </div>

        {/* Avatar stack — row-reverse so newest joiners stack right */}
        <div
          className="relative flex flex-row-reverse items-center"
          role="group"
          aria-label={`${onlineUsers.length} user${onlineUsers.length !== 1 ? 's' : ''} viewing this project`}
        >
          {/* Overflow "+N" button (rightmost) */}
          {overflowCount > 0 && (
            <div className="relative" style={{ marginLeft: SIZE_CONFIG[size].marginLeft, zIndex: 0 }}>
              <button
                onClick={() => setOverflowOpen((o) => !o)}
                className="flex items-center justify-center rounded-full font-semibold text-white transition-transform hover:scale-105 active:scale-95"
                style={{
                  width: px,
                  height: px,
                  background: 'var(--pd-surface-hover, #6366f1)',
                  boxShadow: `0 0 0 2px var(--pd-body, #fff)`,
                  fontSize,
                }}
                aria-label={`${overflowCount} more users online`}
                aria-expanded={overflowOpen}
                aria-haspopup="listbox"
              >
                +{overflowCount}
              </button>

              <AnimatePresence>
                {overflowOpen && (
                  <OverflowDropdown
                    users={overflowUsers}
                    size={size}
                    onClose={handleOverflowClose}
                  />
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Visible avatars (reversed so first joiner is rightmost visually) */}
          <AnimatePresence initial={false}>
            {[...visibleUsers].reverse().map((user, idx) => (
              <PresenceAvatar
                key={user.userId}
                user={user}
                size={size}
                index={idx}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
