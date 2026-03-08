"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  signupSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  type LoginInput,
  type SignupInput,
  type ResetPasswordInput,
  type UpdatePasswordInput,
} from "../schemas";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export type AuthState<T> = {
  error?: string;
  fieldErrors?: Partial<Record<keyof T, string[]>>;
  success?: boolean;
};

export async function loginAction(
  _prevState: AuthState<LoginInput>,
  formData: FormData,
): Promise<AuthState<LoginInput>> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten()
        .fieldErrors as AuthState<LoginInput>["fieldErrors"],
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

  redirect("/dashboard");
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

  redirect(
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
    {
      redirectTo: `${APP_URL}/api/auth/callback?next=/update-password`,
    },
  );

  if (error) {
    return { error: error.message };
  }

  redirect("/verify?type=reset&email=" + encodeURIComponent(parsed.data.email));
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

  redirect("/dashboard");
}
