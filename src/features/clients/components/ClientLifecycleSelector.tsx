"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { gooeyToast as toast } from "@/components/ui/goey-toaster";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Archive,
  ChevronDown,
} from "lucide-react";
import type { ClientLifecycleStatus } from "../server/router";

// ─── Config ───────────────────────────────────────────────────────────────────

interface LifecycleOption {
  value: ClientLifecycleStatus;
  label: string;
  description: string;
  colorClass: string;
  dotClass: string;
  Icon: React.ComponentType<any>;
}

const LIFECYCLE_OPTIONS: LifecycleOption[] = [
  {
    value: "prospect",
    label: "Prospect",
    description: "Potential client — not yet active",
    colorClass: "text-purple-500",
    dotClass: "bg-purple-500",
    Icon: Sparkles,
  },
  {
    value: "active",
    label: "Active",
    description: "Currently engaged on work",
    colorClass: "text-emerald-500",
    dotClass: "bg-emerald-500",
    Icon: CheckCircle2,
  },
  {
    value: "on_hold",
    label: "On Hold",
    description: "Paused — check back in",
    colorClass: "text-amber-500",
    dotClass: "bg-amber-500",
    Icon: PauseCircle,
  },
  {
    value: "churned",
    label: "Churned",
    description: "Relationship ended",
    colorClass: "text-red-500",
    dotClass: "bg-red-500",
    Icon: XCircle,
  },
  {
    value: "archived",
    label: "Archived",
    description: "Fully closed — read-only",
    colorClass: "text-slate-400",
    dotClass: "bg-slate-400",
    Icon: Archive,
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface ClientLifecycleSelectorProps {
  clientId: string;
  currentStatus: ClientLifecycleStatus;
  role: "owner" | "admin" | "member" | "client";
  onSuccess?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClientLifecycleSelector({
  clientId,
  currentStatus,
  role,
  onSuccess,
}: ClientLifecycleSelectorProps) {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const updateLifecycle = trpc.clients.updateLifecycle.useMutation({
    onSuccess: (data) => {
      const label = data.lifecycleStatus?.replace("_", " ") ?? "updated";
      toast.success(`Status updated to ${label}`);
      utils.clients.getClientById.invalidate({ clientId });
      utils.clients.getBootstrap.invalidate();
      onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });

  const current: LifecycleOption =
    LIFECYCLE_OPTIONS.find((o) => o.value === currentStatus) ??
    LIFECYCLE_OPTIONS[1]!;
  const canChange = role === "owner" || role === "admin";

  function handleSelect(status: ClientLifecycleStatus) {
    if (status === currentStatus) {
      setOpen(false);
      return;
    }
    updateLifecycle.mutate({ clientId, lifecycleStatus: status });
    setOpen(false);
  }

  return (
    <div className="relative inline-block">
      {/* Trigger */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Client status: ${current.label}`}
        disabled={!canChange || updateLifecycle.isPending}
        onClick={() => canChange && setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-colors",
          "border border-current/20 bg-current/5",
          current.colorClass,
          canChange && "cursor-pointer hover:bg-current/10",
          !canChange && "cursor-default",
          updateLifecycle.isPending && "opacity-60",
        )}
      >
        <span
          className={cn("h-1.5 w-1.5 rounded-full", current.dotClass)}
          aria-hidden="true"
        />
        {current.label}
        {canChange && (
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            aria-label="Select client lifecycle status"
            className={cn(
              "absolute left-0 top-full z-20 mt-1.5 w-60 overflow-hidden rounded-xl border",
              "border-border bg-popover text-popover-foreground shadow-xl",
              "animate-in fade-in-0 zoom-in-95 duration-150",
            )}
          >
            {LIFECYCLE_OPTIONS.map((option) => {
              const Icon = option.Icon;
              const isSelected = option.value === currentStatus;
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(option.value);
                    }
                  }}
                  tabIndex={0}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 px-3 py-2.5 transition-colors",
                    "hover:bg-muted/50 focus:bg-muted/50 focus:outline-none",
                    isSelected && "bg-muted/30",
                  )}
                >
                  <Icon
                    className={cn("mt-0.5 h-4 w-4 shrink-0", option.colorClass)}
                    aria-hidden="true"
                  />
                  <div>
                    <p
                      className={cn(
                        "text-[12px] font-semibold",
                        option.colorClass,
                      )}
                    >
                      {option.label}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-[11px]">
                      {option.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
