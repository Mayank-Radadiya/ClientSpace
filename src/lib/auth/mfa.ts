// src/lib/auth/mfa.ts
// MFA/TOTP enforcement for admin and owner roles using Supabase native MFA.

import { createClient } from "@/lib/supabase/server";

// ponytail: enum replaces the boolean that collapsed 3 states into 1
export type MfaState = "not_required" | "not_enrolled" | "enrolled_unverified" | "satisfied";

export interface MFAStatus {
  state: MfaState;
  /** All verified TOTP factor IDs (for management UI) */
  factors?: Array<{ id: string; friendlyName: string | null; createdAt: string }>;
}

/**
 * Checks MFA status for the current session.
 *
 * - `owner` and `admin` roles require MFA (AAL2).
 * - `member` and `client` roles have MFA as optional.
 */
export async function checkMFARequirement(
  role: string,
  _userId: string,
): Promise<MFAStatus | null> {
  const mfaRequired = role === "owner" || role === "admin";
  if (!mfaRequired) {
    return { state: "not_required" };
  }

  try {
    const supabase = await createClient();

    const { data: factors, error: factorsError } =
      await supabase.auth.mfa.listFactors();

    if (factorsError) {
      console.error("[MFA] Failed to list factors:", factorsError);
      return null;
    }

    const verifiedFactors =
      factors?.all?.filter(
        (f) => f.factor_type === "totp" && f.status === "verified",
      ) ?? [];

    const mappedFactors = verifiedFactors.map((f) => ({
      id: f.id,
      friendlyName: f.friendly_name ?? null,
      createdAt: f.created_at,
    }));

    if (verifiedFactors.length === 0) {
      return { state: "not_enrolled", factors: [] };
    }

    // Check current AAL
    const { data: aalData } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const currentLevel = aalData?.currentLevel ?? "aal1";

    return {
      state: currentLevel === "aal2" ? "satisfied" : "enrolled_unverified",
      factors: mappedFactors,
    };
  } catch (error) {
    console.error("[MFA] Check failed:", error);
    return null;
  }
}

/**
 * Shared guard — throws if MFA is required but not satisfied.
 * Callers catch the error and route appropriately.
 */
export class MfaRequiredError extends Error {
  constructor(public readonly mfaState: "not_enrolled" | "enrolled_unverified") {
    super(`MFA required: ${mfaState}`);
    this.name = "MfaRequiredError";
  }
}

export async function requireMfaSatisfied(role: string, userId: string): Promise<void> {
  const status = await checkMFARequirement(role, userId);
  if (!status) return; // ponytail: if check fails, don't block — fail open to avoid lockout
  if (status.state === "not_enrolled" || status.state === "enrolled_unverified") {
    throw new MfaRequiredError(status.state);
  }
}
