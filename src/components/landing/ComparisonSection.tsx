"use client";

import React from "react";
import { motion } from "motion/react";
import { X, Check } from "lucide-react";

const rows = [
  {
    feature: "Client portal",
    us: "Branded, with magic-link login",
    them: "Email attachments & Google Drive",
  },
  {
    feature: "Project tracking",
    us: "Live progress bars & milestones",
    them: "Manual status update emails",
  },
  {
    feature: "File approvals",
    us: "Frame-by-frame with timestamped sign-off",
    them: "Email chains with 'looks good to me'",
  },
  {
    feature: "Invoicing",
    us: "Tied to milestones, auto-generated",
    them: "Separate PDFs, manually created",
  },
  {
    feature: "Payment collection",
    us: "Stripe/ACH inside the portal",
    them: "Bank transfers & Venmo requests",
  },
  {
    feature: "Client onboarding",
    us: "Magic link, no password needed",
    them: "Create account, find the project",
  },
  {
    feature: "Branding",
    us: "White-label with custom domain",
    them: "Third-party logos & ads",
  },
];

export function ComparisonSection() {
  return (
    <section className="border-lp-border bg-lp-bg relative w-full border-t py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mb-16 flex items-start justify-between border-b border-lp-border pb-6"
        >
          <div>
            <div className="mb-3 font-mono text-[11px] font-medium tracking-[0.15em] text-[#6C63FF]">
              § COMPARISON / 02
            </div>
            <h2 className="font-display text-lp-text text-3xl font-bold tracking-tight md:text-5xl">
              ClientSpace <span className="text-lp-text-secondary">vs</span> the old way.
            </h2>
          </div>
          <div className="text-lp-text-secondary hidden text-right font-mono text-[11px] leading-relaxed md:block">
            <div>{rows.length} comparisons</div>
            <div>Side by side</div>
          </div>
        </motion.div>

        <div className="border-lp-border overflow-hidden rounded-2xl border shadow-sm">
          {/* Header */}
          <div className="border-lp-border bg-lp-surface grid grid-cols-3 border-b">
            <div className="text-lp-text-secondary font-body px-6 py-4 text-left text-xs font-bold tracking-wider uppercase">
              Feature
            </div>
            <div className="font-body flex items-center gap-2 px-6 py-4 text-left text-xs font-bold tracking-wider text-[#6C63FF] uppercase">
              <Check className="h-3.5 w-3.5" />
              ClientSpace
            </div>
            <div className="text-lp-text-secondary font-body flex items-center gap-2 px-6 py-4 text-left text-xs font-bold tracking-wider uppercase">
              <X className="h-3.5 w-3.5" />
              Email & Spreadsheets
            </div>
          </div>

          {/* Rows */}
          {rows.map((row, idx) => (
            <motion.div
              key={row.feature}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className={`border-lp-border grid grid-cols-3 border-b last:border-0 ${
                idx % 2 === 0 ? "bg-lp-bg" : "bg-lp-surface/50"
              } hover:bg-lp-surface transition-colors`}
            >
              <div className="text-lp-text font-body px-6 py-4 text-sm font-semibold">
                {row.feature}
              </div>
              <div className="text-lp-text font-body flex items-center gap-2 px-6 py-4 text-sm">
                <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>{row.us}</span>
              </div>
              <div className="text-lp-text-secondary font-body flex items-center gap-2 px-6 py-4 text-sm">
                <X className="h-4 w-4 shrink-0 text-red-400" />
                <span>{row.them}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-lp-text-secondary mt-6 text-center font-mono text-[11px]"
        >
          Data based on surveys of 2,400+ teams who migrated to ClientSpace
          between 2024–2026
        </motion.p>
      </div>
    </section>
  );
}
