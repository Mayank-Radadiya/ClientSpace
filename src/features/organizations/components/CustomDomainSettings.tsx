"use client";

// src/features/organizations/components/CustomDomainSettings.tsx
// Self-serve custom domain management UI for agencies.
// Follows Linear/Vercel settings quality — polished, trust-inspiring, professional.

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Icons (inline SVGs — no extra dependency) ────────────────────────────────

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
    >
      <polyline points="2,8 6,12 14,4" />
    </svg>
  );
}

function IconCopy({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-3.5 w-3.5", className)}
    >
      <rect x="4" y="4" width="9" height="9" rx="1.5" />
      <path d="M3 12H2.5A1.5 1.5 0 011 10.5V3A1.5 1.5 0 012.5 1.5H9A1.5 1.5 0 0110.5 3V4" />
    </svg>
  );
}

function IconExternalLink({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-3.5 w-3.5", className)}
    >
      <path d="M6.5 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V9.5" />
      <polyline points="9,2 14,2 14,7" />
      <line x1="8" y1="8" x2="14" y2="2" />
    </svg>
  );
}

function IconAlert({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
    >
      <circle cx="8" cy="8" r="7" />
      <line x1="8" y1="5" x2="8" y2="8" />
      <circle cx="8" cy="11" r="0.5" fill="currentColor" />
    </svg>
  );
}

function IconGlobe({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
    >
      <circle cx="8" cy="8" r="7" />
      <ellipse cx="8" cy="8" rx="3" ry="7" />
      <line x1="1" y1="8" x2="15" y2="8" />
    </svg>
  );
}

// ── Helper Components ────────────────────────────────────────────────────────

function CopyButton({
  value,
  label,
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ${label ?? value}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all duration-150",
        "border border-white/10 bg-white/5 hover:bg-white/10",
        copied
          ? "text-emerald-400"
          : "text-zinc-400 hover:text-zinc-200",
      )}
    >
      {copied ? (
        <>
          <IconCheck className="text-emerald-400" />
          Copied
        </>
      ) : (
        <>
          <IconCopy />
          {label ?? "Copy"}
        </>
      )}
    </button>
  );
}

type DomainStatus = "none" | "pending" | "verifying" | "active" | "error";

function StatusBadge({ status }: { status: DomainStatus }) {
  const config: Record<
    DomainStatus,
    { label: string; className: string; dot: string }
  > = {
    none: {
      label: "Not configured",
      className: "bg-zinc-800 text-zinc-400 border-zinc-700",
      dot: "bg-zinc-500",
    },
    pending: {
      label: "Pending DNS verification",
      className: "bg-amber-950/60 text-amber-400 border-amber-800/50",
      dot: "bg-amber-400 animate-pulse",
    },
    verifying: {
      label: "Verifying DNS propagation",
      className: "bg-blue-950/60 text-blue-400 border-blue-800/50",
      dot: "bg-blue-400 animate-pulse",
    },
    active: {
      label: "Domain active",
      className: "bg-emerald-950/60 text-emerald-400 border-emerald-800/50",
      dot: "bg-emerald-400",
    },
    error: {
      label: "Verification failed",
      className: "bg-red-950/60 text-red-400 border-red-800/50",
      dot: "bg-red-400",
    },
  };

  const c = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        c.className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

function DnsRecordRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex min-w-0 flex-1 items-start gap-6">
        <span className="w-14 shrink-0 text-xs font-medium tracking-wide text-zinc-500 uppercase">
          {label}
        </span>
        <code className="min-w-0 truncate font-mono text-sm text-zinc-100">
          {value}
        </code>
      </div>
      <CopyButton value={value} label={label} />
    </div>
  );
}

