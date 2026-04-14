"use client";

import { useEffect } from "react";
import { useProjectDetail } from "./hooks/useProjectDetail";
import { useProjectPermissions } from "./hooks/useProjectPermissions";
import { ProjectHeader } from "./components/ProjectHeader";
import { MetricCards } from "./components/MetricCards";
import { ProjectTabs } from "./components/ProjectTabs";
import { ProjectSidebar } from "./components/ProjectSidebar";
import {
  Project,
  Milestone,
  ProjectMember,
  Folder,
  Asset,
  Comment,
  Invoice,
  OrgRole,
} from "./types";
import { gooeyToast } from "goey-toast";

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

  const {
    milestones,
    discussions,
    files,
    updateMilestoneOptimistic,
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

  const handleUpdateProject = (updates: Partial<Project>) => {
    gooeyToast.success("Project updated");
    // TODO: implement real Supabase mutation
  };

  const handleArchiveProject = () => {
    gooeyToast.success("Project archived");
  };

  const handleDeleteProject = () => {
    gooeyToast.error("Project deleted");
  };

  const handleUpdateMilestone = (id: string, updates: Partial<Milestone>) => {
    updateMilestoneOptimistic(id, updates);
    // TODO: add real mutation
  };

  const handleAddMilestone = (presetStatus?: string) => {
    gooeyToast.success(
      `Adding milestone via modal...${presetStatus ? ` (status: ${presetStatus})` : ""}`,
    );
  };

  const handleSendMessage = (body: string, isInternal: boolean) => {
    // Generate optimistic
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
    // TODO: real mutation via supabase client
  };

  const handleAddMember = async (email: string, targetRole: string) => {
    // throw new Error("Mock error");
  };

  const handleRemoveMember = async (userId: string) => {
    gooeyToast.success("Member removed");
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    gooeyToast.success("Role updated");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key.toLowerCase() === "e") {
        const btn = document.getElementById("edit-project-trigger");
        if (btn) btn.click();
      } else if (e.key.toLowerCase() === "m") {
        handleAddMilestone();
      } else if (e.key.toLowerCase() === "s") {
        gooeyToast.success("Share dialog opened");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="container mx-auto flex max-w-7xl flex-col gap-6 p-6 pb-24 font-sans text-zinc-900">
      <ProjectHeader
        project={initialProject}
        members={initialMembers}
        permissions={permissions}
        onUpdate={handleUpdateProject}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
        onChangeRole={handleChangeRole}
      />

      <MetricCards
        project={initialProject}
        milestones={milestones}
        permissions={permissions}
        invoicesTotal={invoicesTotal}
        onAddMilestone={handleAddMilestone}
      />

      {/* Under widgets, 2-column layout for tabs and sidebar */}
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[65fr_35fr]">
        <div className="min-w-0">
          <ProjectTabs
            projectId={projectId}
            permissions={permissions}
            milestones={milestones}
            assets={files}
            folders={initialFolders}
            comments={discussions}
            invoices={initialInvoices}
            members={initialMembers}
            budget={initialProject.budget}
            onAddMilestone={handleAddMilestone}
            onUpdateMilestone={handleUpdateMilestone}
            onUploadAssets={(files) => gooeyToast.success("Upload started...")}
            onDeleteAsset={(id) => gooeyToast.success("Asset deleted")}
            onSendMessage={handleSendMessage}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onChangeRole={handleChangeRole}
          />
        </div>

        <div className="w-full min-w-0">
          <ProjectSidebar
            project={initialProject}
            members={initialMembers}
            permissions={permissions}
            onUpdate={handleUpdateProject}
            onArchive={handleArchiveProject}
            onDelete={handleDeleteProject}
          />
        </div>
      </div>
    </div>
  );
}
