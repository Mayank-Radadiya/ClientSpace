// src/app/(dashboard)/settings/notifications/page.tsx
// Notification preference centre — lets users control which channels receive
// which notification types. Supports in-app, email, and Slack.

import { redirect } from "next/navigation";
import { getServerCaller } from "@/lib/trpc/server";
import { NotificationPreferenceCentre } from "@/features/notifications/components/NotificationPreferenceCentre";

export const metadata = { title: "Notification Preferences — Settings" };

export default async function NotificationSettingsPage() {
  const caller = await getServerCaller();
  if (!caller) redirect("/login");

  const [{ preferences }, { connected: slackConnected }] = await Promise.all([
    caller.notifications.getPreferences(),
    caller.notifications.getSlackStatus(),
  ]);

  return (
    <NotificationPreferenceCentre
      initialPreferences={preferences}
      slackConnected={slackConnected}
    />
  );
}
