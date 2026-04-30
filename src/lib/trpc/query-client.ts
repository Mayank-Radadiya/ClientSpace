import { QueryClient } from "@tanstack/react-query";

/**
 * Production QueryClient defaults — aggressive caching strategy.
 *
 * PHILOSOPHY: Data fetches ONCE on first visit, then serves from cache
 * on all subsequent navigations. Cache resets only via:
 *   1. Explicit `utils.<router>.<procedure>.invalidate()` after a mutation
 *   2. Browser hard refresh (full page reload)
 *
 * staleTime: Infinity       — Data is NEVER considered stale automatically.
 *                             Queries only refetch when explicitly invalidated.
 * gcTime: 30min             — Unused cache entries garbage-collected after 30 min.
 *                             This is generous so navigating back to a page hours
 *                             later in long sessions still hits cache.
 * refetchOnWindowFocus: false — Don't refetch when user tabs back to the app.
 * refetchOnReconnect: false  — Don't refetch when network reconnects.
 * refetchOnMount: false      — Don't refetch when a component mounts if data
 *                             exists in cache. This is the key setting that
 *                             prevents navigation-triggered re-fetches.
 * retry: 1                  — Retry once on failure (default is 3, too noisy).
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
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
