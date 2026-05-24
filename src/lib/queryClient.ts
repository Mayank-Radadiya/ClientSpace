import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

/**
 * Creates a QueryClient instance memoized per-request.
 * Safe for use in Server Components to prefetch/dehydrate queries.
 */
export const createServerQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: Infinity,
        },
      },
    }),
);
