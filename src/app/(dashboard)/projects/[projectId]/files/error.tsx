"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[420px] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center">
        <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/40">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </span>
        <h2 className="text-lg font-semibold tracking-tight">Unable to load files</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Something went wrong while loading this project files page.
        </p>
        <Button className="mt-5 h-9" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
