"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Upload,
  X,
  Check,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  updateBrandingAction,
  uploadLogoAction,
  removeLogoAction,
} from "@/features/settings/server/brandingActions";
import {
  shiftOklchLightness,
  getContrastTextColor,
} from "@/features/portal/components/PortalThemeProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrgBranding {
  name: string;
  brandName: string | null;
  logoUrl: string | null;
  logoMarkUrl: string | null;
  faviconUrl: string | null;
  accentColor: string | null;
  accentColorDark: string | null;
  poweredByHidden: boolean;
  customEmailFromName: string | null;
  customEmailDomain: string | null;
  customEmailVerified: boolean;
  plan: string;
}

interface BrandingSettingsProps {
  org: OrgBranding;
  orgId: string;
}

// ─── WCAG Contrast calculation ───────────────────────────────────────────────

function getRelativeLuminance(hex: string): number | null {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  if (full.length !== 6) return null;
  const toLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const r = toLinear(parseInt(full.slice(0, 2), 16) / 255);
  const g = toLinear(parseInt(full.slice(2, 4), 16) / 255);
  const b = toLinear(parseInt(full.slice(4, 6), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(hex1: string, hex2: string): number | null {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  if (l1 === null || l2 === null) return null;
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

interface ContrastResult {
  ratio: number | null;
  label: string;
  variant: "pass" | "warn" | "fail";
}

function evaluateContrast(accentColor: string): ContrastResult {
  if (!accentColor.startsWith("#")) {
    return { ratio: null, label: "N/A (oklch)", variant: "pass" };
  }
  const textColor = getContrastTextColor(accentColor);
  const ratio = getContrastRatio(
    accentColor,
    textColor === "#ffffff" ? "#ffffff" : "#1a1a1a",
  );
  if (ratio === null)
    return { ratio: null, label: "Invalid color", variant: "fail" };
  if (ratio >= 4.5) return { ratio, label: "AA pass", variant: "pass" };
  if (ratio >= 3.0)
    return { ratio, label: "AA fail (large text only)", variant: "warn" };
  return { ratio, label: "AAA fail", variant: "fail" };
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({
  label,
  hint,
  currentUrl,
  variant,
  accept,
  onUploaded,
  onRemoved,
}: {
  label: string;
  hint: string;
  currentUrl: string | null;
  variant: "logo" | "logoMark" | "favicon";
  accept: string;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      setError(null);
      startTransition(async () => {
        const result = await uploadLogoAction(fd, variant);
        if (result.success && result.url) {
          onUploaded(result.url);
        } else {
          setError(result.error ?? "Upload failed");
        }
      });
    },
    [variant, onUploaded],
  );

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <p className="text-muted-foreground text-xs">{hint}</p>

      {currentUrl ? (
        <div className="bg-muted/30 flex items-center gap-3 rounded-lg border p-3">
          <div className="bg-checkerboard flex h-12 w-20 items-center justify-center rounded border">
            <Image
              src={currentUrl}
              alt={label}
              width={80}
              height={48}
              className="h-10 w-auto max-w-[76px] object-contain"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              <Check className="mr-1 inline h-3 w-3" />
              Uploaded
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-red-500 hover:text-red-600"
              onClick={() => {
                startTransition(async () => {
                  await removeLogoAction(variant);
                  onRemoved();
                });
              }}
              disabled={isPending}
            >
              <X className="mr-1 h-3 w-3" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors",
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
              : "border-border hover:border-muted-foreground/50 hover:bg-muted/20",
            isPending && "pointer-events-none opacity-50",
          )}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
        >
          {isPending ? (
            <RefreshCw className="text-muted-foreground h-5 w-5 animate-spin" />
          ) : (
            <Upload className="text-muted-foreground h-5 w-5" />
          )}
          <p className="text-muted-foreground text-xs">
            {isPending ? "Uploading…" : "Drop file or click to browse"}
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Live Portal Preview ──────────────────────────────────────────────────────

function PortalPreview({
  brandName,
  logoUrl,
  accentColor,
}: {
  brandName: string;
  logoUrl: string | null;
  accentColor: string;
}) {
  const textColor = getContrastTextColor(accentColor);
  const darkColor = shiftOklchLightness(accentColor, -0.08);

  return (
    <div className="overflow-hidden rounded-xl border shadow-sm">
      {/* Mock portal header */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-3 dark:bg-zinc-900">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={brandName}
            width={100}
            height={28}
            className="h-7 w-auto max-w-[120px] object-contain"
          />
        ) : (
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
            {brandName}
          </span>
        )}
        <div className="flex gap-2">
          <div className="h-2 w-12 rounded bg-zinc-100 dark:bg-zinc-700" />
          <div className="h-2 w-10 rounded bg-zinc-100 dark:bg-zinc-700" />
        </div>
      </div>

      {/* Mock portal content */}
      <div className="space-y-4 bg-zinc-50 p-4 dark:bg-zinc-800">
        {/* CTA button preview */}
        <div className="flex items-center gap-3">
          <button
            style={{ backgroundColor: accentColor, color: textColor }}
            className="rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
          >
            Approve Files
          </button>
          <button
            style={{ color: accentColor }}
            className="text-sm font-medium underline-offset-2 hover:underline"
          >
            View invoice
          </button>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>Project progress</span>
            <span>65%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              style={{ backgroundColor: accentColor, width: "65%" }}
              className="h-2 rounded-full transition-all"
            />
          </div>
        </div>

        {/* Active nav item */}
        <div
          style={{ borderLeftColor: accentColor, color: accentColor }}
          className="border-l-2 bg-white/60 px-3 py-2 text-sm font-medium dark:bg-zinc-900/60"
        >
          Overview
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BrandingSettings({
  org,
  orgId: _orgId,
}: BrandingSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Local state mirrors org values and updates live as user types
  const [brandName, setBrandName] = useState(org.brandName ?? "");
  const [accentColor, setAccentColor] = useState(org.accentColor ?? "#3b82f6");
  const [accentColorInput, setAccentColorInput] = useState(
    org.accentColor ?? "#3b82f6",
  );
  const [poweredByHidden, setPoweredByHidden] = useState(org.poweredByHidden);
  const [customEmailFromName, setCustomEmailFromName] = useState(
    org.customEmailFromName ?? "",
  );
  const [logoUrl, setLogoUrl] = useState(org.logoUrl);
  const [logoMarkUrl, setLogoMarkUrl] = useState(org.logoMarkUrl);
  const [faviconUrl, setFaviconUrl] = useState(org.faviconUrl);

  const contrast = evaluateContrast(accentColor);
  const effectiveBrandName = brandName.trim() || org.name;

  const handleSave = () => {
    setSaved(false);
    setSaveError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("brandName", brandName);
      fd.set("accentColor", accentColor);
      fd.set("poweredByHidden", String(poweredByHidden));
      fd.set("customEmailFromName", customEmailFromName);
      const result = await updateBrandingAction(fd);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setSaveError(result.error ?? "Save failed");
      }
    });
  };

  const syncColorInputs = (value: string) => {
    setAccentColorInput(value);
    // Only update the live preview color if it looks valid
    if (
      /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value) ||
      /oklch\(\s*[\d.]+%?\s+[\d.]+\s+[\d.]+\s*\)/i.test(value)
    ) {
      setAccentColor(value);
    }
  };

  return (
    <div className="space-y-10">
      {/* ─── Section 1: Logos ─────────────────────────────────────────────── */}
      <section>
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Logo &amp; Assets</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Upload your agency logo. Clients will see this instead of
            "ClientSpace" in the portal header.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <UploadZone
            label="Primary Logo"
            hint="PNG, SVG, or WebP · max 5MB · shown in portal header"
            currentUrl={logoUrl}
            variant="logo"
            accept="image/png,image/svg+xml,image/webp"
            onUploaded={(url) => setLogoUrl(url)}
            onRemoved={() => setLogoUrl(null)}
          />
          <UploadZone
            label="Logo Mark"
            hint="Square icon version · shown in small contexts"
            currentUrl={logoMarkUrl}
            variant="logoMark"
            accept="image/png,image/svg+xml,image/webp"
            onUploaded={(url) => setLogoMarkUrl(url)}
            onRemoved={() => setLogoMarkUrl(null)}
          />
          <UploadZone
            label="Favicon"
            hint=".ico or 32×32 / 64×64 PNG · shown in browser tab"
            currentUrl={faviconUrl}
            variant="favicon"
            accept="image/x-icon,image/png,image/svg+xml"
            onUploaded={(url) => setFaviconUrl(url)}
            onRemoved={() => setFaviconUrl(null)}
          />
        </div>
      </section>

      <hr className="border-border" />

      {/* ─── Section 2: Brand Colors ──────────────────────────────────────── */}
      <section>
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Brand Colors</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Set your accent color for buttons, links, and active nav items in
            the client portal.
          </p>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="space-y-3">
            <Label htmlFor="colorPicker">Accent color</Label>
            <div className="flex items-center gap-3">
              <input
                id="colorPicker"
                type="color"
                value={accentColor.startsWith("#") ? accentColor : "#3b82f6"}
                onChange={(e) => {
                  setAccentColor(e.target.value);
                  setAccentColorInput(e.target.value);
                }}
                className="h-10 w-14 cursor-pointer rounded border p-0.5"
              />
              <Input
                id="colorInput"
                value={accentColorInput}
                onChange={(e) => syncColorInputs(e.target.value)}
                placeholder="#3b82f6 or oklch(0.6 0.2 280)"
                className="w-56 font-mono text-sm"
              />
            </div>

            {/* WCAG contrast badge */}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                  contrast.variant === "pass" &&
                    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
                  contrast.variant === "warn" &&
                    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
                  contrast.variant === "fail" &&
                    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
                )}
              >
                {contrast.variant === "pass" && <Check className="h-3 w-3" />}
                {contrast.variant === "warn" && (
                  <AlertTriangle className="h-3 w-3" />
                )}
                {contrast.variant === "fail" && (
                  <AlertCircle className="h-3 w-3" />
                )}
                {contrast.label}
                {contrast.ratio && ` (${contrast.ratio.toFixed(2)}:1)`}
              </span>
            </div>
          </div>

          {/* Live preview */}
          <div className="flex-1">
            <Label className="mb-2 block">Live preview</Label>
            <PortalPreview
              brandName={effectiveBrandName}
              logoUrl={logoUrl}
              accentColor={accentColor}
            />
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* ─── Section 3: Brand Name ────────────────────────────────────────── */}
      <section>
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Portal Display Name</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            What clients see in the portal header when no logo is set. Defaults
            to your organization name.
          </p>
        </div>

        <div className="max-w-sm space-y-2">
          <Label htmlFor="brandName">Display name</Label>
          <Input
            id="brandName"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value.slice(0, 50))}
            placeholder={org.name}
            maxLength={50}
          />
          <p className="text-muted-foreground text-right text-xs">
            {brandName.length}/50
          </p>
        </div>
      </section>

      <hr className="border-border" />

      {/* ─── Section 4: Email Branding ────────────────────────────────────── */}
      <section>
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Email Branding</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Customize how your agency appears in outgoing emails. Configure a
            custom domain in the Email Domain section below.
          </p>
        </div>

        <div className="max-w-sm space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fromName">From name</Label>
            <Input
              id="fromName"
              value={customEmailFromName}
              onChange={(e) => setCustomEmailFromName(e.target.value)}
              placeholder={org.name}
              maxLength={100}
            />
          </div>

          {/* Email preview */}
          <div className="bg-muted/40 space-y-1 rounded-lg border p-3">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Preview
            </p>
            <p className="text-sm">
              <span className="font-medium">
                {customEmailFromName.trim() || org.name}
              </span>{" "}
              <span className="text-muted-foreground">
                &lt;
                {org.customEmailVerified && org.customEmailDomain
                  ? `hello@${org.customEmailDomain}`
                  : `noreply@clientspace.qzz.io`}
                &gt;
              </span>
            </p>
          </div>

          {org.customEmailDomain && (
            <div className="flex items-center gap-2 text-xs">
              {org.customEmailVerified ? (
                <span className="flex items-center gap-1 text-green-600">
                  <Check className="h-3 w-3" />
                  {org.customEmailDomain} verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  {org.customEmailDomain} — DNS verification pending
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      <hr className="border-border" />

      {/* ─── Section 5: Enterprise Controls ──────────────────────────────── */}
      <section>
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Enterprise Controls</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Remove ClientSpace attribution from client-facing pages.
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            id="poweredByHidden"
            checked={poweredByHidden}
            onChange={(e) => setPoweredByHidden(e.target.checked)}
            className="mt-1 h-4 w-4 rounded"
          />
          <div>
            <p className="text-sm font-medium">
              Hide "Powered by ClientSpace" footer
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              When enabled, the ClientSpace attribution is completely removed
              from the client portal footer.
            </p>
          </div>
        </label>
      </section>

      {/* ─── Save button ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-t pt-6">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="min-w-[120px]"
        >
          {isPending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : saved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Saved
            </>
          ) : (
            "Save branding"
          )}
        </Button>

        {saveError && (
          <p className="flex items-center gap-1 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {saveError}
          </p>
        )}
      </div>
    </div>
  );
}
