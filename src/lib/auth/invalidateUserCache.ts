import { redis, getRedisKey } from "@/lib/redis";

/**
 * Invalidates the cached user session in Redis associated with the provided JWT.
 * This should be explicitly triggered during logout or session invalidation flows.
 */
export async function invalidateUserCache(jwt: string): Promise<void> {
  if (!jwt) return;

  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) {
      return;
    }
    const sig = parts[2];
    if (!sig) {
      return;
    }

    const cacheKey = getRedisKey(`session:${sig}`);
    await redis.del(cacheKey);
  } catch (error) {
    console.error("[invalidateUserCache] Failed to delete session key from Redis:", error);
  }
}
