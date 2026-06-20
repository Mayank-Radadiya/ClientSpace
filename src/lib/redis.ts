import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// ponytail: lazy init so module can be imported during build/type-check without env vars
let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error("Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN environment variable");
    }
    _redis = Redis.fromEnv();
  }
  return _redis;
}

/** @deprecated Use getRedis() instead. Kept for backwards compat during migration. */
export const redis = new Proxy({} as Redis, {
  get(_target, prop, receiver) {
    return Reflect.get(getRedis(), prop, receiver);
  },
});

export function getRedisKey(key: string): string {
  const isProd = process.env.NODE_ENV === "production";
  const prefix = isProd ? "clientspace:prod:" : "clientspace:dev:";
  return `${prefix}${key}`;
}

/**
 * User-identity scoped rate limiter for mutations.
 * Max 30 writes/minute per user.
 */
let _mutationRateLimiter: Ratelimit | null = null;
export function getMutationRateLimiter(): Ratelimit {
  if (!_mutationRateLimiter) {
    _mutationRateLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(30, "60 s"),
      analytics: true,
      prefix: "ratelimit:mutation",
    });
  }
  return _mutationRateLimiter;
}
// ponytail: keep the old export name working via lazy proxy
export const mutationRateLimiter = new Proxy({} as Ratelimit, {
  get(_target, prop, receiver) {
    return Reflect.get(getMutationRateLimiter(), prop, receiver);
  },
});

export async function blockToken(jti: string, expiresAtMs: number): Promise<void> {
  const key = getRedisKey(`jwt:blocklist:${jti}`);
  const ttlSeconds = Math.max(1, Math.ceil((expiresAtMs - Date.now()) / 1000));
  try {
    await getRedis().setex(key, ttlSeconds, "1");
  } catch (error) {
    console.error("[jwtBlocklist] Failed to block token:", error);
  }
}

export async function isTokenBlocked(jti: string): Promise<boolean> {
  const key = getRedisKey(`jwt:blocklist:${jti}`);
  try {
    const result = await getRedis().get(key);
    return result === "1";
  } catch (error) {
    console.error("[jwtBlocklist] Failed to check blocked token:", error);
    return false;
  }
}
