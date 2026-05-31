"use client";
// src/features/projects/components/ReportBuilderPanel.tsx
// Slide-over panel for configuring and generating a project PDF report.
// Fix 1: PDF generation happens in reportActions.ts which has `export const runtime = "nodejs"`.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileDown, Mail, Check, Loader2 } from "lucide-react";
import { generateProjectPdf, sendReportToClient } from "@/features/projects/server/reportActions";
import type { Project, Milestone, Invoice } from "./types";
import { cn } from "@/lib/utils";

type ReportSectionKey = "overview" | "milestones" | "files" | "invoices" | "activity";

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
  project: Project;
  milestones: Milestone[];
  invoices: Invoice[];
  clientEmail: string;
}

export function ReportBuilderPanel({
  open,
  onClose,
  project,
  milestones,
  invoices,
  clientEmail,
}: ReportBuilderPanelProps) {
  const [selectedSections, setSelectedSections] = useState<Set<ReportSectionKey>>(
    new Set(["overview", "milestones", "invoices"]),
  );
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastAction, setLastAction] = useState<"none" | "downloaded" | "sent">("none");
  const [error, setError] = useState<string | null>(null);

  const toggleSection = (key: ReportSectionKey) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const buildReportData = () => {
    const doneMilestones = milestones.filter((m) => m.status === "done").length;
    const inProgressMilestones = milestones.filter((m) => m.status === "in_progress").length;
    const overdueMilestones = milestones.filter(
      (m) =>
        !m.completed &&
        m.dueDate &&
        new Date(m.dueDate).getTime() < Date.now(),
    ).length;

    const totalInvoiceCents = invoices.reduce((s, i) => s + i.amountCents, 0);
    const paidCents = invoices
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + i.amountCents, 0);

    return {
      projectName: project.name,
      clientName: project.client?.companyName ?? project.client?.contactName ?? "Client",
      dateRange: {
        from: project.createdAt.slice(0, 10),
        to: new Date().toISOString().slice(0, 10),
      },
      sections: Array.from(selectedSections),
      milestonesSummary: {
        total: milestones.length,
        done: doneMilestones,
        inProgress: inProgressMilestones,
        overdue: overdueMilestones,
      },
      invoicesSummary: {
        totalCents: totalInvoiceCents,
        paidCents,
        pendingCents: totalInvoiceCents - paidCents,
      },
    };
  };

  const handleDownload = async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateProjectPdf(buildReportData());
      if (!result.success || !result.buffer) {
        setError(result.error ?? "Generation failed.");
        return;
      }
      // Trigger download in browser
      const blob = new Blob([new Uint8Array(result.buffer)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename ?? "report.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setLastAction("downloaded");
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSendToClient = async () => {
    setSending(true);
    setError(null);
    try {
      const result = await sendReportToClient(project.id, clientEmail, project.name, buildReportData());
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
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-border bg-background shadow-2xl"
            role="dialog"
            aria-modal
            aria-label="Report builder"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Report Builder</h2>
                <p className="text-xs text-muted-foreground">Generate a project PDF report</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close report builder"
              >
                <X size={16} />
              </button>
            </div>

            {/* Section toggles */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="mb-3 text-xs font-medium text-muted-foreground">Include sections</p>
              <ul className="flex flex-col gap-2">
                {SECTIONS.map((section) => (
                  <li key={section.key}>
                    <label
                      htmlFor={`section-${section.key}`}
                      className="flex cursor-pointer items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                    >
                      {section.label}
                      <input
                        type="checkbox"
                        id={`section-${section.key}`}
                        checked={selectedSections.has(section.key)}
                        onChange={() => toggleSection(section.key)}
                        className="h-3.5 w-3.5 accent-primary"
                      />
                    </label>
                  </li>
                ))}
              </ul>

              {error && (
                <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
                  {error}
                </p>
              )}

              {lastAction !== "none" && (
                <div className="mt-4 flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-xs text-green-700 dark:bg-green-950/30 dark:text-green-400">
                  <Check size={12} />
                  {lastAction === "downloaded" ? "PDF downloaded." : `Report sent to ${clientEmail}.`}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-border px-5 py-4 flex flex-col gap-2">
              <button
                id="report-download-btn"
                onClick={handleDownload}
                disabled={generating || selectedSections.size === 0}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
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
                className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
        </>
      )}
    </AnimatePresence>
  );
}
