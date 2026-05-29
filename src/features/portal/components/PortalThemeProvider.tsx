"use client";

import { useEffect } from "react";

export interface PortalTheme {
  accentColor: string | null;
  accentColorDark: string | null;
  logoUrl: string | null;
  logoMarkUrl: string | null;
  brandName: string;
  poweredByHidden: boolean;
  faviconUrl: string | null;
}

// ─── Pure-JS sRGB → OKLab → OKLCH color math ─────────────────────────────────
// No external library — avoids bundle bloat and server/client hydration issues.

/** Parse a hex color (#rrggbb or #rgb) to [r,g,b] in [0,1] range. */
function hexToLinearRgb(hex: string): [number, number, number] | null {
  const h = hex.replace("#", "");
  const full = h.length === 3
    ? h.split("").map((c) => c + c).join("")
    : h;
  if (full.length !== 6) return null;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  // sRGB → linear
  const toLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return [toLinear(r), toLinear(g), toLinear(b)];
}

/** Parse oklch(L C H) string to { l, c, h }. Returns null on failure. */
function parseOklch(color: string): { l: number; c: number; h: number } | null {
  const m = color.match(
    /oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*\)/i,
  );
  if (!m) return null;
  const m1 = m[1] ?? "";
  const m2 = m[2] ?? "";
  const m3 = m[3] ?? "";
  const l = m1.endsWith("%") ? parseFloat(m1) / 100 : parseFloat(m1);
  return { l, c: parseFloat(m2), h: parseFloat(m3) };
}

/** Convert linear sRGB [0,1] to OKLCH. Returns { l, c, h }. */
function linearRgbToOklch(
  lr: number,
  lg: number,
  lb: number,
): { l: number; c: number; h: number } {
  // Linear sRGB → LMS (OKLab matrix)
  const lms_l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const lms_m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const lms_s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  // Cube-root
  const l_ = Math.cbrt(lms_l);
  const m_ = Math.cbrt(lms_m);
  const s_ = Math.cbrt(lms_s);
  // LMS → OKLab
  const labL = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const labA = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const labB = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  // OKLab → OKLCH
  const c = Math.sqrt(labA * labA + labB * labB);
  const h = ((Math.atan2(labB, labA) * 180) / Math.PI + 360) % 360;
  return { l: labL, c, h };
}

/**
 * Shift the L (lightness) of any color by `delta`.
 * Accepts hex (#rrggbb) or oklch(L C H) strings.
 * Returns an oklch(...) CSS string.
 * Clamps L to [0, 1].
 */
export function shiftOklchLightness(color: string, delta: number): string {
  const fallback = "oklch(0.5 0.15 280)";
  try {
    // Try parsing as oklch first
    const parsed = parseOklch(color);
    if (parsed) {
      const l = Math.max(0, Math.min(1, parsed.l + delta));
      return `oklch(${l.toFixed(4)} ${parsed.c.toFixed(4)} ${parsed.h.toFixed(2)})`;
    }
    // Fall back to hex
    const linear = hexToLinearRgb(color);
    if (!linear) return fallback;
    const oklch = linearRgbToOklch(...linear);
    const l = Math.max(0, Math.min(1, oklch.l + delta));
    return `oklch(${l.toFixed(4)} ${oklch.c.toFixed(4)} ${oklch.h.toFixed(2)})`;
  } catch {
    return fallback;
  }
}

/**
 * Returns '#ffffff' or '#1a1a1a' based on the WCAG relative luminance of the color.
 * Uses the W3C formula: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function getContrastTextColor(color: string): string {
  try {
    let lr: number, lg: number, lb: number;

    const oklch = parseOklch(color);
    if (oklch) {
      // Approximate: for oklch we use lightness directly as a proxy
      // L > 0.6 in oklch correlates with a light color needing dark text
      return oklch.l > 0.6 ? "#1a1a1a" : "#ffffff";
    }

    const linear = hexToLinearRgb(color);
    if (!linear) return "#1a1a1a";
    [lr, lg, lb] = linear;

    // WCAG relative luminance
    const Y = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
    // Y > 0.179 → contrast ratio with white is < 4.5:1, so use dark text
    return Y > 0.179 ? "#1a1a1a" : "#ffffff";
  } catch {
    return "#1a1a1a";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PortalThemeProvider({
  theme,
  children,
}: {
  theme: PortalTheme;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const root = document.documentElement;

    if (theme.accentColor) {
      try {
        root.style.setProperty("--portal-accent", theme.accentColor);
        root.style.setProperty(
          "--portal-accent-dark",
          theme.accentColorDark ??
            shiftOklchLightness(theme.accentColor, -0.08),
        );
        root.style.setProperty(
          "--portal-accent-light",
          shiftOklchLightness(theme.accentColor, 0.35),
        );
        root.style.setProperty(
          "--portal-accent-text",
          getContrastTextColor(theme.accentColor),
        );
      } catch (err) {
        // Graceful degradation — invalid color string; fall back to CSS defaults
        console.warn("[PortalThemeProvider] Failed to inject accent color:", err);
      }
    }

    if (theme.faviconUrl) {
      try {
        let link = document.querySelector(
          "link[rel~='icon']",
        ) as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement("link");
          document.head.appendChild(link);
        }
        link.type = "image/x-icon";
        link.rel = "shortcut icon";
        link.href = theme.faviconUrl;
      } catch (err) {
        console.warn("[PortalThemeProvider] Failed to update favicon:", err);
      }
    }

    return () => {
      // Clean up on unmount (e.g. navigating back to agency dashboard)
      root.style.removeProperty("--portal-accent");
      root.style.removeProperty("--portal-accent-dark");
      root.style.removeProperty("--portal-accent-light");
      root.style.removeProperty("--portal-accent-text");
    };
  }, [theme.accentColor, theme.faviconUrl, theme.accentColorDark]);

  return <>{children}</>;
}
