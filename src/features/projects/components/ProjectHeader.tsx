"use client";
// src/features/projects/components/ProjectHeader.tsx
// Top section: project name, breadcrumb, status badge, HealthScoreRing,
// command palette trigger, and report builder button.

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, FileDown, Edit3, Check, X } from "lucide-react";
import { HealthScoreRing } from "./HealthScoreRing";
import { ProjectCommandPalette } from "./ProjectCommandPalette";
import { ReportBuilderPanel } from "./ReportBuilderPanel";
import type { Project, Milestone, Invoice, OrgRole } from "./types";
import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  not_started: { label: "Not Started", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
  in_progress:  { label: "In Progress",  bg: "bg-blue-50 dark:bg-blue-950/40",  text: "text-blue-700 dark:text-blue-400" },
  review:       { label: "Review",        bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-400" },
  completed:    { label: "Completed",     bg: "bg-green-50 dark:bg-green-950/40",   text: "text-green-700 dark:text-green-400" },
  on_hold:      { label: "On Hold",       bg: "bg-amber-50 dark:bg-amber-950/40",   text: "text-amber-700 dark:text-amber-400" },
  archived:     { label: "Archived",      bg: "bg-slate-50 dark:bg-slate-900/40",   text: "text-slate-500 dark:text-slate-500" },
} as const;

interface ProjectHeaderProps {
  project: Project;
  healthScore: number;
  milestones: Milestone[];
  invoices: Invoice[];
  role: OrgRole;
  onNavigate: (tab: string) => void;
}

export function ProjectHeader({
  project,
  healthScore,
  milestones,
  invoices,
  role,
  onNavigate,
}: ProjectHeaderProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const st = STATUS_STYLES[project.status];
  const clientEmail = project.client?.email ?? "";

  return (
    <>
      <div className="flex flex-col gap-3 px-8 pb-4 pt-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link href="/projects" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded">
            Projects
          </Link>
          <ChevronRight size={12} />
          {project.client?.companyName && (
            <>
              <span>{project.client.companyName}</span>
              <ChevronRight size={12} />
            </>
          )}
          <span className="text-foreground font-medium" aria-current="page">
            {project.name}
          </span>
        </nav>

        {/* Title row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {project.name}
              </h1>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                  st.bg,
                  st.text,
                )}
              >
                {st.label}
              </span>
            </div>
            {project.description && (
              <p className="max-w-prose text-sm text-muted-foreground">{project.description}</p>
            )}
          </div>

          {/* Right-side controls */}
          <div className="flex flex-shrink-0 items-center gap-3">
            {/* Command palette */}
            {role !== "client" && (
              <ProjectCommandPalette
                projectId={project.id}
                onNavigate={onNavigate}
              />
            )}

            {/* Health ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4, type: "spring" }}
            >
              <HealthScoreRing score={healthScore} size={80} />
            </motion.div>

            {/* Report builder (admins/owners only) */}
            {(role === "owner" || role === "admin") && (
              <button
                id="open-report-builder-btn"
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Open report builder"
                aria-haspopup="dialog"
              >
                <FileDown size={14} />
                Report
              </button>
            )}
          </div>
        </div>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Report builder panel */}
      <ReportBuilderPanel
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        project={project}
        milestones={milestones}
        invoices={invoices}
        clientEmail={clientEmail}
      />
    </>
  );
}
