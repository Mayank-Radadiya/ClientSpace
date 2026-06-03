'use client';

import { motion, useSpring, useTransform, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function NumberTicker({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const spring = useSpring(0, { duration: 2000, bounce: 0 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

  useEffect(() => {
    if (inView) {
      spring.set(value);
    }
  }, [inView, spring, value]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

export function HeroSocialProof() {
  const avatars = [
    { color: "#3B4A6B", initials: "RK" },
    { color: "#4A3B6B", initials: "AL" },
    { color: "#3B6B4A", initials: "JS" },
    { color: "#6B4A3B", initials: "TC" },
    { color: "#3B5F6B", initials: "MR" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.65 }}
      className="relative z-10 flex flex-col items-center gap-4 md:flex-row md:gap-6"
    >
      {/* Avatars */}
      <div className="flex" aria-label="Profile pictures of ClientSpace users">
        {avatars.map((avatar, i) => (
          <div
            key={i}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#111] text-[10px] font-medium text-white/80"
            style={{
              backgroundColor: avatar.color,
              marginLeft: i === 0 ? 0 : "-8px",
              zIndex: 10 - i,
            }}
          >
            {avatar.initials}
          </div>
        ))}
      </div>

      {/* Separator (Desktop only) */}
      <div className="hidden h-[20px] w-[1px] bg-[#2A2A2A] md:block" />

      {/* Star Rating */}
      <div className="flex items-center gap-2">
        <div className="flex text-[14px] text-[#F59E0B]">
          ★★★★★
        </div>
        <span className="text-[13px] text-[#A3A3A3]">4.9 / 5.0</span>
      </div>

      {/* Separator (Desktop only) */}
      <div className="hidden h-[20px] w-[1px] bg-[#2A2A2A] md:block" />

      {/* User Count */}
      <div className="text-[13px] text-[#525252]">
        Trusted by <span className="font-mono"><NumberTicker value={2400} />+</span> agencies
      </div>
    </motion.div>
  );
}
