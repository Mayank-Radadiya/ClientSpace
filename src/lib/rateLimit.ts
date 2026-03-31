/**
 * Rate Limiting Utilities
 * ------------------------
 * Implements in-memory rate limiting to prevent brute-force attacks
 * on invitation tokens and authentication endpoints.
 *
 * Features:
 *  - Per-email rate limiting for invite acceptances (5 attempts/hour)
 *  - Per-IP rate limiting for token validation (10 attempts/hour)
 *  - Automatic cleanup of expired entries
 *  - Human-readable error messages with reset time
 *
 * Note: This is in-memory rate limiting suitable for single-instance deployments.
 * For multi-instance deployments, consider using Redis or a database-backed solution.
 */

type RateLimitEntry = {
  attempts: number;
  resetAt: number; // Unix timestamp (ms)
};

// In-memory stores
const inviteAttempts = new Map<string, RateLimitEntry>();
const tokenAttempts = new Map<string, RateLimitEntry>();

// Configuration
const INVITE_LIMIT = 5; // attempts per window
const TOKEN_LIMIT = 10; // attempts per window
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Clean up expired entries to prevent memory leaks
 */
function cleanup(store: Map<string, RateLimitEntry>) {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

/**
 * Check and increment rate limit
 * @returns null if allowed, error message if rate limited
 */
function checkRateLimit(
  store: Map<string, RateLimitEntry>,
  key: string,
  limit: number,
): { allowed: boolean; error?: string; resetAt?: number } {
  // Clean up expired entries periodically (every 100 checks)
  if (Math.random() < 0.01) {
    cleanup(store);
  }

  const now = Date.now();
  const entry = store.get(key);

  // No entry or expired → allow and create new entry
  if (!entry || now > entry.resetAt) {
    store.set(key, {
      attempts: 1,
      resetAt: now + WINDOW_MS,
    });
    return { allowed: true };
  }

  // Check if limit exceeded
  if (entry.attempts >= limit) {
    const minutesUntilReset = Math.ceil((entry.resetAt - now) / 60000);
    return {
      allowed: false,
      error: `Too many attempts. Please try again in ${minutesUntilReset} minute${minutesUntilReset === 1 ? "" : "s"}.`,
      resetAt: entry.resetAt,
    };
  }

  // Increment attempts
  entry.attempts += 1;
  return { allowed: true };
}

/**
 * Rate limit invitation acceptance attempts by email
 * Limit: 5 attempts per hour per email address
 *
 * @param email - Email address attempting to accept invitation
 * @returns Object with allowed flag and optional error message
 */
export function inviteRateLimit(email: string): {
  allowed: boolean;
  error?: string;
  resetAt?: number;
} {
  const normalizedEmail = email.toLowerCase().trim();
  return checkRateLimit(inviteAttempts, normalizedEmail, INVITE_LIMIT);
}

/**
 * Rate limit token validation attempts by IP address
 * Limit: 10 attempts per hour per IP
 *
 * @param ip - IP address attempting to validate token
 * @returns Object with allowed flag and optional error message
 */
export function tokenValidationRateLimit(ip: string): {
  allowed: boolean;
  error?: string;
  resetAt?: number;
} {
  return checkRateLimit(tokenAttempts, ip, TOKEN_LIMIT);
}

/**
 * Clear all rate limit entries (for testing purposes)
 */
export function clearRateLimits() {
  inviteAttempts.clear();
  tokenAttempts.clear();
}

/**
 * Get rate limit stats for monitoring
 */
export function getRateLimitStats() {
  return {
    inviteAttempts: inviteAttempts.size,
    tokenAttempts: tokenAttempts.size,
    totalEntries: inviteAttempts.size + tokenAttempts.size,
  };
}
