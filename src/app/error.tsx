"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[AppError]", error);
  }, [error]);

  return (
    <main className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <span className="bg-destructive/10 flex h-20 w-20 items-center justify-center rounded-2xl">
            <AlertCircle className="text-destructive h-10 w-10" />
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
            500
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Something Went Wrong
          </h1>
          <p className="text-muted-foreground">
            An unexpected error occurred. Our team has been notified. You can
            try again, or head back to the dashboard.
          </p>
          {error.digest ? (
            <p className="text-muted-foreground font-mono text-xs">
              Error ID: {error.digest}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            onClick={reset}
            variant="default"
            className="w-full sm:w-auto"
          >
            Try Again
          </Button>
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full sm:w-auto",
            )}
          >
            <Home className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <p className="text-muted-foreground text-xs">Powered by ClientSpace</p>
      </div>
    </main>
  );
}
