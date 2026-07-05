"use client";

import React from "react";
import { motion } from "motion/react";

const zones = [
  {
    id: "A",
    title: "Client Portal",
    description:
      "Every client gets a beautiful, branded portal with their own URL. Secure magic links — no password required.",
    metric: "4.9★",
    label: "avg. client satisfaction",
  },
  {
    id: "B",
    title: "Project Hub",
    description:
      "Timelines, milestones, and deliverables in one place. Clients see progress. Your team sees the full picture.",
    metric: "98%",
    label: "projects delivered on time",
  },
  {
    id: "C",
    title: "File Proofing",
    description:
      "Upload designs, collect frame-by-frame feedback, and get official sign-offs. No more hunting through email threads.",
    metric: "3.2×",
    label: "faster approval cycles",
  },
  {
    id: "D",
    title: "Smart Invoicing",
    description:
      "Invoices auto-generate from project milestones. Clients pay via card or ACH — right inside their portal.",
    metric: "47%",
    label: "faster payment collection",
  },
  {
    id: "E",
    title: "Automated Reminders",
    description:
      "Stop chasing. We gently nudge clients about pending approvals and unpaid invoices. Escalation flows when needed.",
    metric: "12h",
    label: "avg. response time saved/week",
  },
  {
    id: "F",
    title: "White-Label",
    description:
      "Custom domain, your brand colors, your logo. From the portal to the invoices — everything looks like your studio.",
    metric: "30%",
    label: "avg. rate increase reported",
  },
];

export function FeatureShowcase() {
  return (
    <section
      className="relative w-full border-t border-lp-border bg-lp-bg py-24 md:py-32"
      id="features"
    >
      {/* Section header */}
      <div className="mx-auto mb-16 max-w-7xl px-6 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-start justify-between border-b border-lp-border pb-6"
        >
          <div>
            <div className="mb-3 font-mono text-[11px] font-medium tracking-[0.15em] text-[#6C63FF]">
              § SPEC / 01
            </div>
            <h2 className="font-display text-lp-text text-3xl font-bold tracking-tight md:text-5xl">
              ClientSpace, at a glance.
            </h2>
          </div>
          <div className="text-lp-text-secondary hidden text-right font-mono text-[11px] leading-relaxed md:block">
            <div>Issued 2026.07</div>
            <div>Scale 1 : 1</div>
          </div>
        </motion.div>
      </div>

      {/* Feature grid — spec sheet style with gap-px border trick */}
      <div className="mx-auto max-w-7xl px-6 lg:px-16">
        <div className="bg-lp-border grid grid-cols-1 gap-px md:grid-cols-2 lg:grid-cols-3">
          {zones.map((zone, idx) => (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: idx * 0.07,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group relative bg-lp-bg p-8 transition-colors hover:bg-lp-surface md:p-10"
            >
              {/* Zone label */}
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-[13px] font-bold text-[#6C63FF]">
                  Zone {zone.id}
                </span>
                <div className="border-lp-border/50 mx-4 h-px flex-1 border-t border-dashed" />
                <span className="text-lp-text-secondary font-mono text-[10px]">
                  0{idx + 1}
                </span>
              </div>

              <h3 className="font-display text-lp-text mb-3 text-xl font-bold">
                {zone.title}
              </h3>
              <p className="text-lp-text-secondary font-body mb-8 text-sm leading-relaxed">
                {zone.description}
              </p>

              {/* Metric */}
              <div className="border-lp-border border-t pt-6">
                <div className="font-display text-lp-text text-3xl font-bold">
                  {zone.metric}
                </div>
                <div className="text-lp-text-secondary mt-0.5 font-mono text-[11px] uppercase tracking-wider">
                  {zone.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="border-lp-border text-lp-text-secondary border-t py-6 text-center font-mono text-[11px]"
        >
          <span className="text-[#6C63FF]">✦</span> Metrics measured across
          2,400+ customer teams as of Q2 2026
        </motion.div>
      </div>
    </section>
  );
}
