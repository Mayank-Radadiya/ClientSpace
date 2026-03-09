"use client";

import { GooeyToaster as GoeyToasterPrimitive, gooeyToast } from "goey-toast";
import type { GooeyToasterProps } from "goey-toast";
import "goey-toast/styles.css";
import { useTheme } from "next-themes";

export { gooeyToast };
export type { GooeyToasterProps };
export type {
  GooeyToastOptions,
  GooeyPromiseData,
  GooeyToastAction,
  GooeyToastClassNames,
  GooeyToastTimings,
} from "goey-toast";

function GoeyToaster({ theme, ...props }: GooeyToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <GoeyToasterPrimitive
      theme={theme ?? (resolvedTheme === "dark" ? "dark" : "light")}
      richColors={true}
      preset="smooth"
      {...props}
    />
  );
}

export { GoeyToaster };
