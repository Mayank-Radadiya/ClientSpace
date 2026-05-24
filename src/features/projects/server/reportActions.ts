"use server";
// Fix 1: @react-pdf/renderer requires Node.js canvas APIs — cannot run on Edge runtime.
export const runtime = "nodejs";

import { getSessionContext } from "@/lib/auth/session";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import { Buffer } from "buffer";

// ── PDF style sheet ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 12, color: "#6b7280", marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 8, marginTop: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { fontSize: 10, color: "#374151" },
  value: { fontSize: 10, color: "#111827" },
  divider: { borderBottom: "1pt solid #e5e7eb", marginVertical: 8 },
});

export interface ReportSection {
  key: "overview" | "milestones" | "files" | "invoices" | "activity";
  label: string;
}

export interface ReportData {
  projectName: string;
  clientName: string;
  dateRange: { from: string; to: string };
  sections: ReportSection["key"][];
  milestonesSummary?: { total: number; done: number; inProgress: number; overdue: number };
  invoicesSummary?: { totalCents: number; paidCents: number; pendingCents: number };
  filesCount?: number;
}

/**
 * Generates a project report PDF and returns it as a Buffer.
 * Called from ReportBuilderPanel via a form action.
 */
export async function generateProjectPdf(data: ReportData): Promise<{
  success: boolean;
  buffer?: number[];
  filename?: string;
  error?: string;
}> {
  const ctx = await getSessionContext();
  if (!ctx) return { success: false, error: "Not authenticated." };
  if (ctx.role === "client") return { success: false, error: "Clients cannot generate reports." };

  try {
    const doc = createElement(
      Document,
      null,
      createElement(
        Page,
        { size: "A4", style: styles.page },
        createElement(Text, { style: styles.title }, data.projectName),
        createElement(
          Text,
          { style: styles.subtitle },
          `Client: ${data.clientName} · Report period: ${data.dateRange.from} – ${data.dateRange.to}`,
        ),
        createElement(View, { style: styles.divider }),

        // Milestone summary section
        data.sections.includes("milestones") && data.milestonesSummary
          ? createElement(
              View,
              null,
              createElement(Text, { style: styles.sectionTitle }, "Milestone Summary"),
              createElement(
                View,
                { style: styles.row },
                createElement(Text, { style: styles.label }, "Total"),
                createElement(Text, { style: styles.value }, String(data.milestonesSummary.total)),
              ),
              createElement(
                View,
                { style: styles.row },
                createElement(Text, { style: styles.label }, "Completed"),
                createElement(Text, { style: styles.value }, String(data.milestonesSummary.done)),
              ),
              createElement(
                View,
                { style: styles.row },
                createElement(Text, { style: styles.label }, "In Progress"),
                createElement(
                  Text,
                  { style: styles.value },
                  String(data.milestonesSummary.inProgress),
                ),
              ),
              createElement(
                View,
                { style: styles.row },
                createElement(Text, { style: styles.label }, "Overdue"),
                createElement(
                  Text,
                  { style: styles.value },
                  String(data.milestonesSummary.overdue),
                ),
              ),
            )
          : null,

        // Invoice summary section
        data.sections.includes("invoices") && data.invoicesSummary
          ? createElement(
              View,
              null,
              createElement(Text, { style: styles.sectionTitle }, "Invoice Summary"),
              createElement(
                View,
                { style: styles.row },
                createElement(Text, { style: styles.label }, "Total Billed"),
                createElement(
                  Text,
                  { style: styles.value },
                  `$${(data.invoicesSummary.totalCents / 100).toFixed(2)}`,
                ),
              ),
              createElement(
                View,
                { style: styles.row },
                createElement(Text, { style: styles.label }, "Paid"),
                createElement(
                  Text,
                  { style: styles.value },
                  `$${(data.invoicesSummary.paidCents / 100).toFixed(2)}`,
                ),
              ),
              createElement(
                View,
                { style: styles.row },
                createElement(Text, { style: styles.label }, "Pending"),
                createElement(
                  Text,
                  { style: styles.value },
                  `$${(data.invoicesSummary.pendingCents / 100).toFixed(2)}`,
                ),
              ),
            )
          : null,
      ),
    );

    const stream = await pdf(doc).toBuffer();
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as any) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);
    const filename = `${data.projectName.replace(/\s+/g, "-").toLowerCase()}-report.pdf`;
    return { success: true, buffer: Array.from(pdfBuffer), filename };
  } catch (err) {
    console.error("[generateProjectPdf]", err);
    return { success: false, error: "PDF generation failed." };
  }
}

/**
 * Sends a report email to the client via Resend.
 */
export async function sendReportToClient(
  projectId: string,
  clientEmail: string,
  projectName: string,
): Promise<{ success: boolean; error?: string }> {
  const ctx = await getSessionContext();
  if (!ctx) return { success: false, error: "Not authenticated." };
  if (ctx.role === "client") return { success: false, error: "Forbidden." };

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "noreply@clientspace.app",
      to: clientEmail,
      subject: `Project Report: ${projectName}`,
      html: `<p>Hello,</p><p>Please find your project report for <strong>${projectName}</strong> attached.</p><p>— ClientSpace</p>`,
    });

    return { success: true };
  } catch (err) {
    console.error("[sendReportToClient]", err);
    return { success: false, error: "Failed to send email." };
  }
}
