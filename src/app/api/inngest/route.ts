import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { notificationDispatch } from "@/inngest/functions/notification-dispatch";
import { handlePaymentSucceeded } from "@/inngest/functions/stripe/handlePaymentSucceeded";
import { handlePaymentFailed } from "@/inngest/functions/stripe/handlePaymentFailed";
import { handleAccountUpdated } from "@/inngest/functions/stripe/handleAccountUpdated";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    notificationDispatch,
    handlePaymentSucceeded,
    handlePaymentFailed,
    handleAccountUpdated,
  ],
});

