import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
  prefix: "ratelimit:auth",
});

export const signupRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "60 s"),
  analytics: true,
  prefix: "ratelimit:signup",
});

export const passwordResetRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "300 s"),
  analytics: true,
  prefix: "ratelimit:passwordreset",
});

export const contractSignRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "600 s"),
  analytics: true,
  prefix: "ratelimit:contractsign",
});

export async function checkAccountLockout(email: string): Promise<boolean> {
  const lockedKey = `lockout:locked:${email.toLowerCase()}`;
  try {
    const result = await redis.get(lockedKey);
    return result === "1";
  } catch {
    return false;
  }
}

export async function recordFailedLogin(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase();
  const counterKey = `lockout:counter:${normalizedEmail}`;
  const lockedKey = `lockout:locked:${normalizedEmail}`;
  try {
    const attempts = await redis.incr(counterKey);
    if (attempts === 1) {
      await redis.expire(counterKey, 900);
    }
    if (attempts >= 5) {
      await redis.setex(lockedKey, 900, "1");
      await redis.del(counterKey);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function clearAccountLockout(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase();
  try {
    await redis.del(`lockout:locked:${normalizedEmail}`);
    await redis.del(`lockout:counter:${normalizedEmail}`);
  } catch {
    // Non-fatal
  }
}

export const RATE_LIMIT_ERROR = "Too many attempts. Please try again later.";
export const ACCOUNT_LOCKED_ERROR = "Your account has been temporarily locked. Please try again later.";

export async function inviteRateLimitRedis(email: string): Promise<boolean> {
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "3600 s"),
    prefix: "ratelimit:invite",
  });
  const { success } = await limiter.limit(`invite:${email.toLowerCase()}`);
  return success;
}

export async function tokenValidationRateLimitRedis(ip: string): Promise<boolean> {
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "3600 s"),
    prefix: "ratelimit:token",
  });
  const { success } = await limiter.limit(`token:${ip}`);
  return success;
}
