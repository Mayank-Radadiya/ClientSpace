"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useProjectDetail } from "./hooks/useProjectDetail";
import { useProjectPermissions } from "./hooks/useProjectPermissions";
import { useReducedMotion } from "./hooks/useReducedMotion";
import {
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

// v2 components
import { CommandHeader } from "./components/v2/CommandHeader";
import { MetricBand } from "./components/v2/MetricBand";
import { NavRail } from "./components/v2/NavRail";
import { MilestonesView } from "./components/v2/MilestonesView";
import { ChatPanel } from "./components/v2/ChatPanel";
import { TeamPopover } from "./components/v2/TeamPopover";
import { CommandPalette } from "./components/v2/CommandPalette";
import { MilestoneBottomSheet } from "./components/v2/MilestoneBottomSheet";
import { AddMilestoneDialog } from "./components/v2/AddMilestoneDialog";

// Existing tab components for non-redesigned sections
import { FilesTab } from "./components/FilesTab";
import { InvoicesTab } from "./components/InvoicesTab";

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
}: ProjectDetailPageProps) {
  const permissions = useProjectPermissions(role);
  const reduced = useReducedMotion();

  const {
    milestones,
    discussions,
    files,
    updateMilestoneOptimistic,
    addMilestoneOptimistic,
    addDiscussionOptimistic,
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
  const [chatOpen, setChatOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [teamPopoverOpen, setTeamPopoverOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(
    null,
  );
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false);
  const [addMilestonePresetStatus, setAddMilestonePresetStatus] = useState<
    string | undefined
  >();

  // ── Handlers ────────────────────────────────────────────────
  const handleUpdateProject = (updates: Partial<Project>) => {
    gooeyToast.success("Project updated");
  };

  const handleArchiveProject = () => {
    gooeyToast.success("Project archived");
  };

  const handleDeleteProject = () => {
    gooeyToast.error("Project deleted");
  };

  const handleUpdateMilestone = (id: string, updates: Partial<Milestone>) => {
    updateMilestoneOptimistic(id, updates);
  };

  const handleAddMilestone = useCallback((presetStatus?: string) => {
    setAddMilestonePresetStatus(presetStatus);
    setAddMilestoneOpen(true);
  }, []);

  const handleAddMilestoneSubmit = (data: {
    title: string;
    description: string;
    assigneeId: string | null;
    dueDate: Date | null;
    priority: string;
    status: string;
  }) => {
    const newMilestone: Milestone = {
      id: crypto.randomUUID(),
      org_id: orgId,
      project_id: projectId,
      title: data.title,
      description: data.description || undefined,
      due_date: data.dueDate ? data.dueDate.toISOString() : null,
      completed: data.status === "done",
      completed_at: data.status === "done" ? new Date().toISOString() : null,
      order: milestones.length,
      priority: data.priority as Milestone["priority"],
      status: data.status as Milestone["status"],
    };
    addMilestoneOptimistic(newMilestone);
    gooeyToast.success("Milestone added");
  };

  const handleDeleteMilestone = (id: string) => {
    updateMilestoneOptimistic(id, {}); // In production, this would be a delete
    gooeyToast.success("Milestone deleted");
  };

  const handleSendMessage = (body: string, isInternal: boolean) => {
    const dummyComment: Comment = {
      id: crypto.randomUUID(),
      org_id: orgId,
      project_id: projectId,
      asset_id: null,
      author_id: "user-id-here",
      body,
      parent_id: null,
      hidden: false,
      metadata: { internal: isInternal },
      created_at: new Date().toISOString(),
      author: { id: "user-id", name: "You", avatar_url: null },
    };
    addDiscussionOptimistic(dummyComment);
  };

  const handleAddMember = async (email: string, targetRole: string) => {
    gooeyToast.success("Invite sent");
  };

  const handleRemoveMember = async (userId: string) => {
    gooeyToast.success("Member removed");
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    gooeyToast.success("Role updated");
  };

  // ── Keyboard shortcuts ──────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Render active section ───────────────────────────────────
  const renderSection = () => {
    switch (activeSection) {
      case "milestones":
        return (
          <MilestonesView
            milestones={milestones}
            onUpdateMilestone={handleUpdateMilestone}
            onAddMilestone={handleAddMilestone}
            onMilestoneClick={setSelectedMilestone}
          />
        );
      case "files":
        return (
          <FilesTab
            folders={initialFolders}
            assets={files}
            onUpload={(f) => gooeyToast.success("Upload started...")}
            onDeleteAsset={(id) => gooeyToast.success("Asset deleted")}
          />
        );
      case "invoices":
        if (!permissions.canViewInvoices) return null;
        return (
          <InvoicesTab
            projectId={projectId}
            invoices={initialInvoices}
            budget={initialProject.budget}
          />
        );
      case "activity":
        return (
          <div
            className="flex h-64 items-center justify-center rounded-xl border border-border bg-muted/30"
          >
            <p className="text-[13px] text-muted-foreground">
              Activity log coming soon
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <LayoutGroup>
      <div
        className="flex min-h-screen flex-col font-sans bg-background text-foreground"
      >
        {/* Zone A — Command Header */}
        <CommandHeader
          project={initialProject}
          members={initialMembers}
          permissions={permissions}
          onUpdate={handleUpdateProject}
          onToggleChat={() => setChatOpen((o) => !o)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenTeamPopover={() => setTeamPopoverOpen(true)}
          onArchive={handleArchiveProject}
          onDelete={handleDeleteProject}
        />

        {/* Zone B — Metric Band */}
        <div className="w-full px-5 py-4">
          <MetricBand
            project={initialProject}
            milestones={milestones}
            permissions={permissions}
            invoicesTotal={invoicesTotal}
            onAddMilestone={() => handleAddMilestone()}
          />
        </div>

        {/* Main area: Nav Rail + Content + Chat Panel */}
        <motion.div
          layout={!reduced}
          className="flex flex-1"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Zone C — Nav Rail */}
          <NavRail
            project={initialProject}
            permissions={permissions}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            onUpdate={handleUpdateProject}
            onArchive={handleArchiveProject}
            onDelete={handleDeleteProject}
          />

          {/* Zone D — Main Content */}
          <motion.main
            layout={!reduced}
            className="min-w-0 flex-1 p-6"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {renderSection()}
              </motion.div>
            </AnimatePresence>
          </motion.main>

          {/* Zone E — Chat Panel */}
          <ChatPanel
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
            comments={discussions}
            members={initialMembers}
            onSendMessage={handleSendMessage}
            canViewInternal={permissions.canViewInternalThreads}
          />
        </motion.div>

        {/* Overlays */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onNavigate={(section) => {
            setActiveSection(section);
            setCommandPaletteOpen(false);
          }}
          onAddMilestone={() => handleAddMilestone()}
          onArchive={handleArchiveProject}
          onDelete={handleDeleteProject}
          onOpenChat={() => setChatOpen(true)}
        />

        <MilestoneBottomSheet
          milestone={selectedMilestone}
          onClose={() => setSelectedMilestone(null)}
          onUpdate={handleUpdateMilestone}
          onDelete={handleDeleteMilestone}
        />

        <AddMilestoneDialog
          open={addMilestoneOpen}
          onOpenChange={setAddMilestoneOpen}
          presetStatus={addMilestonePresetStatus}
          members={initialMembers}
          onSubmit={handleAddMilestoneSubmit}
        />

        {/* Team Popover is rendered inline in header via avatar cluster */}
      </div>
    </LayoutGroup>
  );
}
