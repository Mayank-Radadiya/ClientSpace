"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { SectionMeta } from "./SectionMeta";

const plans = [
  {
    name: "STARTER",
    ref: "MRD-LK-2026-01",
    tagline: "For the solo studio just getting started.",
    price: "29",
    features: [
      "Up to 5 active projects",
      "1 client dashboard",
      "File delivery & tracking",
      "Basic invoicing",
    ],
    cta: "Start free trial",
    href: "/signup",
  },
  {
    name: "STUDIO",
    ref: "MRD-LK-2026-02",
    tagline: "For the team that just stood up on-call.",
    price: "79",
    features: [
      "Unlimited projects",
      "White-label dashboards",
      "One-click approvals",
      "Milestone auto-invoicing",
      "Priority support",
    ],
    cta: "Start free trial",
    href: "/signup",
    recommended: true,
  },
  {
    name: "AGENCY",
    ref: "MRD-LK-2026-03",
    tagline: "For the firm running client ops at scale.",
    price: "199",
    features: [
      "Everything in Studio",
      "Custom subdomain",
      "API access & webhooks",
      "SSO & team roles",
      "SLA guarantee",
    ],
    cta: "Talk to us",
    href: "/contact",
  },
];

function Barcode() {
  return (
    <div className="mt-4 mb-6 flex gap-[2px]">
      {Array.from({ length: 24 }, (_, i) => (
        <span
          key={i}
          className="bg-[#555]"
          style={{ width: 2 + (i % 4), height: 20 }}
        />
      ))}
    </div>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="section-wrapper">
      <SectionMeta
        code="LEDGER · THREE TICKETS"
        sheet="1"
        total="1"
        location="2026.04"
      />

      <div className="mt-16 mb-16 text-center">
        <h2 className="font-display text-[clamp(36px,5vw,56px)] leading-[1.05] tracking-[-0.01em] text-[#fafafa] italic">
          Pick a plan.
        </h2>
        <p className="mt-2 font-sans text-[16px] text-[#555]">
          Simple pricing, no per-seat fees.
        </p>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-3">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className={`relative border p-6 transition-all duration-200 ${
              plan.recommended
                ? "scale-[1.02] border-[#555]"
                : "border-[#222] hover:-translate-y-[3px] hover:border-[#555]"
            }`}
          >
            {plan.recommended && (
              <div className="absolute -top-2.5 right-4 rotate-[15deg] border border-[#555] bg-transparent px-2 py-0.5">
                <span className="font-mono text-[8px] tracking-[0.1em] text-[#a0a0a0] uppercase">
                  TEAMS&apos; PICK
                </span>
              </div>
            )}

            <div className="mb-4 flex items-baseline justify-between">
              <span className="font-mono text-[11px] tracking-[0.1em] text-[#fafafa] uppercase">
                ClientSpace · {plan.name}
              </span>
              <span className="font-mono text-[8px] text-[#555]">
                # {plan.ref}
              </span>
            </div>

            <div className="mb-4 border-b border-dotted border-[#333]" />
            <p className="mb-6 font-sans text-[16px] text-[#a0a0a0]">
              {plan.tagline}
            </p>

            <div className="mb-6 space-y-2">
              {plan.features.map((f) => (
                <div key={f} className="leader-row">
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div className="mb-4 border-b border-dotted border-[#333]" />

            <div className="mb-4 space-y-1 font-mono text-[10px] text-[#555]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${plan.price},000.00</span>
              </div>
              <div className="flex justify-between">
                <span>Per-seat tax</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between">
                <span>Overage fees</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between">
                <span>Hidden charges</span>
                <span>$0.00</span>
              </div>
            </div>

            <div className="mb-4 border-b border-dotted border-[#333]" />
            <div className="mb-4 flex items-baseline justify-between">
              <span className="font-mono text-[10px] text-[#555]">
                TOTAL DUE
              </span>
              <span className="font-mono text-[clamp(24px,3vw,36px)] font-medium text-[#fafafa]">
                ${plan.price}
                <span className="text-[12px] text-[#555]">/yr</span>
              </span>
            </div>
            <div className="mb-4 border-b border-dotted border-[#333]" />

            <div className="mb-4 flex justify-between font-mono text-[8px] text-[#555]">
              <span>AUTH · 0{plan.ref.replace(/[^0-9]/g, "")}</span>
              <span>HOLDER · YOUR TEAM</span>
            </div>

            <Barcode />

            <Link
              href={plan.href}
              className={`block py-3 text-center text-[11px] font-medium tracking-tight transition-all duration-200 ${
                plan.recommended
                  ? "bg-[#fafafa] text-[#0a0a0a] hover:border hover:border-[#fafafa] hover:bg-[#0a0a0a] hover:text-[#fafafa]"
                  : "border border-[#333] text-[#a0a0a0] hover:border-[#555] hover:text-[#fafafa]"
              }`}
            >
              {plan.cta}
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
