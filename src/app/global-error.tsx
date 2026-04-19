"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[RootGlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-white px-4 text-slate-900">
          <div className="max-w-md space-y-4 text-center">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-sm text-slate-600">
              We hit an unexpected error while loading the app shell.
            </p>
            {error.digest ? (
              <p className="font-mono text-xs text-slate-500">
                Error ID: {error.digest}
              </p>
            ) : null}
            <button
              onClick={reset}
              className="rounded-md bg-black px-4 py-2 text-sm text-white"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
