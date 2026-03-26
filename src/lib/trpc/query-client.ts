import { QueryClient } from "@tanstack/react-query";

/**
 * Production QueryClient defaults.
 *
 * staleTime: 5min  — Data is considered fresh for 5 minutes. Server-side prefetch
 *                    fills the page on load; client won't re-fetch on navigation
 *                    within that window, eliminating redundant DB round trips.
 * gcTime: 10min    — Unused cache entries garbage-collected after 10 minutes.
 * refetchOnWindowFocus: false — Don't refetch when user tabs back to the app.
 *                    For a project management dashboard this is always safe.
 * retry: 1         — Retry once on failure (default is 3, too noisy for UI).
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: "always",
        retry: 1,
      },
    },
  });
}

/**
 * Singleton for the browser.
 *
 * This is required for server-side prefetching + hydration to work correctly.
 * If we created a new QueryClient inside useState, we'd get a fresh (empty)
 * client on every render, losing the dehydrated server state.
 */
let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always create a new QueryClient per request
    return makeQueryClient();
  }
  // Browser: reuse the singleton so dehydrated state is preserved
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
