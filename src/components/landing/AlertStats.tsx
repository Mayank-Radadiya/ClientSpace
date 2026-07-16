"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import Link from "next/link";
import { SectionMeta } from "./SectionMeta";

function AnimatedCounter({
  end,
  duration = 1200,
}: {
  end: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let startTime: number | null = null;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    function animate(now: number) {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setVal(Math.floor(easeOut(progress) * end));
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [inView, end, duration]);

  return <span ref={ref}>{val.toLocaleString()}</span>;
}

export function AlertStats() {
  return (
    <section className="border-y border-[#1a1a1a] bg-[#111] py-20">
      <div className="mx-auto max-w-[960px] px-6 pt-0 md:px-10">
        <SectionMeta
          code="BULLETIN # 01"
          sheet="1"
          total="1"
          location="US-EAST-1"
        />

        <div className="mt-12 grid items-start gap-16 md:grid-cols-[55%_45%]">
          <div>
            <h2 className="font-display mb-6 text-[clamp(40px,6vw,64px)] leading-[1] tracking-[-0.01em] italic">
              <span className="text-[#fafafa]">Silence your alerts,</span>
              <br />
              <span className="text-[#555]">with</span>{" "}
              <span className="text-[#555]">confidence.</span>
            </h2>
            <p className="max-w-sm text-[16px] leading-[1.7] text-[#a0a0a0]">
              One platform to manage client communications, approvals, and
              payments. No more Slack notifications about the same project in
              three different channels.
            </p>
          </div>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="border border-[#222] p-6"
            >
              <div className="stat-number">
                <AnimatedCounter end={217} />+
              </div>
              <div className="mt-2 font-mono text-[10px] tracking-[0.15em] text-[#555] uppercase">
                ALERTS PER WEEK · BEFORE
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-[#fafafa] p-6"
            >
              <div className="stat-number text-[#0a0a0a]">
                <AnimatedCounter end={2} />
              </div>
              <div className="mt-2 font-mono text-[10px] tracking-[0.15em] text-[#0a0a0a] uppercase">
                ALERTS PER WEEK · ON MERIDIAN
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="border border-[#222] p-6"
            >
              <div className="stat-number">
                <AnimatedCounter end={215} />+
              </div>
              <div className="mt-2 font-mono text-[10px] tracking-[0.15em] text-[#555] uppercase">
                ALERTS YOU NEVER SEE
              </div>
            </motion.div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-[#1a1a1a] pt-6 md:flex-row md:items-center">
          <div>
            <span className="text-[18px] text-[#a0a0a0]">
              This is not a notification.
            </span>{" "}
            <span className="font-display text-[18px] text-[#fafafa] italic">
              It&apos;s the product.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/signup"
              className="bg-[#fafafa] px-6 py-2.5 text-[11px] font-medium tracking-tight text-[#0a0a0a] transition-all duration-200 hover:border hover:border-[#fafafa] hover:bg-[#0a0a0a] hover:text-[#fafafa]"
            >
              Start free trial
            </Link>
            <Link
              href="#pricing"
              className="border border-[#333] px-6 py-2.5 text-[11px] tracking-tight text-[#a0a0a0] transition-all duration-200 hover:border-[#555] hover:text-[#fafafa]"
            >
              See pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
