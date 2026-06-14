"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";
import type { MilestoneStatus } from "@/features/projects/schemas";
import type { ActivityEventMetadata } from "@/db/schema";
import { differenceInDays } from "date-fns";
import { computeHealthScore } from "./lib/healthScore";
import { PresenceProvider } from "../presence/PresenceProvider";
import { PresenceAvatars } from "../presence/PresenceAvatars";
import type { PresenceUser } from "../presence/presenceTypes";
import { usePresenceContext } from "../presence/PresenceContext";

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
import type { ActivityEntry } from "./types";

// Zone 6 — Right panel + overlays
import { ProjectRightPanel } from "./components/v3/ProjectRightPanel";
import { MilestoneCommandPanel } from "./components/v3/MilestoneCommandPanel";
import { ReportBuilderPanel } from "./components/v3/ReportBuilderPanel";
import { ProjectCommandPalette } from "./components/v3/ProjectCommandPalette";
import { mapEventTypeToCategory } from "../utils/mapEventTypeToCategory";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateProjectSchema,
  type UpdateProjectInput,
  STATUS_LABELS,
  PRIORITY_LABELS,
  PROJECT_STATUSES,
  PROJECT_PRIORITIES,
} from "@/features/projects/schemas";

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
  /** Current user info for presence tracking. Optional — presence is disabled if omitted. */
  currentUser?: PresenceUser;
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
  currentUser,
}: ProjectDetailPageProps) {
  const permissions = useProjectPermissions(role);
  const reduced = useReducedMotion();
  const effectiveRole: OrgRole = role ?? "member";
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const utils = trpc.useUtils();

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

  // ── tRPC mutations ─────────────────────────────────────────
  const createMilestone = trpc.milestones.create.useMutation({
    onMutate: async (input) => {
      // Cancel in-flight refetches to avoid overwriting optimistic update
      await utils.milestones.list.cancel({ projectId });
      const previous = utils.milestones.list.getData({ projectId });
      // Optimistically insert with a temporary id
      type CacheRow = NonNullable<ReturnType<typeof utils.milestones.list.getData>>[number];
      utils.milestones.list.setData({ projectId }, (old) => [
        ...(old ?? []),
        {
          ...input,
          id: `optimistic-${Date.now()}`,
          orgId,
          completed: false,
          completedAt: null,
          subTasks: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          description: null,
          assigneeId: null,
          startDate: null,
          dueDate: input.dueDate ?? null,
        } as CacheRow,
      ]);
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      // Roll back on failure
      if (ctx?.previous !== undefined) {
        utils.milestones.list.setData({ projectId }, ctx.previous);
      }
      gooeyToast.error("Failed to create milestone. Please try again.");
    },
    onSettled: () => {
      utils.milestones.list.invalidate({ projectId });
    },
  });

  const updateMilestoneStatus = trpc.milestones.updateStatus.useMutation({
    onMutate: async ({ id, status }) => {
      await utils.milestones.list.cancel({ projectId });
      const previous = utils.milestones.list.getData({ projectId });
      utils.milestones.list.setData({ projectId }, (old) =>
        old?.map((m) => (m.id === id ? { ...m, status } : m)) ?? []
      );
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous !== undefined) {
        utils.milestones.list.setData({ projectId }, ctx.previous);
      }
      gooeyToast.error("Failed to move milestone.");
    },
    onSettled: () => {
      utils.milestones.list.invalidate({ projectId });
    },
  });

  const archiveProject = trpc.projects.archive.useMutation({
    onSuccess: () => {
      gooeyToast.success("Project archived successfully.");
      router.push("/projects");
    },
    onError: () => gooeyToast.error("Failed to archive project. Please try again."),
  });

  const updateProject = trpc.projects.update.useMutation({
    onSuccess: (updated) => {
      utils.projects.byId.setData({ id: projectId }, (old) => {
        if (!old) return undefined;
        return { ...old, ...updated };
      });
      setIsEditing(false);
      gooeyToast.success("Project updated.");
    },
    onError: () => gooeyToast.error("Failed to save changes."),
  });

  const deleteProject = trpc.projects.delete.useMutation({
    onSuccess: () => {
      gooeyToast.success("Project permanently deleted.");
      router.push("/projects");
    },
    onError: () => gooeyToast.error("Failed to delete project."),
  });

  const inviteMember = trpc.projects.inviteMember.useMutation({
    onSuccess: () => {
      gooeyToast.success("Invitation sent successfully.");
      setIsInviteOpen(false);
      utils.projects.byId.invalidate({ id: projectId });
    },
    onError: (err) =>
      setInviteError(err.message ?? "Failed to send invite."),
  });

  const createFile = trpc.files.create.useMutation({
    onSuccess: () => {
      utils.files.list.invalidate({ projectId });
      gooeyToast.success("File uploaded successfully.");
      setUploadProgress(null);
    },
    onError: () => {
      gooeyToast.error("Upload failed. Please try again.");
      setUploadProgress(null);
    },
  });

  const deleteFile = trpc.files.delete.useMutation({
    onSuccess: () => {
      utils.files.list.invalidate({ projectId });
      gooeyToast.success("Asset removed.");
      setIsDeletingAsset(null);
    },
    onError: () => {
      gooeyToast.error("Failed to delete asset.");
      setIsDeletingAsset(null);
    },
  });

  const createInvoice = trpc.invoices.create.useMutation({
    onSuccess: (invoice) => {
      gooeyToast.success("Invoice created. Opening builder...");
      router.push(`/invoices/${invoice.id}`);
    },
    onError: () => gooeyToast.error("Failed to create invoice."),
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
    [
      completionPct,
      daysRemaining,
      totalDays,
      invoicesTotal,
      initialProject.budget,
    ],
  );

  // ── UI State ───────────────────────────────────────────────
  const [activeSection, setActiveSection] =
    useState<ActiveSection>("milestones");
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(
    null,
  );
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [reportPanelOpen, setReportPanelOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDeletingAsset, setIsDeletingAsset] = useState<string | null>(null);

  const editForm = useForm<UpdateProjectInput>({
    resolver: zodResolver(updateProjectSchema) as any,
    defaultValues: {
      name: initialProject.name,
      description: initialProject.description ?? "",
      status: initialProject.status,
      priority: initialProject.priority,
      budget: initialProject.budget ?? 0,
    },
  });

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
    const params = new URLSearchParams(searchParams.toString());
    params.delete("preview");
    const newUrl = params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
    setIsPreviewMode(false);
  }, [router, searchParams, pathname]);

  // Effective role for rendering (preview mode forces "client")
  const renderRole = isPreviewMode ? "client" : effectiveRole;
  const isClient = renderRole === "client";

  // ── Transform activity data to v3 format ──────────────────
  const activityEntries: ActivityEntry[] = initialActivity.map((a) => ({
    id: a.id,
    eventType: a.eventType,
    description:
      (a.metadata as Record<string, string>)?.description ||
      a.eventType.replace(/\./g, " "),
    actor: a.actor?.name || "System",
    timestamp: a.createdAt,
    category: mapEventTypeToCategory(a.eventType),
    color: (a.eventType.includes("complete")
      ? "green"
      : a.eventType.includes("overdue")
        ? "red"
        : a.eventType.includes("warning")
          ? "amber"
          : "blue") as ActivityEntry["color"],
  }));

  // ── Handlers ──────────────────────────────────────────────
  const handleEdit = () => setIsEditing(true);
  const handleArchive = () => setIsArchiveDialogOpen(true);

  const handleProjectSave = editForm.handleSubmit((values) => {
    updateProject.mutate({ id: projectId, data: values });
  });
  const handleDelete = () => setIsDeleteDialogOpen(true);
  const handleCreateInvoice = () => {
    if (!initialProject.client_id) return;
    createInvoice.mutate({
      projectId,
      clientId: initialProject.client_id,
      currency: "USD",
      taxRateBasisPoints: 0,
      items: [
        {
          description: `Services for ${initialProject.name}`,
          quantity: 1,
          unitPriceCents: 0,
        }
      ],
      notes: `Invoice for ${initialProject.name}`,
    });
  };

  const onUpload = async (uploadedFiles: File[]) => {
    const supabase = createClient();
    for (const file of uploadedFiles) {
      const path = `projects/${projectId}/${Date.now()}-${file.name}`;
      setUploadProgress(0);
      const { data, error } = await supabase.storage
        .from("project-files")
        .upload(path, file, { upsert: false });
      if (error || !data) {
        gooeyToast.error(`Failed to upload ${file.name}`);
        setUploadProgress(null);
        continue;
      }
      setUploadProgress(100);
      createFile.mutate({
        projectId,
        storagePath: data.path,
        fileSize: file.size,
        fileType: file.type || "application/octet-stream",
        fileName: file.name,
      });
    }
  };

  const onDelete = (assetId: string) => {
    setIsDeletingAsset(assetId);
    deleteFile.mutate({ projectId, assetId });
  };

  const handleAddMember = () => setIsInviteOpen(true);

  const handleAddMilestone = useCallback(
    (presetStatus?: string, title?: string) => {
      const resolvedTitle = (title ?? "").trim() || "New Milestone";
      createMilestone.mutate(
        {
          projectId,
          title: resolvedTitle,
          status: ((presetStatus === "done" || presetStatus === "in_progress" || presetStatus === "todo")
            ? presetStatus
            : "todo") as "todo" | "in_progress" | "done",
          priority: "medium",
          order: milestones.length,
        },
        {
          onSuccess: () => {
            gooeyToast.success("Milestone added");
          },
        },
      );
    },
    [projectId, milestones.length, createMilestone],
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
      const validStatus = (newStatus === "todo" || newStatus === "in_progress" || newStatus === "done")
        ? (newStatus as MilestoneStatus)
        : "todo" as MilestoneStatus;
      updateMilestoneOptimistic(id, {
        status: validStatus,
        completed: validStatus === "done",
        completed_at: validStatus === "done" ? new Date().toISOString() : null,
      });
      updateMilestoneStatus.mutate({ id, status: validStatus });
      gooeyToast.success("Milestone moved");
    },
    [updateMilestoneOptimistic, updateMilestoneStatus],
  );

  const handleMilestoneCreated = useCallback((id: string) => {
    gooeyToast.success("Milestone created");
  }, []);

  // ── Tab counts ────────────────────────────────────────────
  const counts = {
    milestones: milestones.length,
    files: files.length,
    invoices: initialInvoices.length,
    activity: activityEntries.length,
  };

  // ── Pending assets for client approval ────────────────────
  const pendingAssets = useMemo(
    () =>
      files.filter(
        (f) =>
          (f as Asset & { approval_status?: string }).approval_status ===
          "pending",
      ),
    [files],
  );

  // ── Client email for report builder ───────────────────────
  const clientEmail = initialProject.client?.email ?? null;

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
            projectId={projectId}
            files={files}
            onUpload={onUpload}
            onDelete={onDelete}
            uploadProgress={uploadProgress}
            isDeletingAsset={isDeletingAsset}
          />
        );
      case "invoices":
        return (
          <InvoicesDetailTab
            invoices={initialInvoices}
            onCreateInvoice={handleCreateInvoice}
            isCreatingInvoice={createInvoice.isPending}
            hasClient={!!initialProject.client_id}
          />
        );
      case "activity":
        return <ActivityLogTab activity={activityEntries} />;
      default:
        return null;
    }
  };

  // ── Presence ───────────────────────────────────────────────
  // If currentUser is provided, wrap the whole page in PresenceProvider
  // so all children can access onlineUsers via usePresenceContext().
  const presenceUser = currentUser
    ? { ...currentUser, activeTab: activeSection }
    : null;

  const pageContent = (
    <>
    <div
      className="flex min-h-screen flex-col bg-gray-50 dark:bg-[#0A0A0A] text-gray-900 dark:text-gray-100"
    >
      {/* ═══ Zone 0 — Guest Preview Bar ═══════════════════════ */}
      {isPreviewMode && <GuestPreviewBar onExitPreview={exitPreview} />}

      {/* ═══ Zone 1 — Top Bar + Health Ring ═══════════════════ */}
      <div className="flex items-start gap-4">
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
            presenceSlot={
              presenceUser ? <PresenceAvatarsConnected /> : undefined
            }
            isEditing={isEditing}
            isUpdating={updateProject.isPending}
            editForm={editForm}
            onSave={handleProjectSave}
            onCancelEdit={() => {
              editForm.reset();
              setIsEditing(false);
            }}
            statusOptions={PROJECT_STATUSES}
            statusLabels={STATUS_LABELS}
            priorityOptions={PROJECT_PRIORITIES}
            priorityLabels={PRIORITY_LABELS}
          />
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
        health={health.score}
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
        style={{ gap: 24 }}
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
          clientName={
            initialProject.client?.company_name ??
            initialProject.client?.contact_name ??
            "Client"
          }
          clientEmail={clientEmail}
          clientId={initialProject.client_id ?? null}
          milestonesSummary={{
            total: milestones.length,
            done: milestones.filter((m) => m.completed).length,
            inProgress: milestones.filter((m) => m.status === "in_progress")
              .length,
            overdue: milestones.filter(
              (m) =>
                !m.completed &&
                m.due_date != null &&
                new Date(m.due_date) < new Date(),
            ).length,
          }}
          invoicesSummary={{
            totalCents: invoicesTotal,
            paidCents: initialInvoices
              .filter((i) => i.status === "paid")
              .reduce((s, i) => s + i.amount_cents, 0),
            pendingCents: initialInvoices
              .filter((i) => i.status === "sent" || i.status === "draft")
              .reduce((s, i) => s + i.amount_cents, 0),
          }}
          filesCount={files.length}
        />
      </div>
    </div>

    {/* Archive confirmation dialog */}
    <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive "{initialProject.name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            The project will be hidden from the active projects list. You can unarchive it
            later from Settings. This will not delete any data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button
            onClick={() => archiveProject.mutate({ projectId })}
            disabled={archiveProject.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {archiveProject.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Archive Project
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Delete confirmation dialog — requires typing the project name */}
    <Dialog
      open={isDeleteDialogOpen}
      onOpenChange={(open) => {
        setIsDeleteDialogOpen(open);
        if (!open) setDeleteConfirmText("");
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Permanently delete project?</DialogTitle>
          <DialogDescription>
            This action is irreversible. All milestones, files, comments, and invoices
            linked to this project will be permanently removed. Type the project name to
            confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-2">
          <Input
            placeholder={initialProject.name}
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            autoComplete="off"
          />
        </div>
        <DialogFooter>
          <DialogClose
            render={
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmText("")}
              >
                Cancel
              </Button>
            }
          />
          <Button
            variant="destructive"
            disabled={
              deleteConfirmText !== initialProject.name || deleteProject.isPending
            }
            onClick={() => deleteProject.mutate({ id: projectId })}
          >
            {deleteProject.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Delete permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Invite member dialog */}
    <Dialog
      open={isInviteOpen}
      onOpenChange={(open) => {
        setIsInviteOpen(open);
        if (!open) {
          setInviteEmail("");
          setInviteError(null);
        }
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Add team member</DialogTitle>
          <DialogDescription>
            Enter the email address of an existing organisation member to add
            them to this project.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-2 flex flex-col gap-3">
          <Input
            id="invite-email"
            type="email"
            placeholder="colleague@example.com"
            value={inviteEmail}
            autoComplete="email"
            onChange={(e) => {
              setInviteEmail(e.target.value);
              setInviteError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.form?.requestSubmit();
            }}
          />
          {inviteError && (
            <p className="text-sm text-destructive">{inviteError}</p>
          )}
        </div>
        <DialogFooter>
          <DialogClose
            render={
              <Button
                variant="outline"
                onClick={() => {
                  setInviteEmail("");
                  setInviteError(null);
                }}
              >
                Cancel
              </Button>
            }
          />
          <Button
            disabled={
              !inviteEmail.includes("@") ||
              inviteEmail.trim() === "" ||
              inviteMember.isPending
            }
            onClick={() => {
              setInviteError(null);
              inviteMember.mutate({ projectId, email: inviteEmail.trim() });
            }}
          >
            {inviteMember.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );

  // Wrap with PresenceProvider if we have a current user
  if (presenceUser) {
    return (
      <PresenceProvider
        projectId={projectId}
        currentUser={presenceUser}
        activeTab={activeSection}
      >
        {pageContent}
      </PresenceProvider>
    );
  }

  return pageContent;
}

/* ── Inner component that reads from PresenceContext ─────────── */
// Defined inside the module to keep co-location clean.

function PresenceAvatarsConnected() {
  const ctx = usePresenceContext();
  if (!ctx || ctx.onlineUsers.length === 0) return null;

  return (
    <PresenceAvatars onlineUsers={ctx.onlineUsers} maxVisible={4} size="md" />
  );
}
