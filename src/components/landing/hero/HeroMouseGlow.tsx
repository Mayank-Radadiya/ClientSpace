'use client';

import { useState, useEffect } from "react";
import { useMotionValue, useSpring, motion } from "framer-motion";

export function HeroMouseGlow() {
  const [isFine, setIsFine] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 120, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 20 });

  useEffect(() => {
    // Only mount on desktop (fine pointer)
    setIsFine(window.matchMedia("(pointer: fine)").matches);

    const handleMouseMove = (e: MouseEvent) => {
      // Get the closest section (hero container)
      const section = (e.target as HTMLElement).closest('section');
      if (!section) return;

      const rect = section.getBoundingClientRect();
      // Mouse position relative to the section
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  if (!isFine) return null;

  return (
    <motion.div
      className="pointer-events-none absolute z-[5] h-[600px] w-[600px] rounded-full"
      style={{
        background: "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)",
        left: springX,
        top: springY,
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}
