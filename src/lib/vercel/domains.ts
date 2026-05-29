// src/lib/vercel/domains.ts
// Server-side-only utility for managing custom domains via the Vercel Domains API.
// NEVER import this module from client components or edge middleware without the Redis cache layer.
//
// Required env vars:
//   VERCEL_API_TOKEN  — Personal Access Token with project:read + domain:write scopes
//   VERCEL_PROJECT_ID — Found in Vercel project Settings → General
//   VERCEL_TEAM_ID    — Required if the project belongs to a Vercel team (optional for personal)

const VERCEL_API_BASE = "https://api.vercel.com";

function getHeaders() {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) {
    throw new Error(
      "[vercel/domains] VERCEL_API_TOKEN environment variable is not set.",
    );
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function getProjectUrl(path: string) {
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      "[vercel/domains] VERCEL_PROJECT_ID environment variable is not set.",
    );
  }
  const teamId = process.env.VERCEL_TEAM_ID;
  const teamParam = teamId ? `?teamId=${teamId}` : "";
  return `${VERCEL_API_BASE}/v10/projects/${projectId}${path}${teamParam}`;
}

function getProjectUrlV9(path: string) {
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      "[vercel/domains] VERCEL_PROJECT_ID environment variable is not set.",
    );
  }
  const teamId = process.env.VERCEL_TEAM_ID;
  const teamParam = teamId ? `?teamId=${teamId}` : "";
  return `${VERCEL_API_BASE}/v9/projects/${projectId}${path}${teamParam}`;
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface VercelDomainStatus {
  /** Our internal status bucket */
  status: "active" | "verifying" | "error";
  /** Whether Vercel considers the domain verified */
  verified: boolean;
  /** The CNAME target agencies should point to */
  cnameTarget?: string;
  /** TXT record details if Vercel requires TXT verification */
  txtRecord?: {
    name: string;
    value: string;
  };
  /** Human-readable error message */
  error?: string;
}

// ── Functions ────────────────────────────────────────────────────────────────

/**
 * Adds a domain to the Vercel project.
 * Idempotent — 409 (already exists on this project) is treated as success.
 */
export async function addDomainToVercel(
  domain: string,
): Promise<{ success: boolean; error?: string }> {
  const url = getProjectUrl("/domains");

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ name: domain }),
    });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Network error calling Vercel API";
    console.error("[vercel/domains] addDomainToVercel network error:", msg);
    return { success: false, error: `Network error: ${msg}` };
  }

  // 409 = domain already exists on THIS project — idempotent success
  if (res.status === 409) {
    return { success: true };
  }

  if (res.status === 200 || res.status === 201) {
    return { success: true };
  }

  // 403 = domain is in use on another Vercel project
  if (res.status === 403) {
    return {
      success: false,
      error:
        "This domain is already in use on another project. Please remove it from the other project first.",
    };
  }

  // Any other error — surface the Vercel API error message
  let body: { error?: { message?: string }; message?: string } = {};
  try {
    body = await res.json();
  } catch {
    // Non-JSON body — use status text
  }
  const errorMsg =
    body?.error?.message ||
    body?.message ||
    `Vercel API error: ${res.status} ${res.statusText}`;

  console.error("[vercel/domains] addDomainToVercel failed:", errorMsg);
  return { success: false, error: errorMsg };
}

/**
 * Removes a domain from the Vercel project.
 * Silently succeeds if the domain returns 404 (already removed).
 */
export async function removeDomainFromVercel(
  domain: string,
): Promise<{ success: boolean }> {
  const url = getProjectUrl(`/domains/${encodeURIComponent(domain)}`);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "DELETE",
      headers: getHeaders(),
    });
  } catch (err) {
    console.error("[vercel/domains] removeDomainFromVercel network error:", err);
    // Best-effort — return success to avoid blocking org cleanup
    return { success: true };
  }

  // 404 = already gone — treat as success
  if (res.status === 404 || res.status === 200 || res.status === 204) {
    return { success: true };
  }

  console.error(
    `[vercel/domains] removeDomainFromVercel unexpected status ${res.status} for ${domain}`,
  );
  // Still return success — we don't want a Vercel glitch to block domain removal in our DB
  return { success: true };
}

/**
 * Fetches the current DNS verification status from Vercel for a domain.
 * Maps the Vercel API response to our internal VercelDomainStatus shape.
 */
export async function getDomainVerificationStatus(
  domain: string,
): Promise<VercelDomainStatus> {
  const url = getProjectUrlV9(`/domains/${encodeURIComponent(domain)}`);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
      // No caching — we need live status for polling
      cache: "no-store",
    });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Network error calling Vercel API";
    console.error(
      "[vercel/domains] getDomainVerificationStatus network error:",
      msg,
    );
    return { status: "error", verified: false, error: `Network error: ${msg}` };
  }

  if (!res.ok) {
    let body: { error?: { code?: string; message?: string } } = {};
    try {
      body = await res.json();
    } catch {
      // ignore parse error
    }
    const errorMsg =
      body?.error?.message ||
      `Vercel API error: ${res.status} ${res.statusText}`;
    return { status: "error", verified: false, error: errorMsg };
  }

  // Parse the Vercel domain object
  // Reference: https://vercel.com/docs/rest-api/endpoints/projects#get-a-project-domain
  let data: {
    verified?: boolean;
    verification?: Array<{
      type: string;
      domain: string;
      value: string;
      reason: string;
    }>;
    error?: {
      code?: string;
      message?: string;
    };
    cnames?: string[];
  };

  try {
    data = await res.json();
  } catch {
    return {
      status: "error",
      verified: false,
      error: "Failed to parse Vercel API response",
    };
  }

  // domain_taken = another org has this domain in Vercel (cross-project conflict)
  if (data.error?.code === "domain_taken") {
    return {
      status: "error",
      verified: false,
      error:
        "This domain is already in use on another Vercel project. Please remove it from the other project first.",
    };
  }

  if (data.verified === true) {
    return {
      status: "active",
      verified: true,
      cnameTarget: "cname.vercel-dns.com",
    };
  }

  // Not yet verified — check if there's a TXT record requirement
  const txtEntry = data.verification?.find((v) => v.type === "TXT");

  return {
    status: "verifying",
    verified: false,
    cnameTarget: "cname.vercel-dns.com",
    txtRecord: txtEntry
      ? {
          name: txtEntry.domain,
          value: txtEntry.value,
        }
      : undefined,
  };
}
