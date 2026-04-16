import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
  events: Array<{
    id: string;
    eventType: string;
    createdAt: Date | string;
  }>;
}

const EVENT_LABELS: Record<string, string> = {
  project_created: "Project created",
  status_changed: "Project status updated",
  file_uploaded: "File uploaded",
  file_approved: "File approved",
  changes_requested: "Changes requested",
  invoice_created: "Invoice issued",
  invoice_status_changed: "Invoice status updated",
  milestone_completed: "Milestone completed",
};

function toLabel(eventType: string) {
  return EVENT_LABELS[eventType] ?? eventType.replace(/_/g, " ");
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div className="text-muted-foreground bg-card rounded-xl border p-6 text-sm">
        No recent activity yet.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border">
      <ul className="divide-y">
        {events.map((event) => (
          <li
            key={event.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <span className="text-sm font-medium">
              {toLabel(event.eventType)}
            </span>
            <span className="text-muted-foreground text-xs">
              {formatDistanceToNow(new Date(event.createdAt), {
                addSuffix: true,
              })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
