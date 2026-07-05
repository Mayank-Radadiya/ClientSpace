"use client";

import { motion } from "motion/react";

const ROWS = [
  {
    letter: "A",
    code: "PRJ-01",
    title: "Project Dashboards",
    desc: "Every client gets a dedicated, branded dashboard. No more digging through email threads for status updates.",
  },
  {
    letter: "B",
    code: "INV-01",
    title: "Milestone Payments",
    desc: "Link payments to deliverables. Invoices auto-send when you mark a milestone complete.",
  },
  {
    letter: "C",
    code: "APR-01",
    title: "One-Click Approvals",
    desc: "Clients approve designs, copy, and files with a single click. No accounts required.",
  },
  {
    letter: "D",
    code: "FIL-01",
    title: "Asset Delivery",
    desc: "Share files at full resolution. Smart expiry and download tracking built in.",
  },
  {
    letter: "E",
    code: "MSG-01",
    title: "Contextual Messaging",
    desc: "Comments pinned to specific files and versions. Everything stays organised by project.",
  },
];

export function GlanceSpec() {
  return (
    <section id="product" className="section-wrapper">
      <div className="mb-12 flex items-start justify-between">
        <h2 className="font-display max-w-md text-[clamp(36px,5vw,56px)] leading-[1.05] tracking-[-0.01em] text-[#fafafa] italic">
          ClientSpace, at a glance.
        </h2>
        <div className="hidden w-64 border border-[#222] p-4 md:block">
          <div className="space-y-1 font-mono text-[9px] tracking-[0.15em] text-[#555] uppercase">
            <div>MRD-2026.01</div>
            <div>ISSUED 2026.01</div>
            <div>SCALE 1:1</div>
            <div>SHEET 1/3</div>
          </div>
          <div className="mt-4 font-mono text-[48px] leading-none text-[#222]">
            ┃
          </div>
        </div>
      </div>

      <div className="grid gap-12 md:grid-cols-[380px_1fr]">
        <div className="hidden aspect-[380/320] w-full border border-[#222] bg-[#111] md:block" />

        <div>
          {ROWS.map((row, i) => (
            <motion.div
              key={row.letter}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group -mx-3 flex cursor-default items-start gap-4 border-b border-[#1a1a1a] px-3 py-4 transition-all duration-200 hover:border-l-2 hover:border-l-[#fafafa] hover:bg-[#111] hover:pl-[10px]"
            >
              <span className="w-6 shrink-0 pt-0.5 font-mono text-[11px] text-[#555]">
                {row.letter}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-baseline gap-3">
                  <span className="font-mono text-[10px] tracking-[0.1em] text-[#555] uppercase">
                    {row.code}
                  </span>
                  <h3 className="font-sans text-[18px] font-medium text-[#fafafa]">
                    {row.title}
                  </h3>
                </div>
                <p className="font-sans text-[14px] leading-[1.6] text-[#a0a0a0]">
                  {row.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
