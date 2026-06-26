"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  /** When true, uses full-bleed background with clamped padding — the "premium" look */
  bleed?: boolean;
  className?: string;
}

export function PageLayout({
  children,
  title,
  subtitle,
  actions,
  bleed = false,
  className,
}: PageLayoutProps) {
  const Wrapper = bleed ? FullBleedWrapper : StandardWrapper;

  return (
    <Wrapper className={className}>
      {(title || actions) && (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && (
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </Wrapper>
  );
}

function StandardWrapper({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  );
}

function FullBleedWrapper({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("-m-4 min-h-screen md:-m-6", className)}
      style={{ padding: "clamp(24px, 4vw, 40px)" }}
    >
      {/* Dark mode only: radial spotlight */}
      <div
        className="pointer-events-none fixed inset-0 z-0 hidden dark:block"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at -10% -10%, rgba(108,99,255,0.10) 0%, transparent 60%)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-[1400px] space-y-6">
        {children}
      </div>
    </div>
  );
}
