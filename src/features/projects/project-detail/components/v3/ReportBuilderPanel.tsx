"use client";

// src/features/projects/project-detail/components/v3/ReportBuilderPanel.tsx
// Slide panel for configuring and generating a project PDF report.
// position: absolute inside Zone 6 relative wrapper (not fixed).
// Uses pd-* design tokens.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileDown, Mail, Check, Loader2 } from "lucide-react";
import { generateProjectPdf, sendReportToClient } from "@/features/projects/server/reportActions";

type ReportSectionKey =
  | "overview"
  | "milestones"
  | "files"
  | "invoices"
  | "activity";

const SECTIONS: { key: ReportSectionKey; label: string }[] = [
  { key: "overview", label: "Project overview" },
  { key: "milestones", label: "Milestone summary" },
  { key: "files", label: "Files & approvals" },
  { key: "invoices", label: "Invoice summary" },
  { key: "activity", label: "Activity log" },
];

interface ReportBuilderPanelProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  clientEmail: string;
}

export function ReportBuilderPanel({
  open,
  onClose,
  projectId,
  projectName,
  clientEmail,
}: ReportBuilderPanelProps) {
  const [selectedSections, setSelectedSections] = useState<
    Set<ReportSectionKey>
  >(new Set(["overview", "milestones", "invoices"]));
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastAction, setLastAction] = useState<
    "none" | "downloaded" | "sent"
  >("none");
  const [error, setError] = useState<string | null>(null);

  const toggleSection = (key: ReportSectionKey) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleDownload = async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateProjectPdf({
        projectName,
        clientName: "Client",
        dateRange: {
          from: new Date(Date.now() - 30 * 86400000)
            .toISOString()
            .slice(0, 10),
          to: new Date().toISOString().slice(0, 10),
        },
        sections: Array.from(selectedSections),
      });
      if (!result.success || !result.buffer) {
        setError(result.error ?? "Generation failed.");
        return;
      }
      const blob = new Blob([new Uint8Array(result.buffer)], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename ?? "report.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setLastAction("downloaded");
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSendToClient = async () => {
    setSending(true);
    setError(null);
    try {
      const result = await sendReportToClient(
        projectId,
        clientEmail,
        projectName,
      );
      if (!result.success) {
        setError(result.error ?? "Send failed.");
        return;
      }
      setLastAction("sent");
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 38 }}
          className="pd-scroll absolute top-0 right-0 z-30 flex h-full flex-col"
          style={{
            width: 380,
            background: "var(--pd-surface)",
            borderLeft: "1px solid var(--pd-border)",
            boxShadow: "var(--pd-shadow-slide)",
          }}
          role="dialog"
          aria-modal
          aria-label="Report builder"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ borderColor: "var(--pd-divider)" }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--pd-text-primary)",
                }}
              >
                Report Builder
              </h2>
              <p
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: 11,
                  color: "var(--pd-text-muted)",
                }}
              >
                Generate a PDF report for {projectName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--pd-text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--pd-accent-subtle)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
              aria-label="Close report builder"
            >
              <X size={16} />
            </button>
          </div>

          {/* Section toggles */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <p
              className="mb-3"
              style={{
                fontFamily: "var(--font-data)",
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--pd-text-muted)",
              }}
            >
              Include sections
            </p>
            <ul className="flex flex-col gap-2">
              {SECTIONS.map((section) => (
                <li key={section.key}>
                  <label
                    htmlFor={`section-v3-${section.key}`}
                    className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-colors"
                    style={{
                      background: selectedSections.has(section.key)
                        ? "var(--pd-accent-subtle)"
                        : "var(--pd-elevated)",
                      border: `1px solid ${
                        selectedSections.has(section.key)
                          ? "var(--pd-accent)"
                          : "var(--pd-border)"
                      }`,
                      fontFamily: "var(--font-data)",
                      fontSize: 13,
                      color: "var(--pd-text-primary)",
                    }}
                  >
                    {section.label}
                    <input
                      type="checkbox"
                      id={`section-v3-${section.key}`}
                      checked={selectedSections.has(section.key)}
                      onChange={() => toggleSection(section.key)}
                      className="h-3.5 w-3.5 rounded accent-[var(--pd-accent)]"
                    />
                  </label>
                </li>
              ))}
            </ul>

            {error && (
              <p
                className="mt-4 rounded-lg px-3 py-2"
                style={{
                  background: "var(--pd-status-overdue-bg)",
                  color: "var(--pd-status-overdue)",
                  fontFamily: "var(--font-data)",
                  fontSize: 12,
                }}
              >
                {error}
              </p>
            )}

            {lastAction !== "none" && (
              <div
                className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2"
                style={{
                  background: "var(--pd-status-done-bg)",
                  color: "var(--pd-status-done)",
                  fontFamily: "var(--font-data)",
                  fontSize: 12,
                }}
              >
                <Check size={12} />
                {lastAction === "downloaded"
                  ? "PDF downloaded."
                  : `Report sent to ${clientEmail}.`}
              </div>
            )}
          </div>

          {/* Actions */}
          <div
            className="flex flex-col gap-2 border-t px-5 py-4"
            style={{ borderColor: "var(--pd-divider)" }}
          >
            <button
              id="report-download-btn"
              onClick={handleDownload}
              disabled={generating || selectedSections.size === 0}
              className="flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: "var(--pd-accent)",
                color: "#fff",
                fontFamily: "var(--font-data)",
                fontSize: 13,
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled)
                  e.currentTarget.style.background = "var(--pd-accent-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--pd-accent)";
              }}
            >
              {generating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <FileDown size={14} />
                  Download PDF
                </>
              )}
            </button>

            <button
              id="report-send-btn"
              onClick={handleSendToClient}
              disabled={sending || selectedSections.size === 0}
              className="flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2.5 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                borderColor: "var(--pd-border)",
                color: "var(--pd-text-secondary)",
                fontFamily: "var(--font-data)",
                fontSize: 13,
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled)
                  e.currentTarget.style.background = "var(--pd-accent-subtle)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {sending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Mail size={14} />
                  Send to {clientEmail.split("@")[0]}
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
