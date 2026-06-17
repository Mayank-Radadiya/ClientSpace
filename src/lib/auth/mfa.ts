// src/lib/auth/mfa.ts
// MFA/TOTP enforcement for admin and owner roles using Supabase native MFA.
//
// MFA must also be enabled in Supabase project settings (Auth > Multi-Factor Auth)
// for these checks to take effect.

import { createClient } from "@/lib/supabase/server";

export interface MFAStatus {
  mfaRequired: boolean;
  mfaSatisfied: boolean;
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
  userId: string,
): Promise<MFAStatus | null> {
  const mfaRequired = role === "owner" || role === "admin";
  if (!mfaRequired) {
    return { mfaRequired: false, mfaSatisfied: true };
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

    if (verifiedFactors.length === 0) {
      return {
        mfaRequired: true,
        mfaSatisfied: false,
        factors: [],
      };
    }

    // Check current AAL
    const { data: aalData } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const currentLevel = aalData?.currentLevel ?? "aal1";

    return {
      mfaRequired: true,
      mfaSatisfied: currentLevel === "aal2",
      factors: verifiedFactors.map((f) => ({
        id: f.id,
        friendlyName: f.friendly_name ?? null,
        createdAt: f.created_at,
      })),
    };
  } catch (error) {
    console.error("[MFA] Check failed:", error);
    return null;
  }
}
