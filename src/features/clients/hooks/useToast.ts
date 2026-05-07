"use client";

import { useState, useCallback, useRef } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
  undoLabel?: string;
  onUndo?: () => void;
  duration?: number;
};

const MAX_TOASTS = 3;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timerRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    clearTimeout(timerRefs.current[id]);
    delete timerRefs.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (item: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).slice(2);
      const duration = item.duration ?? 4000;

      setToasts((prev) => {
        const next = [...prev, { ...item, id }];
        return next.slice(-MAX_TOASTS);
      });

      timerRefs.current[id] = setTimeout(() => {
        dismiss(id);
      }, duration);

      return id;
    },
    [dismiss],
  );

  const success = useCallback(
    (message: string, opts?: { undoLabel?: string; onUndo?: () => void }) =>
      addToast({ type: "success", message, ...opts }),
    [addToast],
  );

  const error = useCallback(
    (message: string) => addToast({ type: "error", message }),
    [addToast],
  );

  const info = useCallback(
    (message: string) => addToast({ type: "info", message }),
    [addToast],
  );

  const warning = useCallback(
    (message: string) => addToast({ type: "warning", message }),
    [addToast],
  );

  return { toasts, dismiss, success, error, info, warning };
}
