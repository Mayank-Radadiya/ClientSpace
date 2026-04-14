"use client";

import { useState } from "react";
import { ProjectPermissions } from "../hooks/useProjectPermissions";
import {
  Milestone,
  Folder,
  Asset,
  Comment,
  Invoice,
  ProjectMember,
} from "../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MilestonesTab } from "./MilestonesTab";
import { FilesTab } from "./FilesTab";
import { DiscussionsTab } from "./DiscussionsTab";
import { InvoicesTab } from "./InvoicesTab";
import { TeamTab } from "./TeamTab";

interface ProjectTabsProps {
  projectId: string;
  permissions: ProjectPermissions;

  // Data for tabs
  milestones: Milestone[];
  folders: Folder[];
  assets: Asset[];
  comments: Comment[];
  invoices: Invoice[];
  members: ProjectMember[];
  budget: number | null;

  // Handlers
  onAddMilestone: (presetStatus?: string) => void;
  onUpdateMilestone: (id: string, updates: Partial<Milestone>) => void;
  onUploadAssets: (files: File[]) => void;
  onDeleteAsset: (id: string) => void;
  onSendMessage: (body: string, isInternal: boolean) => void;
  onAddMember: (email: string, role: string) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onChangeRole: (userId: string, role: string) => Promise<void>;
}

export function ProjectTabs({
  projectId,
  permissions,
  milestones,
  folders,
  assets,
  comments,
  invoices,
  members,
  budget,
  onAddMilestone,
  onUpdateMilestone,
  onUploadAssets,
  onDeleteAsset,
  onSendMessage,
  onAddMember,
  onRemoveMember,
  onChangeRole,
}: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState("milestones");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="-mb-2 overflow-x-auto border-b pb-2">
        <TabsList className="h-12 w-fit justify-start bg-transparent p-0">
          <TabsTrigger
            value="milestones"
            className="data-[state=active]:border-primary rounded-none px-4 data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Milestones
          </TabsTrigger>
          <TabsTrigger
            value="files"
            className="data-[state=active]:border-primary rounded-none px-4 data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Files & Assets
          </TabsTrigger>
          <TabsTrigger
            value="discussions"
            className="data-[state=active]:border-primary rounded-none px-4 data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Discussions
          </TabsTrigger>
          {permissions.canViewInvoices && (
            <TabsTrigger
              value="invoices"
              className="data-[state=active]:border-primary rounded-none px-4 data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Invoices
            </TabsTrigger>
          )}
          {permissions.canManageTeam && (
            <TabsTrigger
              value="team"
              className="data-[state=active]:border-primary rounded-none px-4 data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Team
            </TabsTrigger>
          )}
        </TabsList>
      </div>

      <div className="mt-6">
        <TabsContent
          value="milestones"
          className="m-0 border-0 p-0 outline-none"
        >
          <MilestonesTab
            milestones={milestones}
            onUpdateMilestone={onUpdateMilestone}
            onAddMilestone={onAddMilestone}
          />
        </TabsContent>
        <TabsContent value="files" className="m-0 border-0 p-0 outline-none">
          <FilesTab
            folders={folders}
            assets={assets}
            onUpload={onUploadAssets}
            onDeleteAsset={onDeleteAsset}
          />
        </TabsContent>
        <TabsContent
          value="discussions"
          className="m-0 border-0 p-0 outline-none"
        >
          <DiscussionsTab
            comments={comments}
            onSendMessage={onSendMessage}
            canViewInternal={permissions.canViewInternalThreads}
          />
        </TabsContent>
        {permissions.canViewInvoices && (
          <TabsContent
            value="invoices"
            className="m-0 border-0 p-0 outline-none"
          >
            <InvoicesTab
              projectId={projectId}
              invoices={invoices}
              budget={budget}
            />
          </TabsContent>
        )}
        {permissions.canManageTeam && (
          <TabsContent value="team" className="m-0 border-0 p-0 outline-none">
            <TeamTab
              members={members}
              canManageTeam={permissions.canManageTeam}
              onAddMember={onAddMember}
              onRemoveMember={onRemoveMember}
              onChangeRole={onChangeRole}
            />
          </TabsContent>
        )}
      </div>
    </Tabs>
  );
}
