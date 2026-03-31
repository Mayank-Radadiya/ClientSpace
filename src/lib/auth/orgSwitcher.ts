import { cookies } from "next/headers";

const COOKIE_NAME = "active_org_id";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days (matches session duration)

/**
 * Set the active organization for the current user.
 * Called during:
 * - Login (if user has orgs)
 * - Signup verification (if redirecting to dashboard)
 * - Org creation (onboarding)
 * - Org switching (via /switch-org)
 * - Client invite acceptance (sets to invited org)
 */
export async function setActiveOrg(orgId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, orgId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Get the active organization ID from cookie.
 * Returns undefined if not set.
 */
export async function getActiveOrgId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

/**
 * Clear the active organization cookie.
 * Called during logout or when switching to an invalid org.
 */
export async function clearActiveOrg(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
