"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createTRPCContext } from "@/lib/trpc/init";
import { setActiveOrg, clearActiveOrg } from "@/lib/auth/orgSwitcher";
import { invalidateUserCache } from "@/lib/auth/invalidateUserCache";
import {
  loginSchema,
  signupSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  verifyOtpSchema,
  resendOtpSchema,
  type LoginFormType,
  type SignupInput,
  type ResetPasswordInput,
  type UpdatePasswordInput,
  type VerifyOtpInput,
  type ResendOtpInput,
} from "../schemas";
import {
  authRateLimit,
  signupRateLimit,
  passwordResetRateLimit,
  checkAccountLockout,
  recordFailedLogin,
  clearAccountLockout,
  RATE_LIMIT_ERROR,
  ACCOUNT_LOCKED_ERROR,
} from "@/lib/rateLimit";
import { blockToken } from "@/lib/redis";
import { logAuthEvent } from "@/lib/authAudit";

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown"
  );
}

export type AuthState<T> = {
  error?: string;
  fieldErrors?: Partial<Record<keyof T, string[]>>;
  success?: boolean;
};

export async function loginAction(
  _prevState: AuthState<LoginFormType>,
  formData: FormData,
): Promise<AuthState<LoginFormType>> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten()
        .fieldErrors as AuthState<LoginFormType>["fieldErrors"],
    };
  }

  const ip = await getClientIp();
  const email = parsed.data.email;

  const isLocked = await checkAccountLockout(email);
  if (isLocked) {
    return { error: ACCOUNT_LOCKED_ERROR };
  }

  const compositeKey = `${email}:${ip}`;
  const { success } = await authRateLimit.limit(compositeKey);
  if (!success) {
    return { error: RATE_LIMIT_ERROR };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error) {
    const justLocked = await recordFailedLogin(email);
    await logAuthEvent({
      event: "login_failure",
      ip,
      metadata: { emailPrefix: email.slice(0, 3) + "***" },
    });
    return {
      error: justLocked
        ? ACCOUNT_LOCKED_ERROR
        : "Invalid email or password. Please try again.",
    };
  }

  await clearAccountLockout(email);
  await logAuthEvent({
    event: "login_success",
    ip,
  });

  // Get user's org context
  const ctx = await createTRPCContext();

  // If user has org membership, set active org cookie and route
  if (ctx) {
    await setActiveOrg(ctx.orgId);
    return redirect("/dashboard");
  }

  // No org membership - redirect to onboarding
  return redirect("/onboarding");
}

export async function signupAction(
  _prevState: AuthState<SignupInput>,
  formData: FormData,
): Promise<AuthState<SignupInput>> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten()
        .fieldErrors as AuthState<SignupInput>["fieldErrors"],
    };
  }

  const ip = await getClientIp();
  const { success } = await signupRateLimit.limit(ip);
  if (!success) {
    return { error: RATE_LIMIT_ERROR };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        name: parsed.data.name,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // ponytail: audit log for signup
  await logAuthEvent({
    event: "signup",
    ip,
    metadata: { email: parsed.data.email },
  });

  return redirect(
    "/verify?type=signup&email=" + encodeURIComponent(parsed.data.email),
  );
}

export async function resetPasswordAction(
  _prevState: AuthState<ResetPasswordInput>,
  formData: FormData,
): Promise<AuthState<ResetPasswordInput>> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten()
        .fieldErrors as AuthState<ResetPasswordInput>["fieldErrors"],
    };
  }

  const { success } = await passwordResetRateLimit.limit(parsed.data.email);
  if (!success) {
    return { error: RATE_LIMIT_ERROR };
  }

  const ip = await getClientIp();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
  );

  if (error) {
    return { error: error.message };
  }

  // ponytail: audit log for password reset request
  await logAuthEvent({
    event: "password_reset_request",
    ip,
    metadata: { email: parsed.data.email },
  });

  return redirect(
    "/verify?type=recovery&email=" + encodeURIComponent(parsed.data.email),
  );
}

export async function updatePasswordAction(
  _prevState: AuthState<UpdatePasswordInput>,
  formData: FormData,
): Promise<AuthState<UpdatePasswordInput>> {
  const parsed = updatePasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten()
        .fieldErrors as AuthState<UpdatePasswordInput>["fieldErrors"],
    };
  }

  const ip = await getClientIp();
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    await logAuthEvent({
      event: "password_change",
      ip,
      metadata: { success: false },
    });
    return { error: error.message };
  }

  // ponytail: invalidate the cached session so old tokens can't ride the 55s TTL
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      await invalidateUserCache(session.access_token);
    }
  } catch (e) {
    console.error("[updatePasswordAction] Cache invalidation failed:", e);
  }

  await logAuthEvent({
    event: "password_change",
    ip,
    metadata: { success: true },
  });

  return redirect("/dashboard");
}

export async function verifyOtpAction(
  _prevState: AuthState<VerifyOtpInput>,
  formData: FormData,
): Promise<AuthState<VerifyOtpInput>> {
  const parsed = verifyOtpSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten()
        .fieldErrors as AuthState<VerifyOtpInput>["fieldErrors"],
    };
  }

  const ip = await getClientIp();
  const { success } = await authRateLimit.limit(`${parsed.data.email}:${ip}`);
  if (!success) {
    return { error: RATE_LIMIT_ERROR };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: parsed.data.type,
  });

  if (error) {
    return { error: error.message };
  }

  if (parsed.data.type === "recovery") {
    return redirect("/update-password");
  } else {
    return redirect("/dashboard");
  }
}

export async function resendOtpAction(
  _prevState: AuthState<ResendOtpInput>,
  formData: FormData,
): Promise<AuthState<ResendOtpInput>> {
  const parsed = resendOtpSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten()
        .fieldErrors as AuthState<ResendOtpInput>["fieldErrors"],
    };
  }

  const ip = await getClientIp();
  const { success } = await authRateLimit.limit(`${parsed.data.email}:${ip}`);
  if (!success) {
    return { error: RATE_LIMIT_ERROR };
  }

  const supabase = await createClient();

  if (parsed.data.type === "recovery") {
    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
    );
    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase.auth.resend({
      email: parsed.data.email,
      type: "signup",
    });
    if (error) {
      return { error: error.message };
    }
  }

  return { success: true };
}

export async function logoutAction(): Promise<never> {
  const supabase = await createClient();
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const jwt = session?.access_token;
    if (jwt) {
      const parts = jwt.split(".");
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(
            Buffer.from(parts[1]!, "base64url").toString("utf-8"),
          ) as { jti?: string; exp?: number };
          if (payload.jti && payload.exp) {
            await blockToken(payload.jti, payload.exp * 1000);
          }
        } catch {
          /* ignore parse errors */
        }
      }
      await invalidateUserCache(jwt);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    await logAuthEvent({
      event: "logout",
      userId: user?.id ?? undefined,
    });
  } catch (e) {
    console.error(
      "[logoutAction] Failed to extract session JWT for cache invalidation:",
      e,
    );
  }

  await supabase.auth.signOut();
  await clearActiveOrg();

  return redirect("/login");
}
