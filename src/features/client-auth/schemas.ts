import { z } from "zod";

/**
 * Client Sign Up Schema
 * Used when a client creates a new account via invitation link
 */
export const clientSignUpSchema = z
  .object({
    token: z.string().min(1, "Invalid invitation token."),
    email: z.string().email(), // Read-only, but validated
    name: z
      .string()
      .trim()
      .min(2, { message: "Name must be at least 2 characters." })
      .max(100, { message: "Name must be 100 characters or less." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .max(72, { message: "Password must be 72 characters or less." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ClientSignUpInput = z.infer<typeof clientSignUpSchema>;

/**
 * Client Sign In Schema
 * Used when an existing client user accepts a new invitation
 * (Multi-org scenario: client already has account, joining another org)
 */
export const clientSignInSchema = z.object({
  token: z.string().min(1, "Invalid invitation token."),
  email: z.string().email(), // Read-only, but validated
  password: z.string().min(1, { message: "Password is required." }),
});

export type ClientSignInInput = z.infer<typeof clientSignInSchema>;
