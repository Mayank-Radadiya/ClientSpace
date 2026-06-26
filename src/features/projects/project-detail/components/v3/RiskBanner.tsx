"use client";

// src/features/projects/project-detail/components/v3/RiskBanner.tsx
// Contextual deadline risk banner — high/medium severity.
// Renders nothing when risk is low or dismissed.

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Zap, X } from "lucide-react";
import type { Milestone } from "../../types";

type RiskLevel = "high" | "medium" | "low";

interface RiskInfo {
  level: RiskLevel;
  message: string;
  icon: React.ReactNode;
  colors: {
    bg: string;
    border: string;
    text: string;
  };
}

function computeRisk(
  milestones: Milestone[],
  deadline: string | null,
): RiskInfo {
  const low: RiskInfo = {
    level: "low",
    message: "",
    icon: null,
    colors: { bg: "", border: "", text: "" },
  };

  if (!deadline || milestones.length === 0) return low;

  const daysLeft = Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  if (daysLeft > 21) return low;

  const completedCount = milestones.filter((m) => m.completed).length;
  const completionPct =
    milestones.length > 0
      ? Math.round((completedCount / milestones.length) * 100)
      : 0;
  const atRiskCount = milestones.length - completedCount;

  // HIGH: < 30% done AND < 14 days remaining
  if (completionPct < 30 && daysLeft < 14) {
    const deadlineStr = new Date(deadline).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return {
      level: "high",
      message: `At current pace, ${atRiskCount} milestone${atRiskCount !== 1 ? "s" : ""} will miss the ${deadlineStr} deadline.`,
      icon: <AlertTriangle size={14} />,
      colors: {
        bg: "hsla(0, 72%, 58%, 0.06)",
        border: "hsl(0, 72%, 58%)",
        text: "hsl(0, 72%, 65%)",
      },
    };
  }

  // MEDIUM: < 50% done AND < 21 days remaining
  if (completionPct < 50 && daysLeft < 21) {
    return {
      level: "medium",
      message: `This project is behind schedule. ${atRiskCount} milestone${atRiskCount !== 1 ? "s" : ""} ${atRiskCount !== 1 ? "are" : "is"} at risk.`,
      icon: <Zap size={14} />,
      colors: {
        bg: "hsla(38, 92%, 50%, 0.06)",
        border: "hsl(38, 92%, 50%)",
        text: "hsl(38, 80%, 45%)",
      },
    };
  }

  return low;
}

interface RiskBannerProps {
  milestones: Milestone[];
  deadline: string | null;
  projectId: string;
}

export function RiskBanner({
  milestones,
  deadline,
  projectId,
}: RiskBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const risk = useMemo(
    () => computeRisk(milestones, deadline),
    [milestones, deadline],
  );

  // Check sessionStorage for previous dismissal
  useEffect(() => {
    try {
      const key = `cs_risk_dismissed_${projectId}`;
      if (sessionStorage.getItem(key) === "1") {
        setDismissed(true);
      }
    } catch {
      // SSR or storage unavailable — ignore
    }
  }, [projectId]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(`cs_risk_dismissed_${projectId}`, "1");
    } catch {
      // ignore
    }
  };

  if (risk.level === "low" || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="mx-8 mb-1 flex items-center gap-3 rounded-lg px-4 py-2.5"
        style={{
          background: risk.colors.bg,
          borderLeft: `3px solid ${risk.colors.border}`,
        }}
        role="alert"
        aria-live="assertive"
      >
        <span style={{ color: risk.colors.text, flexShrink: 0 }}>
          {risk.icon}
        </span>
        <p
          className="flex-1"
          style={{
            fontFamily: "var(--font-data)",
            fontSize: 13,
            color: risk.colors.text,
            lineHeight: 1.4,
          }}
        >
          {risk.message}
        </p>
        <button
          onClick={handleDismiss}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors"
          style={{ color: risk.colors.text }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${risk.colors.border}20`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
          aria-label="Dismiss risk warning"
        >
          <X size={14} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
