"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

// ── State machine types ──────────────────────────────────────
type SaveState = "idle" | "saving" | "saved" | "error";

export function useSaveIndicator() {
  const [state, setState] = useState<SaveState>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = useCallback(async (fn: () => Promise<void>) => {
    setState("saving");
    try {
      await fn();
      setState("saved");
      // Auto-fade after 2s
      timerRef.current = setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
    }
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { saveState: state, triggerSave: trigger, resetSave: reset };
}

// ── Visual indicator ─────────────────────────────────────────
interface SaveIndicatorProps {
  state: SaveState;
  onRetry?: () => void;
}

export function SaveIndicator({ state, onRetry }: SaveIndicatorProps) {
  if (state === "idle") return null;

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {state === "saving" && (
        <>
          <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
          <span className="text-muted-foreground">Saving…</span>
        </>
      )}
      {state === "saved" && (
        <>
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          <span className="text-green-500">Saved ✓</span>
        </>
      )}
      {state === "error" && (
        <>
          <AlertCircle className="h-3 w-3 text-red-500" />
          <span className="text-red-500">
            Failed to save
            {onRetry && (
              <>
                {" · "}
                <button
                  onClick={onRetry}
                  className="underline hover:no-underline"
                >
                  Retry
                </button>
              </>
            )}
          </span>
        </>
      )}
    </div>
  );
}
