import { z } from "zod";

export const createOrgSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be at most 100 characters")
    .trim(),
  type: z.enum(["freelancer", "agency"], {
    message: "Please select your organization type",
  }),
});

export type CreateOrgInput = z.infer<typeof createOrgSchema>;

export const onboardClientSchema = z.object({
  companyName: z.string().min(2, "Company name is required").trim(),
  contactName: z.string().min(2, "Contact name is required").trim(),
  email: z.string().email("Please enter a valid email address").trim(),
});

export type OnboardClientInput = z.infer<typeof onboardClientSchema>;
