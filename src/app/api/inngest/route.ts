import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { notificationDispatch } from "@/inngest/functions/notification-dispatch";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [notificationDispatch],
});
