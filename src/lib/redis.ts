import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

if (!process.env.UPSTASH_REDIS_REST_URL) {
  throw new Error("Missing UPSTASH_REDIS_REST_URL environment variable");
}

if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("Missing UPSTASH_REDIS_REST_TOKEN environment variable");
}

export const redis = Redis.fromEnv();

export function getRedisKey(key: string): string {
  const isProd = process.env.NODE_ENV === "production";
  const prefix = isProd ? "clientspace:prod:" : "clientspace:dev:";
  return `${prefix}${key}`;
}

/**
 * User-identity scoped rate limiter for mutations.
 * Max 30 writes/minute per user.
 */
export const mutationRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "60 s"),
  analytics: true,
  prefix: "ratelimit:mutation",
});

