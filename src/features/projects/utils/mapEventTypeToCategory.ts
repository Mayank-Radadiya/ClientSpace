import type { ActivityEntry } from "../project-detail/types";

/**
 * Maps a raw event type string (e.g. "file_approved") to a valid
 * ActivityEntry category (e.g. "file").
 *
 * Event types use underscores as separators — NOT dots.
 * Falls back to "project" for any unmapped or unknown event type.
 */

const EVENT_CATEGORY_MAP: Record<string, ActivityEntry["category"]> = {
  // File events
  file_approved: "file",
  file_rejected: "file",
  file_uploaded: "file",
  file_deleted: "file",
  file_updated: "file",
  file_version_added: "file",
  file_version_uploaded: "file",
  file_reviewed: "file",
  file_shared: "file",

  // Milestone events
  milestone_completed: "milestone",
  milestone_created: "milestone",
  milestone_updated: "milestone",
  milestone_deleted: "milestone",
  milestone_status_changed: "milestone",
  milestone_moved: "milestone",
  milestone_assigned: "milestone",

  // Invoice events
  invoice_created: "invoice",
  invoice_paid: "invoice",
  invoice_sent: "invoice",
  invoice_overdue: "invoice",
  invoice_cancelled: "invoice",
  invoice_updated: "invoice",
  invoice_voided: "invoice",

  // Status events
  status_changed: "status",
  project_status_updated: "status",
  project_status_changed: "status",

  // Project-level events
  project_created: "project",
  project_updated: "project",
  project_archived: "project",
  project_deleted: "project",
  project_restored: "project",
  member_added: "project",
  member_removed: "project",
  member_invited: "project",
  comment_added: "project",
  comment_deleted: "project",
  comment_updated: "project",
  note_created: "project",
  note_updated: "project",
  note_deleted: "project",
};

// Compile-time check: ensures all values are valid ActivityEntry["category"]
const _typeCheck: Record<string, ActivityEntry["category"]> = EVENT_CATEGORY_MAP;
void _typeCheck;

/**
 * Maps a raw event type string to a valid ActivityEntry category.
 * Returns "project" as a safe fallback for unknown event types.
 */
export function mapEventTypeToCategory(
  eventType: string,
): ActivityEntry["category"] {
  return EVENT_CATEGORY_MAP[eventType] ?? "project";
}
