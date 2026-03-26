"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createTRPCContext } from "@/lib/trpc/init";
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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  const ctx = await createTRPCContext();
  return redirect(ctx ? "/dashboard" : "/onboarding");
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

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
  );

  if (error) {
    return { error: error.message };
  }

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

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

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
