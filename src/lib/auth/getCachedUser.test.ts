import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCachedUser } from "./getCachedUser";
import { redis } from "@/lib/redis";
import { createClient } from "@/lib/supabase/server";

// Mock the dependencies
vi.mock("@/lib/redis", () => {
  return {
    redis: {
      get: vi.fn(),
      setex: vi.fn(),
    },
    getRedisKey: vi.fn((key: string) => `clientspace:dev:${key}`),
  };
});

vi.mock("@/lib/supabase/server", () => {
  const mockGetUser = vi.fn();
  return {
    createClient: vi.fn(() => ({
      auth: {
        getUser: mockGetUser,
      },
    })),
  };
});

describe("getCachedUser", () => {
  const mockJwt = "header.payload.signature123";
  const expectedKey = "clientspace:dev:session:signature123";
  const mockUser = { id: "user-123", email: "test@example.com" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return cached user and NOT call Supabase when cache is warm", async () => {
    vi.mocked(redis.get).mockResolvedValue(mockUser);
    const mockSupabaseClient = await createClient();
    vi.mocked(mockSupabaseClient.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null as any,
    });

    const result = await getCachedUser(mockJwt);

    expect(redis.get).toHaveBeenCalledWith(expectedKey);
    expect(mockSupabaseClient.auth.getUser).not.toHaveBeenCalled();
    expect(result).toEqual(mockUser);
  });

  it("should call Supabase on cache miss, cache the result, and return the user", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    const mockSupabaseClient = await createClient();
    vi.mocked(mockSupabaseClient.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null as any,
    });

    const result = await getCachedUser(mockJwt);

    expect(redis.get).toHaveBeenCalledWith(expectedKey);
    expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith(mockJwt);
    expect(redis.setex).toHaveBeenCalledWith(expectedKey, 55, JSON.stringify(mockUser));
    expect(result).toEqual(mockUser);
  });

  it("should gracefully handle Redis errors, fall back to Supabase, and return the user", async () => {
    vi.mocked(redis.get).mockRejectedValue(new Error("Redis connection timed out"));
    const mockSupabaseClient = await createClient();
    vi.mocked(mockSupabaseClient.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null as any,
    });

    const result = await getCachedUser(mockJwt);

    expect(redis.get).toHaveBeenCalledWith(expectedKey);
    expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith(mockJwt);
    expect(result).toEqual(mockUser);
  });
});
