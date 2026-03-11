/**
 * Authentication Validation Schemas
 * ---------------------------------
 * Centralized Zod schemas for validating authentication forms.
 *
 * This file defines:
 *  - Login form validation rules
 *  - Sign-up form validation rules
 *  - Strongly typed TypeScript types inferred from schemas
 *
 * These schemas act as the single source of truth for:
 *  - Client-side validation
 *  - Form type safety
 *  - Error message consistency
 */

import { z } from "zod";

/**
 * loginSchema
 * ----------------
 * Validation rules for the login form.
 *
 * Rules:
 *  - Email must be a valid email format
 *  - Email cannot be empty
 *  - Password must be at least 8 characters
 */
export const loginSchema = z.object({
  email: z.email().min(1, "Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * signupSchema
 * ----------------
 * Validation rules for the signup form.
 *
 * Rules:
 *  - Name must be at least 2 characters
 *  - Email must be a valid email format
 *  - Email cannot be empty
 *  - Password must be at least 8 characters
 *  - Password must contain at least one uppercase letter
 *  - Password must contain at least one lowercase letter
 *  - Password must contain at least one number
 *  - Password must contain at least one special character
 *  - Confirm password must match password
 */

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.email().min(1, "Email is required"),
    password: z
      .string()
      .regex(
        passwordRegex,
        "Password must contain uppercase, lowercase, number, and special character.",
      )
      .min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

/**
 * resetPasswordSchema
 * ----------------
 * Validation rules for the reset password form.
 *
 * Rules:
 *  - Email must be a valid email format
 *  - Email cannot be empty
 */
export const resetPasswordSchema = z.object({
  email: z.email("Please enter a valid email address."),
});

/**
 * updatePasswordSchema
 * ----------------
 * Validation rules for the update password form.
 *
 * Rules:
 *  - Password must be at least 8 characters
 *  - Confirm password must match password
 */
export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

/**
 * verifyOtpSchema
 * ----------------
 * Validation rules for the OTP verification form.
 *
 * Rules:
 *  - Token must be exactly 8 characters long
 */
export const verifyOtpSchema = z.object({
  token: z.string().length(8, "OTP must be exactly 8 digits."),
  email: z.email(),
  type: z.enum(["signup", "recovery"]),
});

/**
 * resendOtpSchema
 * ----------------
 * Validation rules for resending OTPs.
 */
export const resendOtpSchema = z.object({
  email: z.email(),
  type: z.enum(["signup", "recovery"]),
});

/**
 * Type Aliases
 * ----------------
 * TypeScript types inferred from Zod schemas.
 */
export type LoginFormType = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
