import { z } from "zod";

export const inviteClientSchema = z.object({
  email: z.string().trim().email({ message: "A valid email is required." }),
  companyName: z
    .string()
    .trim()
    .min(1, { message: "Company name is required." })
    .max(120, { message: "Company name must be 120 characters or less." }),
  contactName: z
    .string()
    .trim()
    .min(1, { message: "Contact name is required." })
    .max(120, { message: "Contact name must be 120 characters or less." }),
});

export type InviteClientInput = z.infer<typeof inviteClientSchema>;

// Accept Invite - Sign Up Schema
export const acceptInviteSignUpSchema = z
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

export type AcceptInviteSignUpInput = z.infer<typeof acceptInviteSignUpSchema>;

// Accept Invite - Sign In Schema
export const acceptInviteSignInSchema = z.object({
  token: z.string().min(1, "Invalid invitation token."),
  email: z.string().email(), // Read-only, but validated
  password: z.string().min(1, { message: "Password is required." }),
});

export type AcceptInviteSignInInput = z.infer<typeof acceptInviteSignInSchema>;
