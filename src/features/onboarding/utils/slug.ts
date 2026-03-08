/**
 * Generate a URL-safe slug from an organization name.
 * Appends a 4-character random suffix to reduce collision probability.
 *
 * Example: "Acme Design Studio" → "acme-design-studio-x7k2"
 */
export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special chars (keep word chars, spaces, hyphens)
    .replace(/[\s_]+/g, "-") // Collapse spaces and underscores to single hyphens
    .replace(/-+/g, "-") // Collapse consecutive hyphens
    .replace(/^-|-$/g, ""); // Trim leading/trailing hyphens

  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}
