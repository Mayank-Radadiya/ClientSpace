// src/inngest/functions/ai/projectHealthAnalysis.ts
// Nightly cron (02:00 UTC) — analyses every active project via Gemini API.
//
// Architecture:
//   Step 1: fetch-active-projects  → all projects with active status
//   Step 2: process in batches of 10 with rate-limit pauses
//   Step 3: dispatch critical alerts
//
// Security:
//   - Uses bare `db` (no RLS) — Inngest runs outside user session.
//   - Org isolation via explicit WHERE clauses (matches generatePdf.ts pattern).
//   - GEMINI_API_KEY is server-only env var.

import { NonRetriableError } from "inngest";
import { eq, and, inArray } from "drizzle-orm";
import { inngest } from "@/inngest/client";
import { db } from "@/db";
import { projects, organizations, projectHealth } from "@/db/schema";
import {
  compileHealthMetrics,
  type ProjectHealthMetrics,
} from "@/features/projects/lib/compileHealthMetrics";

// ─── Constants ───────────────────────────────────────────────────────────────

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const BATCH_SIZE = 10;
const RATE_LIMIT_PAUSE_SECONDS = 6;
const RETRY_429_DELAY_MS = 30_000;
const MAX_SUMMARY_LENGTH = 300;

// ─── Types ───────────────────────────────────────────────────────────────────

interface GeminiRiskAssessment {
  riskScore: "low" | "medium" | "high" | "critical";
  summary: string;
  reasoning?: string;
}

interface ActiveProject {
  projectId: string;
  orgId: string;
}

// ─── Gemini API Call ─────────────────────────────────────────────────────────

async function callGemini(
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

  const body = JSON.stringify({
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 300,
      responseMimeType: "application/json",
    },
  });

  // First attempt
  let response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  // Handle 429 — wait 30s and retry once
  if (response.status === 429) {
    console.warn(
      `[HealthAnalysis] Gemini 429 for ${metrics.projectName} — waiting ${RETRY_429_DELAY_MS / 1000}s`,
    );
    await new Promise((resolve) => setTimeout(resolve, RETRY_429_DELAY_MS));
    response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.status === 429) {
      throw new Error("Gemini 429 after retry — skipping project");
    }
  }

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Extract token usage
  const tokenUsage = {
    promptTokens: data?.usageMetadata?.promptTokenCount ?? 0,
    completionTokens: data?.usageMetadata?.candidatesTokenCount ?? 0,
    totalTokens: data?.usageMetadata?.totalTokenCount ?? 0,
  };

  // Parse response
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const cleaned = rawText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

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

export const projectHealthNightlyAnalysis = inngest.createFunction(
  {
    id: "project-health-nightly-analysis",
    retries: 2,
    concurrency: { limit: 1 }, // Only one nightly run at a time
  },
  { cron: "0 2 * * *" },
  async ({ step }) => {
    // ── Step 1: Fetch active projects ────────────────────────────────────

    const activeProjects = await step.run(
      "fetch-active-projects",
      async (): Promise<ActiveProject[]> => {
        const results = await db
          .select({
            projectId: projects.id,
            orgId: projects.orgId,
          })
          .from(projects)
          .innerJoin(organizations, eq(projects.orgId, organizations.id))
          .where(
            inArray(projects.status, ["not_started", "in_progress", "review"]),
          );

        console.log(
          `[HealthAnalysis] Processing ${results.length} active projects`,
        );

        return results;
      },
    );

    if (activeProjects.length === 0) {
      return { ok: true, processed: 0, message: "No active projects found" };
    }

    // ── Step 2: Process in batches of 10 ─────────────────────────────────

    let successCount = 0;
    let failCount = 0;
    const criticalProjects: Array<{
      projectId: string;
      orgId: string;
      summary: string;
    }> = [];

    // Chunk into batches
    const batches: ActiveProject[][] = [];
    for (let i = 0; i < activeProjects.length; i += BATCH_SIZE) {
      batches.push(activeProjects.slice(i, i + BATCH_SIZE));
    }

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx]!;

      // Process each batch as a step (for Inngest retry granularity)
      const batchResult = await step.run(
        `process-batch-${batchIdx}`,
        async () => {
          const results: Array<{
            success: boolean;
            projectId: string;
            orgId: string;
            riskScore?: string;
            summary?: string;
          }> = [];

          for (const { projectId, orgId } of batch) {
            try {
              // Compile metrics
              const metrics = await compileHealthMetrics(projectId, db);

              // Call Gemini
              let assessment: GeminiRiskAssessment;
              let tokenUsage = {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
              };

              try {
                const geminiResult = await callGemini(metrics);
                assessment = geminiResult.assessment;
                tokenUsage = geminiResult.tokenUsage;
              } catch (geminiError) {
                // Fallback if Gemini fails
                console.error(
                  `[HealthAnalysis] Gemini failed for ${metrics.projectName}:`,
                  geminiError,
                );
                assessment = {
                  riskScore: "medium",
                  summary:
                    "Health analysis unavailable — metrics compiled successfully.",
                };
              }

              // Insert into project_health (snapshot — not upsert)
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

              results.push({
                success: true,
                projectId,
                orgId,
                riskScore: assessment.riskScore,
                summary: assessment.summary,
              });
            } catch (projectError) {
              console.error(
                `[HealthAnalysis] Failed for project ${projectId}:`,
                projectError,
              );
              results.push({ success: false, projectId, orgId });
            }
          }

          return results;
        },
      );

      // Accumulate counters
      for (const result of batchResult) {
        if (result.success) {
          successCount++;
          if (result.riskScore === "critical") {
            criticalProjects.push({
              projectId: result.projectId,
              orgId: result.orgId,
              summary: result.summary ?? "",
            });
          }
        } else {
          failCount++;
        }
      }

      // Rate limit pause between batches (skip after last batch)
      if (batchIdx < batches.length - 1) {
        await step.sleep(
          `rate-limit-pause-${batchIdx}`,
          `${RATE_LIMIT_PAUSE_SECONDS} seconds`,
        );
      }
    }

    // ── Step 3: Dispatch critical alerts ──────────────────────────────────

    if (criticalProjects.length > 0) {
      await step.run("dispatch-critical-alerts", async () => {
        for (const cp of criticalProjects) {
          await inngest.send({
            name: "project/health.critical",
            data: {
              projectId: cp.projectId,
              orgId: cp.orgId,
              summary: cp.summary,
            },
          });
        }
        console.log(
          `[HealthAnalysis] Dispatched ${criticalProjects.length} critical alert(s)`,
        );
      });
    }

    console.log(
      `[HealthAnalysis] Completed: ${successCount} ok, ${failCount} failed`,
    );

    return {
      ok: true,
      processed: activeProjects.length,
      successCount,
      failCount,
      criticalAlerts: criticalProjects.length,
    };
  },
);
