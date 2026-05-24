"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useProjectDetail } from "./hooks/useProjectDetail";
import { useProjectPermissions } from "./hooks/useProjectPermissions";
import { useReducedMotion } from "./hooks/useReducedMotion";
import type {
  Project,
  Milestone,
  ProjectMember,
  Folder,
  Asset,
  Comment,
  Invoice,
  OrgRole,
  ActiveSection,
} from "./types";
import { gooeyToast } from "goey-toast";
import type { ActivityEventMetadata } from "@/db/schema";
import { differenceInDays } from "date-fns";
import { computeHealthScore } from "./lib/healthScore";

// Zone 0 — Preview bar
import { GuestPreviewBar } from "./components/v3/GuestPreviewBar";

// Zone 1 — Top bar + Health ring
import { ProjectTopBar } from "./components/v3/ProjectTopBar";
import { HealthScoreRing } from "./components/v3/HealthScoreRing";

// Zone 2 — Client approval
import { ClientApprovalCentre } from "./components/v3/ClientApprovalCentre";

// Zone 3 — Stats + Tab nav
import { HeroStatsBand } from "./components/v3/HeroStatsBand";
import { ProjectTabNav } from "./components/v3/ProjectTabNav";

// Zone 4 — Risk banner
import { RiskBanner } from "./components/v3/RiskBanner";

// Zone 5 — Tab content
import { MilestonesKanban } from "./components/v3/MilestonesKanban";
import { FilesAssetsTab } from "./components/v3/FilesAssetsTab";
import { InvoicesDetailTab } from "./components/v3/InvoicesDetailTab";
import { ActivityLogTab } from "./components/v3/ActivityLogTab";
import { SAMPLE_ACTIVITY, type ActivityEntry } from "./components/v3/sampleData";

// Zone 6 — Right panel + overlays
import { ProjectRightPanel } from "./components/v3/ProjectRightPanel";
import { MilestoneCommandPanel } from "./components/v3/MilestoneCommandPanel";
import { ReportBuilderPanel } from "./components/v3/ReportBuilderPanel";
import { ProjectCommandPalette } from "./components/v3/ProjectCommandPalette";

/* ────────────────────────────────────────────────────────────── */

interface ProjectDetailPageProps {
  orgId: string;
  projectId: string;
  role: OrgRole | undefined;
  initialProject: Project;
  initialMilestones: Milestone[];
  initialMembers: ProjectMember[];
  initialFolders: Folder[];
  initialAssets: Asset[];
  initialComments: Comment[];
  initialInvoices: Invoice[];
  initialActivity: Array<{
    id: string;
    eventType: string;
    metadata: ActivityEventMetadata;
    createdAt: string;
    actor: {
      id: string;
      name: string;
      email: string;
      avatarUrl: string | null;
    } | null;
    actorRole: string | null;
    project: { id: string; name: string } | null;
  }>;
}