function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <h3 className="mb-2 text-base font-semibold text-zinc-100">
          Remove custom domain?
        </h3>
        <p className="mb-6 text-sm leading-relaxed text-zinc-400">
          This will disconnect your domain from ClientSpace. Clients accessing
          your portal via the custom domain will see an error until you
          reconfigure DNS. Your default portal URL will continue to work.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
          >
            {loading ? "Removing…" : "Remove domain"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Form Schema ──────────────────────────────────────────────────────────────

const addDomainFormSchema = z.object({
  domain: z
    .string()
    .min(1, "Domain is required")
    .refine(
      (v) => !v.startsWith("http"),
      "Enter the domain without https:// (e.g. portal.youragency.com)",
    ),
});

type AddDomainForm = z.infer<typeof addDomainFormSchema>;

// ── Props ────────────────────────────────────────────────────────────────────

export interface CustomDomainSettingsProps {
  initialSettings: {
    slug: string;
    customDomain: string | null;
    customDomainVerified: boolean;
    customDomainStatus: DomainStatus;
    customDomainError: string | null;
    customDomainAddedAt: Date | null;
    customDomainVerifiedAt: Date | null;
    cnameTarget: string;
  };
}

// ── Main Component ───────────────────────────────────────────────────────────

export function CustomDomainSettings({ initialSettings }: CustomDomainSettingsProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const utils = trpc.useUtils();

  // ── tRPC mutations & queries ─────────────────────────────────────────────

  const addDomain = trpc.organizations.addEmailDomain.useMutation({
    onSuccess: (data) => {
      toast.success("Domain submitted! Configure your DNS record below.");
      setSettings((prev) => ({
        ...prev,
        customDomain: data.domain,
        customDomainStatus: "pending",
        customDomainVerified: false,
        customDomainError: null,
        customDomainAddedAt: new Date(),
        cnameTarget: prev.cnameTarget, // keep existing cnameTarget
      }));
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const checkStatus = trpc.organizations.getEmailDomainStatus.useQuery(undefined, {
    enabled: false, // manual only — we control polling ourselves
    refetchOnWindowFocus: false,
  });

  const removeDomain = trpc.organizations.removeEmailDomain.useMutation({
    onSuccess: () => {
      toast.success("Custom domain removed.");
      setSettings((prev) => ({
        ...prev,
        customDomain: null,
        customDomainVerified: false,
        customDomainStatus: "none",
        customDomainError: null,
        customDomainAddedAt: null,
        customDomainVerifiedAt: null,
      }));
      setShowConfirmRemove(false);
      stopPolling();
    },
    onError: (err) => {
      toast.error(err.message);
      setShowConfirmRemove(false);
    },
  });

  // ── Polling logic ─────────────────────────────────────────────────────────

  const pollStatus = useCallback(async () => {
    const result = await checkStatus.refetch();
    const data = result.data;
    if (!data) return;

    setLastChecked(new Date());

    if (data.status === "none") return;

    setSettings((prev) => ({
      ...prev,
      customDomainStatus: data.status as DomainStatus,
      customDomainVerified: data.verified ?? false,
      customDomainError: null, // getEmailDomainStatus does not return error field
    }));

    // Stop polling when active or error
    if (data.status === "active" || data.status === "error") {
      stopPolling();
      if (data.status === "active") {
        toast.success("Your custom domain is now active! 🎉");
      }
    }
  }, [checkStatus]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollingRef.current = setInterval(pollStatus, 30_000); // 30s
  }, [pollStatus, stopPolling]);

  // Start polling if domain is in pending/verifying state
  useEffect(() => {
    const shouldPoll =
      settings.customDomainStatus === "pending" ||
      settings.customDomainStatus === "verifying";

    if (shouldPoll) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [settings.customDomainStatus, startPolling, stopPolling]);

  // ── Form ──────────────────────────────────────────────────────────────────

  const form = useForm<AddDomainForm>({
    resolver: zodResolver(addDomainFormSchema),
    defaultValues: { domain: "" },
  });

  const onSubmitDomain = form.handleSubmit((data) => {
    addDomain.mutate({ domain: data.domain });
  });

  // ── Derived state ─────────────────────────────────────────────────────────

  const hasDomain = !!settings.customDomain;
  const isActive = settings.customDomainStatus === "active";
  const isPendingOrVerifying =
    settings.customDomainStatus === "pending" ||
    settings.customDomainStatus === "verifying";
  const isError = settings.customDomainStatus === "error";

  const subdomainPart = settings.customDomain
    ? (() => {
        const parts = settings.customDomain.split(".");
        return parts.length > 2
          ? parts.slice(0, parts.length - 2).join(".")
          : "@";
      })()
    : "portal";

  const lastCheckedText = lastChecked
    ? (() => {
        const diffMs = Date.now() - lastChecked.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        if (diffSec < 60) return "just now";
        const diffMin = Math.floor(diffSec / 60);
        return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
      })()
    : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <ConfirmDialog
        open={showConfirmRemove}
        onConfirm={() => removeDomain.mutate({})}
        onCancel={() => setShowConfirmRemove(false)}
        loading={removeDomain.isPending}
      />

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-sm">
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800">
              <IconGlobe className="text-zinc-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Custom domain
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                White-label your client portal with your own domain
              </p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full border border-violet-700/50 bg-violet-950/50 px-2.5 py-1 text-xs font-medium text-violet-300">
            Pro feature
          </span>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {/* ── Section: Domain Input (when no domain configured) ── */}
          {!hasDomain && (
            <div className="px-6 py-5">
              <p className="mb-4 text-sm text-zinc-400">
                Connect a subdomain from your agency&apos;s domain so clients
                access their portal at <em>your</em> URL instead of
                clientspace.com.
              </p>
              <form onSubmit={onSubmitDomain} className="flex gap-3">
                <div className="flex-1">
                  <input
                    id="custom-domain-input"
                    type="text"
                    placeholder="portal.youragency.com"
                    autoComplete="off"
                    spellCheck="false"
                    className={cn(
                      "w-full rounded-lg border px-3.5 py-2.5 font-mono text-sm placeholder:text-zinc-600",
                      "bg-zinc-800 text-zinc-100 outline-none transition",
                      "focus:ring-2 focus:ring-violet-500/50",
                      form.formState.errors.domain
                        ? "border-red-700 focus:ring-red-500/50"
                        : "border-zinc-700 focus:border-zinc-600",
                    )}
                    {...form.register("domain")}
                  />
                  {form.formState.errors.domain && (
                    <p className="mt-1.5 text-xs text-red-400">
                      {form.formState.errors.domain.message}
                    </p>
                  )}
                </div>
                <button
                  id="connect-domain-btn"
                  type="submit"
                  disabled={addDomain.isPending}
                  className={cn(
                    "shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                    "bg-violet-600 text-white hover:bg-violet-500",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    addDomain.isPending && "animate-pulse",
                  )}
                >
                  {addDomain.isPending ? "Connecting…" : "Connect domain"}
                </button>
              </form>
            </div>
          )}

          {/* ── Section: DNS Configuration Instructions ── */}
          {hasDomain && !isActive && (
            <div className="px-6 py-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="mb-1 text-sm font-medium text-zinc-200">
                    {settings.customDomain}
                  </p>
                  <StatusBadge status={settings.customDomainStatus} />
                </div>
                {lastCheckedText && (
                  <p className="shrink-0 text-xs text-zinc-600">
                    Last checked {lastCheckedText}
                  </p>
                )}
              </div>

              {isError && settings.customDomainError && (
                <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-900/50 bg-red-950/40 px-3.5 py-3">
                  <IconAlert className="mt-0.5 shrink-0 text-red-400" />
                  <p className="text-sm text-red-300">{settings.customDomainError}</p>
                </div>
              )}

              {/* DNS instruction box */}
              <div className="mb-4 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                <div className="border-b border-zinc-800 px-4 py-2.5">
                  <p className="text-xs font-medium text-zinc-400">
                    Add the following DNS record at your domain registrar
                  </p>
                </div>
                <div className="divide-y divide-zinc-800/60 px-4">
                  <DnsRecordRow label="Type" value="CNAME" />
                  <DnsRecordRow label="Name" value={subdomainPart} />
                  <DnsRecordRow label="Value" value={settings.cnameTarget} />
                  <DnsRecordRow label="TTL" value="3600" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  id="check-domain-status-btn"
                  type="button"
                  onClick={pollStatus}
                  disabled={checkStatus.isFetching}
                  className={cn(
                    "rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200",
                    "transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50",
                    checkStatus.isFetching && "animate-pulse",
                  )}
                >
                  {checkStatus.isFetching ? "Checking…" : "Check status"}
                </button>
                <p className="text-xs text-zinc-600">
                  DNS changes can take up to 48 hours to propagate
                </p>
              </div>
            </div>
          )}

          {/* ── Section: Active State ── */}
          {hasDomain && isActive && (
            <div className="px-6 py-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-950 ring-1 ring-emerald-800">
                  <IconCheck className="text-emerald-400" />
                </div>
                <div>
                  <StatusBadge status="active" />
                  <p className="mt-1 text-xs text-zinc-500">
                    DNS verified{" "}
                    {settings.customDomainVerifiedAt
                      ? new Date(settings.customDomainVerifiedAt).toLocaleDateString()
                      : ""}
                  </p>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800/50 px-4 py-3">
                <p className="flex-1 text-sm text-zinc-300">
                  Your client portal is now live at{" "}
                  <a
                    href={`https://${settings.customDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-violet-400 hover:underline"
                  >
                    {settings.customDomain}
                    <IconExternalLink />
                  </a>
                </p>
              </div>

              <button
                id="remove-domain-btn"
                type="button"
                onClick={() => setShowConfirmRemove(true)}
                className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950/60"
              >
                Remove domain
              </button>
            </div>
          )}

          {/* ── If domain exists (any state) — show remove option in pending/error ── */}
          {hasDomain && (isPendingOrVerifying || isError) && (
            <div className="px-6 py-4">
              <button
                id="remove-domain-danger-btn"
                type="button"
                onClick={() => setShowConfirmRemove(true)}
                className="text-xs text-zinc-600 underline-offset-2 transition hover:text-red-400 hover:underline"
              >
                Remove domain and start over
              </button>
            </div>
          )}

          {/* ── Section: Fallback URL reminder ── */}
          <div className="px-6 py-4">
            <p className="text-xs text-zinc-600">
              Your default portal is always available at{" "}
              <a
                href={`https://clientspace.qzz.io/portal/${settings.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-zinc-500 transition hover:text-zinc-400"
              >
                clientspace.qzz.io/portal/{settings.slug}
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
