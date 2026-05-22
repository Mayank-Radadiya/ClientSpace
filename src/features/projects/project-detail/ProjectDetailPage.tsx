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

// v3 components
import { ProjectTopBar } from "./components/v3/ProjectTopBar";
import { HeroStatsBand } from "./components/v3/HeroStatsBand";
import { ProjectTabNav } from "./components/v3/ProjectTabNav";
import { ProjectRightPanel } from "./components/v3/ProjectRightPanel";
import { MilestonesKanban } from "./components/v3/MilestonesKanban";
import { MilestoneSlideOver } from "./components/v3/MilestoneSlideOver";
import { FilesAssetsTab } from "./components/v3/FilesAssetsTab";
import { InvoicesDetailTab } from "./components/v3/InvoicesDetailTab";
import { ActivityLogTab } from "./components/v3/ActivityLogTab";
import { SAMPLE_ACTIVITY, type ActivityEntry } from "./components/v3/sampleData";

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

  // ── UI State ────────────────────────────────────────────────
  const [activeSection, setActiveSection] =
    useState<ActiveSection>("milestones");
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(
    null,
  );

  // ── Transform activity data to v3 format ────────────────────
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

  // ── Handlers ────────────────────────────────────────────────
  const handleEdit = () => gooeyToast.success("Edit mode");
  const handleDuplicate = () => gooeyToast.success("Project duplicated");
  const handleExport = () => gooeyToast.success("Report exported");
  const handleShare = () => gooeyToast.success("Link copied");
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
        completed_at: presetStatus === "done" ? new Date().toISOString() : null,
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

  // ── Keyboard shortcuts ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.key === "Escape" && selectedMilestone) {
        setSelectedMilestone(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedMilestone]);

  // ── Tab counts ──────────────────────────────────────────────
  const counts = {
    milestones: milestones.length,
    files: files.length,
    invoices: initialInvoices.length,
    activity: activityEntries.length,
  };

  // ── Render active section ───────────────────────────────────
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
            onUpload={(f) => gooeyToast.success("Upload started...")}
            onDelete={(id) => gooeyToast.success("Asset deleted")}
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

  // ── Completion percentage for header badge ──────────────────
  const completionPct = useMemo(() => {
    if (milestones.length === 0) return 0;
    return Math.round((milestones.filter((m) => m.completed).length / milestones.length) * 100);
  }, [milestones]);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "var(--pd-body)", color: "var(--pd-text-primary)" }}
    >
      {/* Zone A — Top Bar */}
      <ProjectTopBar
        project={initialProject}
        completionPct={completionPct}
        onEdit={handleEdit}
        onAddMilestone={() => handleAddMilestone()}
        onDuplicate={handleDuplicate}
        onExport={handleExport}
        onShare={handleShare}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />

      {/* Zone B — Hero Stats Band */}
      <HeroStatsBand
        project={initialProject}
        milestones={milestones}
        invoicesTotal={invoicesTotal}
      />

      {/* Zone C — Tab Navigation */}
      <ProjectTabNav
        activeTab={activeSection}
        onTabChange={setActiveSection}
        counts={counts}
      />

      {/* Zone D — Main Content + Right Panel */}
      <div
        className="flex flex-1 px-8 pt-6 pb-8"
        style={{ background: "var(--pd-body)", gap: 24 }}
      >
        {/* Main content area */}
        <main className="min-w-0 flex-1">
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

        {/* Right panel — 320px fixed */}
        <ProjectRightPanel
          project={initialProject}
          members={initialMembers}
          onCreateInvoice={handleCreateInvoice}
          onDuplicate={handleDuplicate}
          onExport={handleExport}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onAddMember={handleAddMember}
        />
      </div>

      {/* Slide-over overlay */}
      <MilestoneSlideOver
        milestone={selectedMilestone}
        onClose={() => setSelectedMilestone(null)}
        onUpdate={handleUpdateMilestone}
        onDelete={handleDeleteMilestone}
      />
    </div>
  );
}

