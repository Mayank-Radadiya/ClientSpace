"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Info, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCents } from "../utils/formatters";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertSeverity = "critical" | "warning" | "info";

export interface ClientHealthAlert {
  severity: AlertSeverity;
  message: string;
  actions: Array<{ label: string; onClick: () => void }>;
  alertType: string; // used as part of sessionStorage dismissal key
}

interface ClientHealthBannerProps {
  clientId: string;
  alert: ClientHealthAlert | null;
  role: "owner" | "admin" | "member" | "client";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Compute alert from client data — call this in the parent and pass the result as `alert`. */
export function computeHealthAlert(client: {
  outstandingAmountCents: number;
  lastActivityAt: string | null;
  activeProjectCount: number;
  invitedAt: string | null;
  lifecycleStatus?: string;
  oldestOverdueDays?: number;
  onSendReminder?: () => void;
  onCreateProject?: () => void;
  onAddNote?: () => void;
  onViewInvoice?: () => void;
}): ClientHealthAlert | null {
  const {
    outstandingAmountCents,
    lastActivityAt,
    activeProjectCount,
    invitedAt,
    lifecycleStatus,
    oldestOverdueDays = 0,
  } = client;

  // CRITICAL: overdue invoice > 30 days AND amount > $500
  if (
    oldestOverdueDays > 30 &&
    outstandingAmountCents > 50_000
  ) {
    return {
      severity: "critical",
      alertType: "overdue_invoice",
      message: `Payment overdue by ${oldestOverdueDays} days — ${formatCents(outstandingAmountCents)} outstanding.`,
      actions: [
        { label: "Send reminder", onClick: client.onSendReminder ?? (() => {}) },
        { label: "View invoice", onClick: client.onViewInvoice ?? (() => {}) },
      ],
    };
  }

  // WARNING: no activity in > 45 days AND client is active
  if (lastActivityAt && lifecycleStatus === "active") {
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(lastActivityAt).getTime()) / 86_400_000,
    );
    if (daysSinceActivity > 45) {
      return {
        severity: "warning",
        alertType: "no_activity",
        message: `No activity in ${daysSinceActivity} days. This client may need a check-in.`,
        actions: [
          { label: "Create project", onClick: client.onCreateProject ?? (() => {}) },
          { label: "Add note", onClick: client.onAddNote ?? (() => {}) },
        ],
      };
    }
  }

  // INFO: 0 projects and created > 14 days ago
  if (
    activeProjectCount === 0 &&
    invitedAt &&
    (Date.now() - new Date(invitedAt).getTime()) / 86_400_000 > 14
  ) {
    return {
      severity: "info",
      alertType: "no_projects",
      message: "No projects started yet. Ready to kick things off?",
      actions: [
        { label: "New project", onClick: client.onCreateProject ?? (() => {}) },
      ],
    };
  }

  return null;
}

// ─── Styling maps ─────────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<
  AlertSeverity,
  { wrapper: string; icon: React.ElementType; iconClass: string }
> = {
  critical: {
    wrapper:
      "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/60 dark:border-red-800/60 dark:text-red-200",
    icon: AlertCircle,
    iconClass: "text-red-500 dark:text-red-400",
  },
  warning: {
    wrapper:
      "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/60 dark:border-amber-800/60 dark:text-amber-200",
    icon: AlertTriangle,
    iconClass: "text-amber-500 dark:text-amber-400",
  },
  info: {
    wrapper:
      "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/60 dark:border-blue-800/60 dark:text-blue-200",
    icon: Info,
    iconClass: "text-blue-500 dark:text-blue-400",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ClientHealthBanner({
  clientId,
  alert,
  role,
}: ClientHealthBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check sessionStorage dismissal on mount (SSR-safe)
  useEffect(() => {
    setMounted(true);
    if (!alert) return;
    const today = new Date().toISOString().slice(0, 10);
    const key = `client_alert_dismissed_${clientId}_${alert.alertType}_${today}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) {
      setDismissed(true);
    }
  }, [clientId, alert]);

  function handleDismiss() {
    if (!alert) return;
    const today = new Date().toISOString().slice(0, 10);
    const key = `client_alert_dismissed_${clientId}_${alert.alertType}_${today}`;
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(key, "true");
    }
    setDismissed(true);
  }

  // Hidden for client role or no alert
  if (!alert || role === "client" || !mounted) return null;

  const styles = SEVERITY_STYLES[alert.severity];
  const Icon = styles.icon;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          role={alert.severity === "critical" ? "alert" : "status"}
          aria-live={alert.severity === "critical" ? "assertive" : "polite"}
          className={cn(
            "mb-4 flex items-start justify-between gap-3 rounded-xl border px-4 py-3",
            styles.wrapper,
          )}
        >
          <div className="flex items-start gap-2.5">
            <Icon
              className={cn("mt-0.5 h-4 w-4 shrink-0", styles.iconClass)}
              aria-hidden="true"
            />
            <div>
              <p className="text-[13px] font-medium">{alert.message}</p>
              {alert.actions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {alert.actions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={action.onClick}
                      className={cn(
                        "rounded-lg border border-current/20 px-3 py-1 text-[11px] font-semibold",
                        "hover:bg-current/10 transition-colors",
                      )}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            aria-label={`Dismiss ${alert.severity} alert`}
            onClick={handleDismiss}
            className="mt-0.5 shrink-0 rounded-lg p-1 hover:bg-current/10 transition-colors"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
