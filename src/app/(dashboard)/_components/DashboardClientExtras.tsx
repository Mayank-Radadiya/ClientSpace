"use client";

import { Toaster } from "@/components/ui/sonner";
import { NotificationToastListener } from "@/features/notifications/components/NotificationToastListener";

export function DashboardClientExtras() {
  return (
    <>
      <NotificationToastListener />
      <Toaster richColors closeButton />
    </>
  );
}
