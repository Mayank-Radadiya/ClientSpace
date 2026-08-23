"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { motion } from "motion/react";
import { SectionMeta } from "./SectionMeta";

const FAQS = [
  {
    q: "Do my clients need to create an account?",
    a: "No. They get a branded link and land straight on their dashboard — no signup, no password, no friction.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes, on Studio and Agency plans — portal.youragency.com instead of a ClientSpace subdomain. We handle the SSL certificate automatically.",
  },
  {
    q: "What happens to projects if I downgrade?",
    a: "Your projects stay safe and accessible. If you downgrade from Studio to Starter, active projects beyond the Starter limit become read-only. You can re-activate them by upgrading again. No data is ever deleted.",
  },
  {
    q: "Is there an API?",
    a: "Yes — Agency tier includes full API access and webhooks. You can programmatically create projects, manage users, trigger invoices, and sync with your existing stack.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, no contracts or commitments. Your dashboards stay live through the end of the current billing period. After that, we export a full archive of everything.",
  },
];

export function FaqSection() {
  return (
    <section
      id="faq"
      className="cs-section"
    >
      <div className="cs-container max-w-3xl">
        <SectionMeta
          code="FAQ · KNOWLEDGE BASE"
          sheet="1"
          total="1"
          location="UPDATED · 2026.04"
        />

        <h2 className="font-display mt-12 mb-8 text-[clamp(28px,4vw,40px)] leading-[1.05] tracking-[-0.01em] text-cs-ink italic">
          Questions, <span className="text-cs-faint">answered.</span>
        </h2>

        <Accordion.Root
          type="single"
          collapsible
          className="flex flex-col gap-2"
        >
          {FAQS.map((faq, i) => (
            <motion.div
              key={faq.q}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Accordion.Item
                value={`item-${i}`}
                className="overflow-hidden rounded-lg border border-cs-line"
              >
                <Accordion.Header>
                  <Accordion.Trigger className="group flex w-full items-center justify-between px-5 py-4 text-left transition-colors duration-200 hover:bg-cs-bg-raised">
                    <span className="font-data text-[13px] text-cs-ink transition-colors group-hover:text-cs-ink">
                      {faq.q}
                    </span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      className="shrink-0 text-cs-faint transition-transform duration-200 group-data-[state=open]:rotate-45"
                    >
                      <path
                        d="M7 1v12M1 7h12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
                  <div className="border-t border-cs-line px-5 py-4">
                    <p className="font-data text-[12px] leading-[1.7] text-cs-ink-muted">
                      {faq.a}
                    </p>
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            </motion.div>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
