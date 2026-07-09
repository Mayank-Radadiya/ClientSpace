"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useRef, useState } from "react";

/* ─── Easing ─────────────────────────────── */
const easeOut = [0.16, 1, 0.3, 1] as const;

/* ─── Dashboard data ─────────────────────── */
const METRICS = [
  { label: "Active Projects", value: "8", trend: "+2 this month" },
  { label: "Pending Approvals", value: "3", trend: "Awaiting review" },
  { label: "Revenue MTD", value: "$12.4k", trend: "+18% vs last month" },
  { label: "Open Invoices", value: "$3.2k", trend: "2 outstanding" },
] as const;

const PROJECTS = [
  {
    name: "Luminary Rebrand",
    client: "Acme Corp",
    status: "In Progress" as const,
    due: "Jun 15",
  },
  {
    name: "Portal Launch",
    client: "Riviera Co",
    status: "Review" as const,
    due: "Jun 20",
  },
  {
    name: "Q3 Campaign",
    client: "Studio X",
    status: "On Track" as const,
    due: "Jul 01",
  },
];

const ANNOTATIONS = [
  { label: "Live project tracking", top: "26%", left: "102%" },
  { label: "One-click approvals", top: "52%", left: "102%" },
  { label: "Milestone payments", top: "76%", left: "102%" },
] as const;

function statusStyle(status: (typeof PROJECTS)[number]["status"]) {
  switch (status) {
    case "In Progress":
      return "bg-lp-accent/10 text-lp-accent";
    case "Review":
      return "bg-amber-50 text-amber-700";
    case "On Track":
      return "bg-emerald-50 text-emerald-700";
  }
}

/* ─── ProductShowcase ────────────────────── */
export function ProductShowcase() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "center 40%"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [14, 0]);
  const rotateY = useTransform(scrollYProgress, [0, 1], [-9, 0]);
  const translateY = useTransform(scrollYProgress, [0, 1], [80, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 1], [0.4, 0.8, 1]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseTilt({ x: -py * 3, y: px * 3 });
  };

  const handleMouseLeave = () => setMouseTilt({ x: 0, y: 0 });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-lp-bg pb-16 pt-8 md:pb-24 md:pt-16"
    >
      {/* ─── Full-bleed wrapper ─── */}
      <div className="mx-auto max-w-[90rem] px-4 md:px-8">
        {/* Section label */}
        <div className="mb-12 flex items-center gap-3 px-4 text-[11px] font-medium uppercase tracking-[0.2em] text-lp-text/40 md:px-8">
          <span className="h-px w-6 bg-lp-text/20" />
          Product
        </div>

        {/* ─── Mockup container ─── */}
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={
            shouldReduceMotion
              ? { opacity: 1 }
              : {
                  rotateX,
                  rotateY,
                  y: translateY,
                  opacity,
                  perspective: 1200,
                }
          }
          animate={
            shouldReduceMotion
              ? {}
              : {
                  rotateX: mouseTilt.x,
                  rotateY: mouseTilt.y,
                }
          }
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="relative w-full origin-center"
        >
          <div className="overflow-hidden rounded-sm border border-lp-border bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.18)] lg:rounded-sm">
            {/* ─── Minimal chrome ─── */}
            <div className="flex h-10 items-center border-b border-lp-border bg-lp-surface px-4 lg:px-5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium tracking-wide text-lp-text/40">
                  ClientSpace
                </span>
              </div>
              <div className="mx-auto flex h-5 items-center rounded-sm bg-lp-bg px-4">
                <span className="text-[9px] text-lp-text-secondary/50">
                  app.clientspace.io
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-lp-text/10" />
              </div>
            </div>

            {/* ─── Dashboard content ─── */}
            <div className="bg-white p-5 md:p-8">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-lp-text">
                    Good morning, Studio
                  </h3>
                  <p className="mt-0.5 text-xs text-lp-text-secondary">
                    Here&apos;s your week at a glance
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lp-accent/10 text-sm font-medium text-lp-accent">
                  RK
                </div>
              </div>

              {/* ─── Metrics grid ─── */}
              <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {METRICS.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-sm border border-lp-border/60 bg-lp-bg/30 p-3 transition-colors hover:border-lp-border"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-lp-text-secondary/70">
                      {m.label}
                    </div>
                    <div className="mt-1 text-xl font-bold text-lp-text">
                      {m.value}
                    </div>
                    <div className="mt-0.5 text-[10px] text-lp-text-secondary/60">
                      {m.trend}
                    </div>
                  </div>
                ))}
              </div>

              {/* ─── Project table ─── */}
              <div>
                <div className="mb-2 flex border-b border-lp-border pb-2 text-[10px] uppercase tracking-wider text-lp-text-secondary/60">
                  <span className="w-[30%]">Project</span>
                  <span className="w-[25%]">Client</span>
                  <span className="w-[25%]">Status</span>
                  <span className="w-[20%] text-right">Due</span>
                </div>
                {PROJECTS.map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center border-b border-lp-border/50 py-2.5 text-xs"
                  >
                    <span className="w-[30%] font-medium text-lp-text">
                      {row.name}
                    </span>
                    <span className="w-[25%] text-lp-text-secondary">
                      {row.client}
                    </span>
                    <span className="w-[25%]">
                      <span
                        className={`inline-block rounded-sm px-2 py-0.5 text-[10px] font-medium ${statusStyle(row.status)}`}
                      >
                        {row.status}
                      </span>
                    </span>
                    <span className="w-[20%] text-right text-lp-text-secondary">
                      {row.due}
                    </span>
                  </div>
                ))}
              </div>

              {/* ─── Quick action bar ─── */}
              <div className="mt-5 flex gap-2 border-t border-lp-border/50 pt-4">
                <span className="inline-flex items-center gap-1.5 rounded-sm border border-lp-border/60 px-3 py-1.5 text-[11px] font-medium text-lp-text-secondary transition-colors hover:border-lp-text/30 hover:text-lp-text">
                  New project
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-sm border border-lp-border/60 px-3 py-1.5 text-[11px] font-medium text-lp-text-secondary transition-colors hover:border-lp-text/30 hover:text-lp-text">
                  View reports
                </span>
              </div>
            </div>
          </div>

          {/* ─── Floating annotation labels ─── */}
          {!shouldReduceMotion &&
            ANNOTATIONS.map((a, i) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.5,
                  delay: 0.6 + i * 0.18,
                  ease: easeOut,
                }}
                className="pointer-events-none absolute hidden items-center gap-3 lg:flex"
                style={{ top: a.top, left: a.left }}
              >
                <span className="whitespace-nowrap text-[11px] font-medium tracking-wide text-lp-text-secondary">
                  {a.label}
                </span>
                <div className="h-px w-5 bg-lp-accent/40" />
              </motion.div>
            ))}
        </motion.div>
      </div>
    </section>
  );
}
