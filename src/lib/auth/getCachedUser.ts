import { type User } from "@supabase/supabase-js";
import { redis, getRedisKey } from "@/lib/redis";
import { createClient } from "@/lib/supabase/server";

/**
 * Validates a Supabase JWT and retrieves the corresponding User object,
 * using an Upstash Redis cache to bypass the network hop to Supabase Auth servers.
 *
 * Cache TTL is set to 55 seconds to prevent race conditions with Supabase's 60s window.
 * Silent try/catch blocks guard all Redis calls so that authentication never breaks on cache failures.
 */
export async function getCachedUser(jwt: string): Promise<User | null> {
  if (!jwt) return null;

  const parts = jwt.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const sig = parts[2];
  if (!sig) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(parts[1]!, "base64url").toString("utf-8")) as { jti?: string; exp?: number };
    if (payload.jti) {
      const { isTokenBlocked } = await import("@/lib/redis");
      const blocked = await isTokenBlocked(payload.jti);
      if (blocked) return null;
    }
  } catch {
    // Malformed or test JWT without a valid JSON payload — skip blocklist check
  }

  const cacheKey = getRedisKey(`session:${sig}`);
  let cachedUser: User | null = null;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      if (typeof cached === "string") {
        cachedUser = JSON.parse(cached) as User;
      } else {
        cachedUser = cached as User;
      }
    }
  } catch (error) {
    console.error("[getCachedUser] Redis get error:", error);
  }

  if (cachedUser) {
    return cachedUser;
  }

  // Cache miss or Redis connection failure: fall back to Supabase auth validation
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(jwt);

    if (error || !user) {
      return null;
    }

    // Cache the resolved user object in Redis for 55 seconds
    try {
      await redis.setex(cacheKey, 55, JSON.stringify(user));
    } catch (setexErr) {
      console.error("[getCachedUser] Redis setex error:", setexErr);
    }

    return user;
  } catch (error) {
    console.error("[getCachedUser] Supabase getUser failed:", error);
    return null;
  }
}
