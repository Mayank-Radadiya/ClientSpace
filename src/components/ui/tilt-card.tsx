"use client";

import React, { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  tiltDegree?: number;
  perspective?: number;
}

export function TiltCard({
  children,
  className,
  tiltDegree = 4,
  perspective = 1200,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ x, y }, setTilt] = useState({ x: 0, y: 0 });
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={cn("w-full", className)}>{children}</div>;
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -py * tiltDegree, y: px * tiltDegree });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX: x, rotateY: y }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className={cn("w-full", className)}
      style={{ perspective: `${perspective}px` }}
    >
      <div style={{ transformStyle: "preserve-3d" }}>{children}</div>
    </motion.div>
  );
}
