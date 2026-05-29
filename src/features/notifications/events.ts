// src/features/notifications/events.ts
// Master catalogue of all notification event types in ClientSpace.
// Every dispatchNotification call must use one of these keys.
//
// DEFAULT_PREFERENCES defines the out-of-the-box channel matrix.
// User-saved rows in notification_preferences override these per event type.

// ─── Event type registry ──────────────────────────────────────────────────────

export const NOTIFICATION_EVENTS = {
  // Invoice events
  INVOICE_PAID:             "invoice.paid",
  INVOICE_OVERDUE:          "invoice.overdue",
  INVOICE_SENT:             "invoice.sent",
  // Asset / file events
  ASSET_APPROVED:           "asset.approved",
  ASSET_CHANGES_REQUESTED:  "asset.changes_requested",
  ASSET_UPLOADED:           "asset.uploaded",
  // Comment events
  COMMENT_ADDED:            "comment.added",
  ANNOTATION_RESOLVED:      "annotation.resolved",
  // Milestone events
  MILESTONE_COMPLETED:      "milestone.completed",
  MILESTONE_OVERDUE:        "milestone.overdue",
  // Contract events
  CONTRACT_SIGNED:          "contract.signed",
  CONTRACT_SENT:            "contract.sent",
  // Project events
  PROJECT_HEALTH_CRITICAL:  "project.health_critical",
  // Member / org events
  MEMBER_INVITED:           "member.invited",
  CLIENT_PORTAL_VIEWED:     "client.portal_viewed",
} as const;

export type NotificationEventType =
  (typeof NOTIFICATION_EVENTS)[keyof typeof NOTIFICATION_EVENTS];

// ─── Channel preferences per event type ──────────────────────────────────────
// Defines which channels are ON by default when a user has no saved preference.
// SMS is opt-in only and restricted to high-priority events.

export interface ChannelPreference {
  in_app: boolean;
  email:  boolean;
  slack:  boolean;
  sms:    boolean;
}

export const DEFAULT_PREFERENCES: Record<NotificationEventType, ChannelPreference> = {
  "invoice.paid":            { in_app: true,  email: true,  slack: true,  sms: false },
  "invoice.overdue":         { in_app: true,  email: true,  slack: true,  sms: true  },
  "invoice.sent":            { in_app: true,  email: true,  slack: false, sms: false },
  "asset.approved":          { in_app: true,  email: true,  slack: false, sms: false },
  "asset.changes_requested": { in_app: true,  email: true,  slack: true,  sms: false },
  "asset.uploaded":          { in_app: true,  email: false, slack: true,  sms: false },
  "comment.added":           { in_app: true,  email: false, slack: true,  sms: false },
  "annotation.resolved":     { in_app: true,  email: false, slack: false, sms: false },
  "milestone.completed":     { in_app: true,  email: false, slack: true,  sms: false },
  "milestone.overdue":       { in_app: true,  email: true,  slack: true,  sms: true  },
  "contract.signed":         { in_app: true,  email: true,  slack: true,  sms: false },
  "contract.sent":           { in_app: true,  email: true,  slack: false, sms: false },
  "project.health_critical": { in_app: true,  email: true,  slack: true,  sms: true  },
  "member.invited":          { in_app: true,  email: true,  slack: false, sms: false },
  "client.portal_viewed":    { in_app: true,  email: false, slack: false, sms: false },
};

// ─── Events eligible for SMS (high-priority only) ─────────────────────────────
// Only these event types will ever trigger an SMS, regardless of preferences.
// Enforced in the Inngest worker before calling Twilio.
export const SMS_ELIGIBLE_EVENTS = new Set<NotificationEventType>([
  NOTIFICATION_EVENTS.INVOICE_PAID,
  NOTIFICATION_EVENTS.INVOICE_OVERDUE,
  NOTIFICATION_EVENTS.MILESTONE_OVERDUE,
  NOTIFICATION_EVENTS.PROJECT_HEALTH_CRITICAL,
]);

// ─── Human-readable labels for the preference centre UI ──────────────────────

export const EVENT_LABELS: Record<NotificationEventType, { label: string; description: string; category: string }> = {
  "invoice.paid":            { label: "Invoice paid",              description: "A client pays an invoice",                             category: "Invoices"  },
  "invoice.overdue":         { label: "Invoice overdue",           description: "An invoice passes its due date without payment",       category: "Invoices"  },
  "invoice.sent":            { label: "Invoice sent",              description: "An invoice is sent to a client",                      category: "Invoices"  },
  "asset.approved":          { label: "Asset approved",            description: "A client approves a file for delivery",               category: "Assets"    },
  "asset.changes_requested": { label: "Changes requested",         description: "A client requests changes on a delivered file",       category: "Assets"    },
  "asset.uploaded":          { label: "Asset uploaded",            description: "A new file version is uploaded to a project",         category: "Assets"    },
  "comment.added":           { label: "New comment",               description: "A comment or annotation is posted on a project file", category: "Assets"    },
  "annotation.resolved":     { label: "Annotation resolved",       description: "A proofing annotation is marked as resolved",         category: "Assets"    },
  "milestone.completed":     { label: "Milestone completed",       description: "A project milestone is marked done",                  category: "Projects"  },
  "milestone.overdue":       { label: "Milestone overdue",         description: "A milestone passes its due date",                     category: "Projects"  },
  "project.health_critical": { label: "Project health critical",   description: "AI analysis flags a project as critical risk",        category: "Projects"  },
  "contract.signed":         { label: "Contract signed",           description: "A client signs a contract",                          category: "Contracts" },
  "contract.sent":           { label: "Contract sent",             description: "A contract is sent to a client for signing",         category: "Contracts" },
  "member.invited":          { label: "Team member invited",       description: "A new team member is invited to the workspace",      category: "Team"      },
  "client.portal_viewed":    { label: "Client portal viewed",      description: "A client opens the client portal",                   category: "Team"      },
};
