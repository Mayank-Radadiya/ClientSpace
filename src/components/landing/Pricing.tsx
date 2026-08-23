"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { SectionMeta } from "./SectionMeta";

const plans = [
  {
    name: "STARTER",
    ref: "MRD-LK-2026-01",
    tagline: "For the solo studio just getting started.",
    monthly: { price: "29", unit: "/mo" },
    annual: { price: "290", unit: "/yr · save ~17%" },
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
    tagline: "For the team scaling client operations.",
    monthly: { price: "79", unit: "/mo" },
    annual: { price: "790", unit: "/yr · save ~17%" },
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
    monthly: { price: "199", unit: "/mo" },
    annual: { price: "1,990", unit: "/yr · save ~17%" },
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

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="section-wrapper">
      <SectionMeta
        code="LEDGER · THREE TICKETS"
        sheet="1"
        total="1"
        location="2026.04"
      />

      <div className="mt-16 mb-10 text-center">
        <h2 className="font-display text-[clamp(36px,5vw,56px)] leading-[1.05] tracking-[-0.01em] text-cs-ink italic">
          Pick a plan.
        </h2>
        <p className="mt-2 font-sans text-[16px] text-cs-faint">
          Simple pricing, no per-seat fees.
        </p>
      </div>

      {/* Monthly/Annual toggle */}
      <div className="mb-12 flex items-center justify-center gap-4">
        <span
          className={`font-data text-[11px] tracking-wider transition-colors ${
            !annual ? "text-cs-ink" : "text-cs-faint"
          }`}
        >
          Monthly
        </span>
        <button
          onClick={() => setAnnual(!annual)}
          className="relative h-6 w-11 rounded-full border border-cs-line-strong transition-colors hover:border-cs-faint"
          role="switch"
          aria-checked={annual}
          aria-label="Toggle annual billing"
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`absolute top-0.5 left-0.5 h-[18px] w-[18px] rounded-full ${
              annual ? "bg-cs-accent" : "bg-cs-line-strong"
            }`}
            style={{ translateX: annual ? "18px" : "0px" }}
          />
        </button>
        <span
          className={`font-data text-[11px] tracking-wider transition-colors ${
            annual ? "text-cs-ink" : "text-cs-faint"
          }`}
        >
          Annual <span className="text-[9px] text-cs-accent">save ~17%</span>
        </span>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-3">
        {plans.map((plan, i) => {
          const pricing = annual ? plan.annual : plan.monthly;

          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`relative border p-6 transition-all duration-200 ${
                plan.recommended
                  ? "scale-[1.02] border-cs-accent"
                  : "border-cs-line-strong hover:-translate-y-[3px] hover:border-cs-faint"
              }`}
            >
              {/* "MOST POPULAR" badge — fixed from "TEAMS' PICK" */}
              {plan.recommended && (
                <div className="absolute -top-2.5 right-4 border border-cs-accent bg-transparent px-2 py-0.5">
                  <span className="font-data text-[8px] tracking-[0.1em] text-cs-accent uppercase">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-4 flex items-baseline justify-between">
                <span className="font-data text-[11px] tracking-[0.1em] text-cs-ink uppercase">
                  ClientSpace · {plan.name}
                </span>
                <span className="font-data text-[8px] text-cs-faint">
                  # {plan.ref}
                </span>
              </div>

              <div className="mb-4 border-b border-dotted border-cs-leader" />
              <p className="mb-6 font-sans text-[16px] text-cs-ink-muted">
                {plan.tagline}
              </p>

              <div className="mb-6 space-y-2">
                {plan.features.map((f) => (
                  <div key={f} className="leader-row">
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <div className="mb-4 border-b border-dotted border-cs-leader" />

              {/* Price — now shows correct unit label */}
              <div className="mb-4 flex items-baseline justify-between">
                <span className="font-data text-[10px] text-cs-faint">
                  TOTAL DUE
                </span>
                <span className="font-data text-[clamp(24px,3vw,36px)] font-medium text-cs-ink">
                  ${pricing.price}
                  <span className="text-[12px] text-cs-faint">
                    {pricing.unit}
                  </span>
                </span>
              </div>

              <div className="mb-4 border-b border-dotted border-cs-leader" />

              {/* Barcode removed — replaced with billing line */}
              <p className="mb-4 text-center font-data text-[9px] text-cs-faint">
                Billed {annual ? "annually" : "monthly"} · cancel anytime
              </p>

              <Link
                href={plan.href}
                className={`block py-3 text-center text-[11px] font-medium tracking-tight transition-all duration-200 ${
                  plan.recommended
                    ? "bg-cs-cta-bg text-cs-cta-text hover:opacity-90"
                    : "border border-cs-line-strong text-cs-ink-muted hover:border-cs-faint hover:text-cs-accent-ink"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
