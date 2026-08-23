"use client";

import { motion } from "motion/react";
import { SectionMeta } from "./SectionMeta";

const rows = [
  {
    num: "01",
    category: "Project Limits",
    ours: "Unlimited projects, unlimited clients",
    theirs: "Per-project pricing",
  },
  {
    num: "02",
    category: "Client Onboarding",
    ours: "No account required. One link.",
    theirs: "Signup + password setup",
  },
  {
    num: "03",
    category: "File Delivery",
    ours: "Full resolution, branded, tracked",
    theirs: "WeTransfer links (expire)",
  },
  {
    num: "04",
    category: "Approvals",
    ours: "One-click, version history",
    theirs: "Email chains",
  },
  {
    num: "05",
    category: "Invoicing",
    ours: "Auto-send on milestone complete",
    theirs: "Manual PDF generation",
  },
  {
    num: "06",
    category: "Pricing Model",
    ours: "Flat monthly, no per-seat fees",
    theirs: "Per-user billing",
  },
  {
    num: "07",
    category: "Client Portal",
    ours: "Branded, white-label dashboard",
    theirs: "Generic shared folder",
  },
];

export function Comparison() {
  return (
    <section className="section-wrapper">
      <SectionMeta
        code="7 CATEGORIES · HEAD-TO-HEAD"
        sheet="1"
        total="1"
        location="PRICING, SCHEMA, INGEST, RETENTION · AND MORE · UPDATED · 2026.04"
      />

      <div className="mt-16 mb-12 grid grid-cols-3 items-end gap-8">
        <h3 className="font-display col-span-2 text-[clamp(36px,6vw,80px)] leading-[0.95] tracking-[-0.02em] text-cs-ink italic">
          ClientSpace.
        </h3>
        <h3 className="font-display col-span-1 text-right text-[clamp(36px,6vw,80px)] leading-[0.95] tracking-[-0.02em] text-cs-faint italic line-through">
          Legacy.
        </h3>
      </div>

      <div>
        {rows.map((row, i) => (
          <motion.div
            key={row.num}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="-mx-3 grid cursor-default grid-cols-[60px_1fr_1fr] gap-6 border-b border-cs-hairline px-3 py-4 transition-all duration-200 hover:border-l-2 hover:border-l-cs-ink hover:bg-cs-bg-raised hover:pl-[10px]"
          >
            <span className="pt-0.5 font-data text-[11px] text-cs-faint">
              {row.num}
            </span>
            <span className="pt-0.5 font-data text-[10px] tracking-[0.1em] text-cs-faint uppercase">
              {row.category}
            </span>
            <div>
              <span className="font-sans text-[14px] text-cs-ink">
                {row.ours}
              </span>
              <br />
              <span className="font-sans text-[13px] text-cs-faint">
                {row.theirs}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
