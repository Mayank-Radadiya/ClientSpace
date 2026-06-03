'use client';

import { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface RetroGridProps extends React.HTMLAttributes<HTMLDivElement> {
  angle?: number;
  cellSize?: number;
  lightLineColor?: string;
  darkLineColor?: string;
  opacity?: number;
}

export function RetroGrid({
  className,
  angle = 65,
  cellSize = 60,
  lightLineColor = "rgba(99, 102, 241, 0.15)",
  darkLineColor = "rgba(99, 102, 241, 0.08)",
  opacity = 0.5,
  style,
  ...props
}: RetroGridProps) {
  const gridStyles = {
    "--grid-angle": `${angle}deg`,
    "--cell-size": `${cellSize}px`,
    "--light-line": lightLineColor,
    "--dark-line": darkLineColor,
  } as CSSProperties;

  return (
    <div
      className={cn(
        "pointer-events-none absolute h-full w-full overflow-hidden [perspective:200px]",
        className
      )}
      style={{ ...gridStyles, ...style }}
      {...props}
    >
      {/* Grid container */}
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div
          className={cn(
            "animate-grid",
            "[background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)] [height:300vh] [inset:0%_0px] [margin-left:-50%] [transform-origin:100%_0_0] [width:600vw]",
            // Background image: linear gradients for grid lines
            "[background-image:linear-gradient(to_right,var(--light-line)_1px,transparent_0),linear-gradient(to_bottom,var(--light-line)_1px,transparent_0)]",
            "dark:[background-image:linear-gradient(to_right,var(--dark-line)_1px,transparent_0),linear-gradient(to_bottom,var(--dark-line)_1px,transparent_0)]"
          )}
          style={{ opacity }}
        />
      </div>

      {/* Grid fade out gradient mask */}
      <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent to-90% dark:from-black" />
    </div>
  );
}