export function ProjectDetailPage({
  orgId,
  projectId,
  role,
  initialProject,
  initialMilestones,
  initialMembers,
  initialFolders,
  initialAssets,
  initialComments,
  initialInvoices,
  initialActivity,
}: ProjectDetailPageProps) {
  const permissions = useProjectPermissions(role);
  const reduced = useReducedMotion();
  const effectiveRole: OrgRole = role ?? "member";

  const {
    milestones,
    files,
    updateMilestoneOptimistic,
    addMilestoneOptimistic,
  } = useProjectDetail({
    projectId,
    orgId,
    initialMilestones,
    initialDiscussions: initialComments,
    initialFiles: initialAssets,
  });

  const invoicesTotal = initialInvoices.reduce(
    (acc, inv) => acc + inv.amount_cents,
    0,
  );

  // ── Computed Data ──────────────────────────────────────────
  const completionPct = useMemo(() => {
    if (milestones.length === 0) return 0;
    return Math.round(
      (milestones.filter((m) => m.completed).length / milestones.length) * 100,
    );
  }, [milestones]);

  const daysRemaining = useMemo(() => {
    if (!initialProject.deadline) return null;
    return differenceInDays(new Date(initialProject.deadline), new Date());
  }, [initialProject.deadline]);

  const totalDays = useMemo(() => {
    if (!initialProject.start_date || !initialProject.deadline) return null;
    return differenceInDays(
      new Date(initialProject.deadline),
      new Date(initialProject.start_date),
    );
  }, [initialProject.start_date, initialProject.deadline]);

  const health = useMemo(
    () =>
      computeHealthScore({
        completionPct,
        daysRemaining,
        totalDays,
        budgetUsed: invoicesTotal,
        budgetTotal: initialProject.budget,
      }),
    [completionPct, daysRemaining, totalDays, invoicesTotal, initialProject.budget],
  );

  // ── UI State ───────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<ActiveSection>("milestones");
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [reportPanelOpen, setReportPanelOpen] = useState(false);

  // Check for ?preview=guest on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("preview") === "guest") {
        setIsPreviewMode(true);
      }
    } catch {
      // SSR safe
    }
  }, []);

  const exitPreview = useCallback(() => {
    setIsPreviewMode(false);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("preview");
      window.history.replaceState({}, "", url.toString());
    } catch {
      // ignore
    }
  }, []);

  // Effective role for rendering (preview mode forces "client")
  const renderRole = isPreviewMode ? "client" : effectiveRole;
  const isClient = renderRole === "client";

  // ── Transform activity data to v3 format ──────────────────
  const activityEntries: ActivityEntry[] =
    initialActivity.length > 0
      ? initialActivity.map((a) => ({
          id: a.id,
          eventType: a.eventType,
          description:
            (a.metadata as Record<string, string>)?.description ||
            a.eventType.replace(/\./g, " "),
          actor: a.actor?.name || "System",
          timestamp: a.createdAt,
          category: (a.eventType.split(".")[0] || "project") as ActivityEntry["category"],
          color: (a.eventType.includes("complete")
            ? "green"
            : a.eventType.includes("overdue")
              ? "red"
              : a.eventType.includes("warning")
                ? "amber"
                : "blue") as ActivityEntry["color"],
        }))
      : SAMPLE_ACTIVITY;

  // ── Handlers ──────────────────────────────────────────────
  const handleEdit = () => gooeyToast.success("Edit mode");
  const handleArchive = () => gooeyToast.success("Project archived");
  const handleDelete = () => gooeyToast.error("Project deleted");
  const handleCreateInvoice = () => gooeyToast.success("Creating invoice...");
  const handleAddMember = () => gooeyToast.success("Invite sent");

  const handleAddMilestone = useCallback(
    (presetStatus?: string) => {
      const newMilestone: Milestone = {
        id: crypto.randomUUID(),
        org_id: orgId,
        project_id: projectId,
        title: "New Milestone",
        due_date: null,
        completed: presetStatus === "done",
        completed_at:
          presetStatus === "done" ? new Date().toISOString() : null,
        order: milestones.length,
        status: (presetStatus || "todo") as Milestone["status"],
      };
      addMilestoneOptimistic(newMilestone);
      gooeyToast.success("Milestone added");
    },
    [orgId, projectId, milestones.length, addMilestoneOptimistic],
  );

  const handleUpdateMilestone = useCallback(
    (id: string, updates: Partial<Milestone>) => {
      updateMilestoneOptimistic(id, updates);
    },
    [updateMilestoneOptimistic],
  );

  const handleDeleteMilestone = useCallback(
    (id: string) => {
      updateMilestoneOptimistic(id, {});
      gooeyToast.success("Milestone deleted");
    },
    [updateMilestoneOptimistic],
  );

  const handleMoveMilestone = useCallback(
    (id: string, newStatus: string) => {
      updateMilestoneOptimistic(id, {
        status: newStatus as Milestone["status"],
        completed: newStatus === "done",
        completed_at: newStatus === "done" ? new Date().toISOString() : null,
      });
      gooeyToast.success("Milestone moved");
    },
    [updateMilestoneOptimistic],
  );

  const handleMilestoneCreated = useCallback(
    (id: string) => {
      gooeyToast.success("Milestone created");
    },
    [],
  );

  // ── Keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA"
      )
        return;
      if (e.key === "Escape" && selectedMilestone) {
        setSelectedMilestone(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedMilestone]);

  // ── Tab counts ────────────────────────────────────────────
  const counts = {
    milestones: milestones.length,
    files: files.length,
    invoices: initialInvoices.length,
    activity: activityEntries.length,
  };

  // ── Pending assets for client approval ────────────────────
  const pendingAssets = useMemo(
    () => files.filter((f) => (f as Asset & { approval_status?: string }).approval_status === "pending"),
    [files],
  );

  // ── Client email for report builder ───────────────────────
  const clientEmail =
    initialProject.client?.email ?? "client@example.com";

  // ── Render active section ─────────────────────────────────
  const renderSection = () => {
    switch (activeSection) {
      case "milestones":
        return (
          <MilestonesKanban
            milestones={milestones}
            onMilestoneClick={setSelectedMilestone}
            onAddMilestone={handleAddMilestone}
            onMoveMilestone={handleMoveMilestone}
          />
        );
      case "files":
        return (
          <FilesAssetsTab
            files={files}
            onUpload={() => gooeyToast.success("Upload started...")}
            onDelete={() => gooeyToast.success("Asset deleted")}
          />
        );
      case "invoices":
        return (
          <InvoicesDetailTab
            invoices={initialInvoices}
            onCreateInvoice={handleCreateInvoice}
          />
        );
      case "activity":
        return <ActivityLogTab activity={activityEntries} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        background: "var(--pd-body)",
        color: "var(--pd-text-primary)",
      }}
    >
      {/* ═══ Zone 0 — Guest Preview Bar ═══════════════════════ */}
      {isPreviewMode && <GuestPreviewBar onExitPreview={exitPreview} />}

      {/* ═══ Zone 1 — Top Bar + Health Ring ═══════════════════ */}
      <div className="flex items-start gap-4 px-8 pt-6 pb-4"
        style={{ background: "var(--pd-body)" }}
      >
        <div className="min-w-0 flex-1">
          <ProjectTopBar
            project={initialProject}
            onEdit={handleEdit}
            onAddMilestone={() => handleAddMilestone()}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onGenerateReport={
              !isClient ? () => setReportPanelOpen(true) : undefined
            }
          />
        </div>
        {/* Health ring — pinned top-right of Zone 1 */}
        <div
          className="pd-animate-fade-up shrink-0 pt-2"
          style={{ animationDelay: "120ms" }}
        >
          <HealthScoreRing health={health} size={80} />
        </div>
      </div>

      {/* ═══ Zone 2 — Client Approval Centre ════════════════ */}
      {isClient && (
        <ClientApprovalCentre
          pendingAssets={pendingAssets}
          projectId={projectId}
        />
      )}

      {/* ═══ Zone 3 — Stats Band + Tab Nav ══════════════════ */}
      <HeroStatsBand
        project={initialProject}
        milestones={milestones}
        invoicesTotal={invoicesTotal}
      />

      {/* ═══ Zone 4 — Risk Banner ═══════════════════════════ */}
      {!isClient && (
        <RiskBanner
          milestones={milestones}
          deadline={initialProject.deadline}
          projectId={projectId}
        />
      )}

      <ProjectTabNav
        activeTab={activeSection}
        onTabChange={setActiveSection}
        counts={counts}
        hideInvoices={isClient}
      />

      {/* ═══ Zone 5+6 — Main Content + Right Panel ══════════ */}
      <div
        className="relative flex flex-1 px-8 pt-6 pb-8"
        style={{ background: "var(--pd-body)", gap: 24 }}
      >
        {/* Main content area */}
        <main className="min-w-0 flex-1">
          {/* Command palette trigger */}
          <div className="mb-4 flex items-center justify-between">
            <ProjectCommandPalette
              projectId={projectId}
              role={renderRole}
              onNavigate={setActiveSection}
              onMilestoneCreated={handleMilestoneCreated}
              onGenerateReport={
                !isClient ? () => setReportPanelOpen(true) : undefined
              }
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={reduced ? false : { opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Right panel — 288px sticky */}
        <ProjectRightPanel
          project={initialProject}
          members={initialMembers}
          role={renderRole}
          onCreateInvoice={handleCreateInvoice}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onAddMember={handleAddMember}
        />

        {/* Milestone Command Panel — position: absolute inside this relative wrapper */}
        <MilestoneCommandPanel
          milestone={selectedMilestone}
          onClose={() => setSelectedMilestone(null)}
          onUpdate={handleUpdateMilestone}
          onDelete={handleDeleteMilestone}
        />

        {/* Report Builder Panel — position: absolute inside this relative wrapper */}
        <ReportBuilderPanel
          open={reportPanelOpen}
          onClose={() => setReportPanelOpen(false)}
          projectId={projectId}
          projectName={initialProject.name}
          clientEmail={clientEmail}
        />
      </div>
    </div>
  );
}
