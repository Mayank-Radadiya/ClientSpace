import { headers } from "next/headers";
import { db } from "@/db";
import { authEvents } from "@/db/schema";

export interface LogAuthEventParams {
  event:
    | "login_success"
    | "login_failure"
    | "logout"
    | "password_change"
    | "password_reset_request"
    | "password_reset_complete"
    | "role_change"
    | "invite_accepted"
    | "account_locked"
    | "oauth_login"
    | "contract_signed";
  userId?: string;
  orgId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export async function logAuthEvent(params: LogAuthEventParams) {
  try {
    let finalUserAgent = params.userAgent;
    if (!finalUserAgent) {
      try {
        const headersList = await headers();
        finalUserAgent = headersList.get("user-agent") ?? undefined;
      } catch {
        // Headers might not be available if called outside request context (e.g., scripts)
      }
    }

    await db.insert(authEvents).values({
      userId: params.userId,
      orgId: params.orgId,
      event: params.event,
      ip: params.ip,
      userAgent: finalUserAgent,
      metadata: params.metadata,
    });
  } catch (error) {
    console.error("Failed to log auth event:", error);
  }
}
