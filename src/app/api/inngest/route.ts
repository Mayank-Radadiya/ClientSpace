import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { notificationDispatch } from "@/inngest/functions/notification-dispatch";
import { handlePaymentSucceeded } from "@/inngest/functions/stripe/handlePaymentSucceeded";
import { handlePaymentFailed } from "@/inngest/functions/stripe/handlePaymentFailed";
import { handleAccountUpdated } from "@/inngest/functions/stripe/handleAccountUpdated";
// Invoice PDF background workers
import { generateInvoicePdf } from "@/inngest/functions/invoices/generatePdf";
import { retryFailedPdfs } from "@/inngest/functions/invoices/retryFailedPdfs";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    notificationDispatch,
    handlePaymentSucceeded,
    handlePaymentFailed,
    handleAccountUpdated,
    // Invoice PDF async generation
    generateInvoicePdf,
    retryFailedPdfs,
  ],
});

