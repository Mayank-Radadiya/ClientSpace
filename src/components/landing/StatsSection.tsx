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
    function animate(now: number) {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [inView, end, duration]);

  return <span ref={ref}>{val.toLocaleString()}</span>;
}

export function StatsSection() {
  return (
    <section className="border-y border-cs-hairline bg-cs-bg-raised py-20">
      <div className="mx-auto max-w-[960px] px-6 md:px-10">
        <SectionMeta
          code="BULLETIN # 01"
          sheet="1"
          total="1"
          location="US-EAST-1"
        />

        <div className="mt-12 grid items-start gap-16 md:grid-cols-[55%_45%]">
          <div>
            <h2 className="font-display mb-6 text-[clamp(40px,6vw,64px)] leading-[1] tracking-[-0.01em] italic">
              <span className="text-cs-ink">Quieter,</span>{" "}
              <span className="text-cs-faint">with confidence.</span>
            </h2>
            <p className="max-w-sm text-[16px] leading-[1.7] text-cs-ink-muted">
              One platform to manage client communications, approvals, and
              payments. No more Slack notifications about the same project in
              three different channels.
            </p>
          </div>

          <div className="space-y-4">
            {/* Before — 217+ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="border border-cs-line-strong p-6"
            >
              <div className="stat-number">
                <AnimatedCounter end={217} />+
              </div>
              <div className="mt-2 font-data text-[10px] tracking-[0.15em] text-cs-faint uppercase">
                Alerts per week · before
              </div>
            </motion.div>

            {/* On ClientSpace — 6 (the missing number, now filled in) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="border border-cs-line-strong bg-cs-cta-bg p-6"
            >
              <div className="stat-number text-cs-cta-text">
                <AnimatedCounter end={6} />
              </div>
              <div className="mt-2 font-data text-[10px] tracking-[0.15em] text-cs-cta-text uppercase">
                Alerts per week · on clientspace
              </div>
            </motion.div>

            {/* Never see — 211 (217 - 6, the math adds up) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="border border-cs-line-strong p-6"
            >
              <div className="stat-number">
                <AnimatedCounter end={211} />
              </div>
              <div className="mt-2 font-data text-[10px] tracking-[0.15em] text-cs-faint uppercase">
                Alerts you never see
              </div>
            </motion.div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-cs-hairline pt-6 md:flex-row md:items-center">
          <div>
            <span className="text-[18px] text-cs-ink-muted">
              This is not a notification.
            </span>{" "}
            <span className="font-display text-[18px] text-cs-ink italic">
              It&apos;s the product.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/signup"
              className="bg-cs-cta-bg px-6 py-2.5 text-[11px] font-medium tracking-tight text-cs-cta-text transition-all duration-200 hover:opacity-90"
            >
              Start free trial
            </Link>
            <Link
              href="#pricing"
              className="border border-cs-line-strong px-6 py-2.5 text-[11px] tracking-tight text-cs-ink-muted transition-all duration-200 hover:border-cs-faint hover:text-cs-accent-ink"
            >
              See pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
