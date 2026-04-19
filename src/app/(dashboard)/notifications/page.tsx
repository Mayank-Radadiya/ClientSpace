import { redirect } from "next/navigation";
import { getServerCaller } from "@/lib/trpc/server";
import { createTRPCContext } from "@/lib/trpc/init";
import { NotificationHistoryList } from "@/features/notifications/components/NotificationHistoryList";

export const metadata = { title: "Notifications — ClientSpace" };

export default async function NotificationsPage() {
  const ctx = await createTRPCContext();
  if (!ctx) {
    redirect("/login");
  }

  const caller = await getServerCaller();
  if (!caller) {
    redirect("/login");
  }

  const initialData = await caller.activity.getNotifications({
    limit: 20,
    offset: 0,
  });

  return <NotificationHistoryList initialData={initialData} />;
}
