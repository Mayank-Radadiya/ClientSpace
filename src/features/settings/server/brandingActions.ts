"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withRLS } from "@/db/createDrizzleClient";
import { organizations } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";

// ─── Validation schemas ───────────────────────────────────────────────────────

const hexOrOklchRegex =
  /^(#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})|oklch\(\s*[\d.]+%?\s+[\d.]+\s+[\d.]+\s*\))$/;

/**
 * Validates that an oklch chroma value (C) is within displayable gamut.
 * C <= 0.37 covers the P3 gamut boundary for most hues.
 */
function validateChroma(color: string | null): boolean {
  if (!color) return true;
  const m = color.match(/oklch\(\s*[\d.]+%?\s+([\d.]+)\s+/i);
  if (!m) return true; // Not oklch — hex is always valid
  const c = parseFloat(m[1] ?? "0");
  return c <= 0.37;
}

const updateBrandingSchema = z.object({
  brandName: z.string().max(50, "Brand name must be 50 characters or less").nullable(),
  accentColor: z
    .string()
    .regex(hexOrOklchRegex, "Must be a valid hex (#rrggbb) or oklch() color")
    .refine(validateChroma, "oklch chroma (C) must be ≤ 0.37 (displayable P3 gamut)")
    .nullable(),
  accentColorDark: z
    .string()
    .regex(hexOrOklchRegex, "Must be a valid hex (#rrggbb) or oklch() color")
    .nullable(),
  poweredByHidden: z.boolean(),
  customEmailFromName: z.string().max(100).nullable(),
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_LOGO_TYPES = ["image/png", "image/svg+xml", "image/webp"];
const ALLOWED_FAVICON_TYPES = ["image/x-icon", "image/png", "image/svg+xml"];
const BUCKET = "org-assets";

// ─── Update branding settings ─────────────────────────────────────────────────

export async function updateBrandingAction(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const raw = {
    brandName: formData.get("brandName") as string | null,
    accentColor: formData.get("accentColor") as string | null,
    accentColorDark: formData.get("accentColorDark") as string | null,
    poweredByHidden: formData.get("poweredByHidden") === "true",
    customEmailFromName: formData.get("customEmailFromName") as string | null,
  };

  const parsed = updateBrandingSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const data = parsed.data;

  await withRLS({ userId: ctx.userId, orgId: ctx.orgId }, async (tx) => {
    await tx
      .update(organizations)
      .set({
        brandName: data.brandName || null,
        accentColor: data.accentColor || null,
        accentColorDark: data.accentColorDark || null,
        poweredByHidden: data.poweredByHidden,
        customEmailFromName: data.customEmailFromName || null,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, ctx.orgId));
  });

  revalidatePath("/settings/branding");
  return { success: true };
}

// ─── Upload logo / logo mark ──────────────────────────────────────────────────

export async function uploadLogoAction(
  formData: FormData,
  variant: "logo" | "logoMark" | "favicon" = "logo",
) {
  const ctx = await getSessionContext();
  if (!ctx) return { success: false, error: "Unauthorized" };
  const supabase = await createClient();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "No file provided." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "File must be 5MB or less." };
  }

  const allowedTypes = variant === "favicon" ? ALLOWED_FAVICON_TYPES : ALLOWED_LOGO_TYPES;
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: `Unsupported file type. Allowed: ${allowedTypes.join(", ")}`,
    };
  }

  // SVG sanitization — strip <script> tags, event handlers, and external references
  let fileBuffer: ArrayBuffer | Buffer = await file.arrayBuffer();
  if (file.type === "image/svg+xml") {
    const svgText = new TextDecoder().decode(fileBuffer);
    const sanitized = sanitizeSvg(svgText);
    if (!sanitized) {
      return { success: false, error: "Invalid SVG file." };
    }
    fileBuffer = Buffer.from(sanitized);
  }

  // Enforce path convention: {orgId}/{variant}-{timestamp}.{ext}
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const filename = `${variant}-${Date.now()}.${ext}`;
  const storagePath = `${ctx.orgId}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return { success: false, error: `Upload failed: ${uploadError.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  // Persist the URL in organizations
  const columnMap = {
    logo: "logoUrl",
    logoMark: "logoMarkUrl",
    favicon: "faviconUrl",
  } as const;

  await withRLS({ userId: ctx.userId, orgId: ctx.orgId }, async (tx) => {
    await tx
      .update(organizations)
      .set({
        [columnMap[variant]]: publicUrl,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, ctx.orgId));
  });

  revalidatePath("/settings/branding");
  return { success: true, url: publicUrl };
}

// ─── Remove logo ─────────────────────────────────────────────────────────────

export async function removeLogoAction(
  variant: "logo" | "logoMark" | "favicon",
) {
  const ctx = await getSessionContext();
  if (!ctx) return { success: false };

  const columnMap = {
    logo: "logoUrl",
    logoMark: "logoMarkUrl",
    favicon: "faviconUrl",
  } as const;

  await withRLS({ userId: ctx.userId, orgId: ctx.orgId }, async (tx) => {
    await tx
      .update(organizations)
      .set({ [columnMap[variant]]: null, updatedAt: new Date() })
      .where(eq(organizations.id, ctx.orgId));
  });

  revalidatePath("/settings/branding");
  return { success: true };
}

// ─── SVG sanitizer (server-side, no DOMPurify/jsdom needed) ──────────────────
// Strips <script>, event attributes, external references, and data: URIs.
// This is a defense-in-depth strip for SVG uploads stored in Supabase.

function sanitizeSvg(svg: string): string | null {
  if (!svg.trim().toLowerCase().includes("<svg")) return null;

  let result = svg;

  // Remove <script> blocks (case-insensitive, multiline)
  result = result.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  result = result.replace(/<script[^>]*\/>/gi, "");

  // Remove event handler attributes (on*)
  result = result.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
  result = result.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, "");

  // Remove javascript: hrefs and src attributes
  result = result.replace(/\s+href\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, "");
  result = result.replace(/\s+src\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, "");

  // Remove data: URIs (can embed scripts in SVG <image> elements)
  result = result.replace(/\s+href\s*=\s*["']?\s*data:[^"'\s>]*/gi, "");
  result = result.replace(/\s+src\s*=\s*["']?\s*data:[^"'\s>]*/gi, "");

  // Remove <use> elements with external references (can be exploited for XSS)
  result = result.replace(/<use[^>]+href\s*=\s*["']https?:\/\/[^"']*["'][^>]*\/?>/gi, "");

  // Remove <?xml-stylesheet?> processing instructions (can load external CSS)
  result = result.replace(/<\?xml-stylesheet[\s\S]*?\?>/gi, "");

  // Remove <foreignObject> (can embed HTML)
  result = result.replace(/<foreignObject[\s\S]*?>[\s\S]*?<\/foreignObject>/gi, "");
  result = result.replace(/<foreignObject[^>]*\/>/gi, "");

  return result;
}
