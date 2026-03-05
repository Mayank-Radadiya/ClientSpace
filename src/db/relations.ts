// src/db/relations.ts
// Drizzle relational query config — defines type-safe query joins.

import { relations } from "drizzle-orm";
import {
  users,
  organizations,
  orgMemberships,
  clients,
  projects,
  projectMembers,
  milestones,
  folders,
  assets,
  fileVersions,
  comments,
  invoices,
  invoiceLineItems,
  activityLogs,
  notifications,
  invitations,
  shareLinks,
  contracts,
  csatResponses,
} from "./schema";

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(orgMemberships),
  projectAssignments: many(projectMembers),
}));

// ─── Organizations ────────────────────────────────────────────────────────────

export const organizationsRelations = relations(
  organizations,
  ({ one, many }) => ({
    owner: one(users, {
      fields: [organizations.ownerId],
      references: [users.id],
    }),
    memberships: many(orgMemberships),
    clients: many(clients),
    projects: many(projects),
    invoices: many(invoices),
  }),
);

// ─── Org Memberships ──────────────────────────────────────────────────────────

export const orgMembershipsRelations = relations(orgMemberships, ({ one }) => ({
  user: one(users, {
    fields: [orgMemberships.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [orgMemberships.orgId],
    references: [organizations.id],
  }),
}));

// ─── Clients ──────────────────────────────────────────────────────────────────

export const clientsRelations = relations(clients, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [clients.orgId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  projects: many(projects),
  invoices: many(invoices),
  invitations: many(invitations),
  csatResponses: many(csatResponses),
}));

// ─── Projects ─────────────────────────────────────────────────────────────────

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.orgId],
    references: [organizations.id],
  }),
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  members: many(projectMembers),
  milestones: many(milestones),
  assets: many(assets),
  folders: many(folders),
  comments: many(comments),
  activityLogs: many(activityLogs),
  invoices: many(invoices),
  contracts: many(contracts),
  csatResponses: many(csatResponses),
}));

// ─── Project Members ──────────────────────────────────────────────────────────

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}));

// ─── Milestones ───────────────────────────────────────────────────────────────

export const milestonesRelations = relations(milestones, ({ one }) => ({
  organization: one(organizations, {
    fields: [milestones.orgId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [milestones.projectId],
    references: [projects.id],
  }),
}));

// ─── Folders ──────────────────────────────────────────────────────────────────

export const foldersRelations = relations(folders, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [folders.orgId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [folders.projectId],
    references: [projects.id],
  }),
  parent: one(folders, {
    fields: [folders.parentId],
    references: [folders.id],
    relationName: "folderHierarchy",
  }),
  children: many(folders, { relationName: "folderHierarchy" }),
  assets: many(assets),
}));

// ─── Assets ───────────────────────────────────────────────────────────────────

export const assetsRelations = relations(assets, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [assets.orgId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [assets.projectId],
    references: [projects.id],
  }),
  folder: one(folders, {
    fields: [assets.folderId],
    references: [folders.id],
  }),
  versions: many(fileVersions),
  comments: many(comments),
}));

// ─── File Versions ────────────────────────────────────────────────────────────

export const fileVersionsRelations = relations(fileVersions, ({ one }) => ({
  organization: one(organizations, {
    fields: [fileVersions.orgId],
    references: [organizations.id],
  }),
  asset: one(assets, {
    fields: [fileVersions.assetId],
    references: [assets.id],
  }),
  uploader: one(users, {
    fields: [fileVersions.uploadedBy],
    references: [users.id],
  }),
}));

// ─── Comments ─────────────────────────────────────────────────────────────────

export const commentsRelations = relations(comments, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [comments.orgId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [comments.projectId],
    references: [projects.id],
  }),
  asset: one(assets, {
    fields: [comments.assetId],
    references: [assets.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "commentThread",
  }),
  replies: many(comments, { relationName: "commentThread" }),
}));

// ─── Invoices ─────────────────────────────────────────────────────────────────

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [invoices.orgId],
    references: [organizations.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  project: one(projects, {
    fields: [invoices.projectId],
    references: [projects.id],
  }),
  lineItems: many(invoiceLineItems),
}));

// ─── Invoice Line Items ───────────────────────────────────────────────────────

export const invoiceLineItemsRelations = relations(
  invoiceLineItems,
  ({ one }) => ({
    invoice: one(invoices, {
      fields: [invoiceLineItems.invoiceId],
      references: [invoices.id],
    }),
  }),
);

// ─── Activity Logs ────────────────────────────────────────────────────────────

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  project: one(projects, {
    fields: [activityLogs.projectId],
    references: [projects.id],
  }),
  organization: one(organizations, {
    fields: [activityLogs.orgId],
    references: [organizations.id],
  }),
  actor: one(users, {
    fields: [activityLogs.actorId],
    references: [users.id],
  }),
}));

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [notifications.orgId],
    references: [organizations.id],
  }),
}));

// ─── Invitations ──────────────────────────────────────────────────────────────

export const invitationsRelations = relations(invitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [invitations.orgId],
    references: [organizations.id],
  }),
  client: one(clients, {
    fields: [invitations.clientId],
    references: [clients.id],
  }),
}));

// ─── Share Links ──────────────────────────────────────────────────────────────

export const shareLinksRelations = relations(shareLinks, ({ one }) => ({
  creator: one(users, {
    fields: [shareLinks.createdBy],
    references: [users.id],
  }),
}));

// ─── Phase 2: Contracts ───────────────────────────────────────────────────────

export const contractsRelations = relations(contracts, ({ one }) => ({
  project: one(projects, {
    fields: [contracts.projectId],
    references: [projects.id],
  }),
  organization: one(organizations, {
    fields: [contracts.orgId],
    references: [organizations.id],
  }),
  signer: one(users, {
    fields: [contracts.signerId],
    references: [users.id],
  }),
}));

// ─── Phase 2: CSAT Responses ─────────────────────────────────────────────────

export const csatResponsesRelations = relations(csatResponses, ({ one }) => ({
  project: one(projects, {
    fields: [csatResponses.projectId],
    references: [projects.id],
  }),
  client: one(clients, {
    fields: [csatResponses.clientId],
    references: [clients.id],
  }),
}));
