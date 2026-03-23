import { QueryClient } from "@tanstack/react-query";

/**
 * Production QueryClient defaults.
 *
 * staleTime: 60s   — Data is considered fresh for 60 seconds. No refetch on
 *                    mount or navigation if the cache is less than 60s old.
 * gcTime: 5min     — Unused cache entries are garbage-collected after 5 minutes.
 * refetchOnWindowFocus: false — Don't refetch when user tabs back to the app.
 *                    For a project management dashboard this is always safe.
 * retry: 1         — Retry once on failure (default is 3, too noisy for UI).
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
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
