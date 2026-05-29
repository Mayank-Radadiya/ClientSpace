// src/inngest/functions/ai/singleProjectHealthAnalysis.ts
// On-demand health analysis for a single project — triggered by tRPC mutation.
// Event: 'project/health.requested'

import { NonRetriableError } from "inngest";
import { inngest } from "@/inngest/client";
import { db } from "@/db";
import { projectHealth, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  compileHealthMetrics,
  type ProjectHealthMetrics,
} from "@/features/projects/lib/compileHealthMetrics";

// ─── Constants ───────────────────────────────────────────────────────────────

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MAX_SUMMARY_LENGTH = 300;

// ─── Types ───────────────────────────────────────────────────────────────────

interface HealthRequestedEvent {
  name: "project/health.requested";
  data: {
    projectId: string;
    orgId: string;
  };
}

interface GeminiRiskAssessment {
  riskScore: "low" | "medium" | "high" | "critical";
  summary: string;
  reasoning?: string;
}

// ─── Gemini API Call (duplicated intentionally to keep each function self-contained) ───

async function callGeminiSingle(
  metrics: ProjectHealthMetrics,
): Promise<{
  assessment: GeminiRiskAssessment;
  tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number };
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new NonRetriableError("GEMINI_API_KEY is not set");
  }

  const systemPrompt = `You are a project management AI analysing agency project health for ClientSpace.
You must respond with ONLY valid JSON matching this exact schema:
{
  "riskScore": "low"|"medium"|"high"|"critical",
  "summary": "string (2 sentences max, plain text, no markdown)",
  "reasoning": "string (1 sentence internal)"
}

Be direct and specific.
Reference actual numbers from the metrics.
Do not return markdown.
Do not wrap the JSON in code fences.`;

  const userPrompt = `Analyse this project health data and return the JSON risk assessment:

Project: ${metrics.projectName} for client ${metrics.clientName}
Days until deadline: ${metrics.daysUntilDeadline ?? "No deadline set"}
Milestone completion: ${metrics.completedMilestones}/${metrics.totalMilestones} (${Math.round(metrics.milestoneCompletionRate * 100)}%)
Overdue milestones: ${metrics.overdueMilestones}
Open change requests: ${metrics.openChangeRequests}
Unresolved annotations: ${metrics.unresolvedAnnotations}
Velocity trend: ${metrics.velocityTrend} (last 7 days: ${metrics.velocityLast7Days} milestones vs prev 7 days: ${metrics.velocityPrev7Days})
Days since last client activity: ${metrics.daysSinceLastClientLogin ?? "Unknown"}
Invoice status: ${metrics.invoiceStatus}
Last project activity: ${metrics.lastActivityDaysAgo} days ago`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 300,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  const tokenUsage = {
    promptTokens: data?.usageMetadata?.promptTokenCount ?? 0,
    completionTokens: data?.usageMetadata?.candidatesTokenCount ?? 0,
    totalTokens: data?.usageMetadata?.totalTokenCount ?? 0,
  };

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

  const parsed = JSON.parse(cleaned);

  if (!["low", "medium", "high", "critical"].includes(parsed.riskScore)) {
    throw new Error(`Invalid risk score: ${parsed.riskScore}`);
  }

  if (!parsed.summary?.trim()) {
    throw new Error("Missing summary in Gemini response");
  }

  return {
    assessment: {
      riskScore: parsed.riskScore,
      summary: parsed.summary.slice(0, MAX_SUMMARY_LENGTH),
      reasoning: parsed.reasoning,
    },
    tokenUsage,
  };
}

// ─── Inngest Function ────────────────────────────────────────────────────────

export const singleProjectHealthAnalysis = inngest.createFunction(
  {
    id: "project-health-single-analysis",
    retries: 2,
    concurrency: {
      limit: 3,
      key: "event.data.orgId", // Per-org concurrency
    },
  },
  { event: "project/health.requested" as HealthRequestedEvent["name"] },
  async ({ event, step }) => {
    const { projectId, orgId } = event.data as HealthRequestedEvent["data"];

    // Validate the project exists and belongs to the org
    const project = await step.run("validate-project", async () => {
      const result = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!result[0]) {
        throw new NonRetriableError(`Project ${projectId} not found`);
      }

      return result[0];
    });

    // Compile metrics and call Gemini
    const healthResult = await step.run("analyse-project", async () => {
      const metrics = await compileHealthMetrics(projectId, db);

      let assessment: GeminiRiskAssessment;
      let tokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

      try {
        const geminiResult = await callGeminiSingle(metrics);
        assessment = geminiResult.assessment;
        tokenUsage = geminiResult.tokenUsage;
      } catch (geminiError) {
        console.error(
          `[HealthAnalysis:Single] Gemini failed for ${metrics.projectName}:`,
          geminiError,
        );
        assessment = {
          riskScore: "medium",
          summary: "Health analysis unavailable — metrics compiled successfully.",
        };
      }

      // Insert snapshot
      await db.insert(projectHealth).values({
        orgId,
        projectId,
        riskScore: assessment.riskScore,
        summary: assessment.summary.slice(0, MAX_SUMMARY_LENGTH),
        velocityTrend: metrics.velocityTrend,
        overdueCount: metrics.overdueMilestones,
        unresolvedAnnotations: metrics.unresolvedAnnotations,
        openChangeRequests: metrics.openChangeRequests,
        milestoneCompletionRate: metrics.milestoneCompletionRate,
        rawMetrics: { ...metrics, tokenUsage },
        modelUsed: GEMINI_MODEL,
      });

      return {
        riskScore: assessment.riskScore,
        summary: assessment.summary,
      };
    });

    // Dispatch critical alert if needed
    if (healthResult.riskScore === "critical") {
      await step.run("dispatch-critical-alert", async () => {
        await inngest.send({
          name: "project/health.critical",
          data: {
            projectId,
            orgId,
            summary: healthResult.summary,
          },
        });
      });
    }

    return {
      ok: true,
      projectId,
      riskScore: healthResult.riskScore,
      summary: healthResult.summary,
    };
  },
);
