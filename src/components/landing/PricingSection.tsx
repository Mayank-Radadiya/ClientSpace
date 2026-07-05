"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import Link from "next/link";

const TIERS = [
  {
    name: "Studio",
    slug: "studio",
    price: { monthly: 29, annual: 24 },
    description: "For independent freelancers getting started.",
    cta: "Start free trial",
    href: "/signup",
    popular: false,
    features: [
      "Up to 5 active projects",
      "Branded client portal",
      "File upload & proofing",
      "Invoice generation",
      "Stripe & ACH payments",
      "Email support",
      "50GB file storage",
    ],
  },
  {
    name: "Pro",
    slug: "pro",
    price: { monthly: 79, annual: 65 },
    description: "For growing studios with multiple clients.",
    cta: "Start free trial",
    href: "/signup",
    popular: true,
    features: [
      "Unlimited active projects",
      "Custom domain & white-label",
      "Smart approvals & sign-offs",
      "Automated payment reminders",
      "Team collaboration (unlimited)",
      "Priority support channel",
      "500GB file storage",
      "API access & webhooks",
    ],
  },
  {
    name: "Agency",
    slug: "agency",
    price: { monthly: 199, annual: 165 },
    description: "For agencies at scale with custom needs.",
    cta: "Talk to us",
    href: "/contact",
    popular: false,
    features: [
      "Everything in Pro",
      "SSO & SCIM provisioning",
      "Custom contract templates",
      "Dedicated account manager",
      "99.99% SLA guarantee",
      "Unlimited storage",
      "Custom integrations",
      "Onboarding concierge",
    ],
  },
];

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section
      className="relative w-full border-t border-lp-border bg-lp-bg py-24 md:py-32"
      id="pricing"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mb-16 flex items-start justify-between border-b border-lp-border pb-6"
        >
          <div>
            <div className="mb-3 font-mono text-[11px] font-medium tracking-[0.15em] text-[#6C63FF]">
              § LEDGER / 04
            </div>
            <h2 className="font-display text-lp-text text-3xl font-bold tracking-tight md:text-5xl">
              Simple pricing.{" "}
              <span className="text-lp-text-secondary">No surprises.</span>
            </h2>
          </div>
          <div className="hidden flex-col items-end gap-3 md:flex">
            {/* Billing toggle */}
            <div className="flex items-center gap-3">
              <span className={`font-mono text-xs transition-colors ${!isAnnual ? "text-lp-text" : "text-lp-text-secondary"}`}>
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className="relative flex h-6 w-10 items-center rounded-full border border-lp-border bg-lp-surface px-0.5 transition-colors"
              >
                <motion.div
                  animate={{ x: isAnnual ? 16 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="h-4 w-4 rounded-full bg-[#6C63FF] shadow-sm"
                />
              </button>
              <span className={`font-mono text-xs transition-colors ${isAnnual ? "text-lp-text" : "text-lp-text-secondary"}`}>
                Annually
              </span>
              <AnimatePresence>
                {isAnnual && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="rounded-[2px] bg-[#6C63FF]/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#6C63FF]"
                  >
                    Save 20%
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Mobile toggle */}
        <div className="mb-8 flex items-center justify-center gap-3 md:hidden">
          <span className={`font-mono text-xs transition-colors ${!isAnnual ? "text-lp-text" : "text-lp-text-secondary"}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative flex h-6 w-10 items-center rounded-full border border-lp-border bg-lp-surface px-0.5"
          >
            <motion.div
              animate={{ x: isAnnual ? 16 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="h-4 w-4 rounded-full bg-[#6C63FF] shadow-sm"
            />
          </button>
          <span className={`font-mono text-xs transition-colors ${isAnnual ? "text-lp-text" : "text-lp-text-secondary"}`}>
            Annually
          </span>
          {isAnnual && (
            <span className="rounded-[2px] bg-[#6C63FF]/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#6C63FF]">
              Save 20%
            </span>
          )}
        </div>

        {/* Cards — gap-px editorial grid */}
        <div className="bg-lp-border grid grid-cols-1 gap-px md:grid-cols-3">
          {TIERS.map((tier, idx) => (
            <motion.div
              key={tier.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.4,
                delay: 0.08 + idx * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`relative flex flex-col p-8 transition-colors md:p-10 ${
                tier.popular
                  ? "bg-lp-text text-lp-bg"
                  : "bg-lp-bg hover:bg-lp-surface"
              }`}
            >
              {/* Popular badge */}
              {tier.popular && (
                <div className="mb-4 self-start rounded-[2px] bg-[#6C63FF] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                  Teams&apos; pick
                </div>
              )}

              {/* Tier name + description */}
              <div className="mb-6">
                <div className="font-mono text-[11px] font-medium tracking-[0.15em] text-[#6C63FF]">
                  {String(idx + 1).padStart(2, "0")} / {tier.slug.toUpperCase()}
                </div>
                <h3 className={`font-display mt-1 text-2xl font-bold ${tier.popular ? "text-lp-bg" : "text-lp-text"}`}>
                  {tier.name}
                </h3>
                <p className={`font-body mt-1 text-sm ${tier.popular ? "text-lp-bg/50" : "text-lp-text-secondary"}`}>
                  {tier.description}
                </p>
              </div>

              {/* Price */}
              <div className={`mb-8 flex items-baseline gap-1 border-b pb-6 ${tier.popular ? "border-lp-bg/15" : "border-lp-border"}`}>
                <span className={`font-display text-5xl font-bold tracking-tight ${tier.popular ? "text-lp-bg" : "text-lp-text"}`}>
                  ${isAnnual ? tier.price.annual : tier.price.monthly}
                </span>
                <span className={`font-body text-sm ${tier.popular ? "text-lp-bg/40" : "text-lp-text-secondary"}`}>
                  /month
                </span>
              </div>

              {/* Features */}
              <div className="mb-8 flex flex-col gap-3">
                {tier.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${tier.popular ? "text-[#6C63FF]" : "text-[#6C63FF]"}`} />
                    <span className={`font-body text-sm ${tier.popular ? "text-lp-bg/70" : "text-lp-text"}`}>
                      {feat}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-auto">
                <Link
                  href={tier.href}
                  className={`flex w-full items-center justify-center rounded-[3px] py-3 text-sm font-semibold transition-all active:scale-[0.98] ${
                    tier.popular
                      ? "bg-[#6C63FF] text-white hover:bg-[#5B54EE]"
                      : "border border-lp-border bg-transparent text-lp-text hover:border-lp-text/20 hover:bg-lp-surface"
                  }`}
                >
                  {tier.cta}
                </Link>
                <p className={`font-body mt-3 text-center text-xs ${tier.popular ? "text-lp-bg/30" : "text-lp-text-secondary"}`}>
                  {isAnnual ? "Billed annually" : "Billed monthly"} · Free trial · No card needed
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
