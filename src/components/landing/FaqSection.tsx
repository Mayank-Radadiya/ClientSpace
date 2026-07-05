"use client";

import React from "react";
import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Can I use my own domain?",
    answer:
      "Yes, on the Pro and Agency plans you can map your client portal to a custom domain like clients.youragency.com. DNS setup takes about 2 minutes.",
  },
  {
    question: "How do clients pay invoices?",
    answer:
      "We integrate directly with Stripe. Your clients can pay via credit card, ACH, or Apple Pay — directly from their portal, in one click.",
  },
  {
    question: "Do clients need to create an account?",
    answer:
      "No. Clients access their portal via secure magic links sent to their email. No passwords to remember or lose — ever.",
  },
  {
    question: "Can I invite my whole team?",
    answer:
      "Yes, all plans include unlimited team members. You pay based on active projects, not seat count.",
  },
  {
    question: "What happens if I go over my project limit?",
    answer:
      "We'll gently notify you to upgrade. Your clients will never be locked out or experience any interruptions during transitions.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes — every plan includes a 14-day free trial, no credit card required. You can invite clients and test the full experience before committing.",
  },
];

export function FaqSection() {
  return (
    <section className="relative w-full border-t border-lp-border bg-lp-bg py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-16">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mb-16 flex items-start justify-between border-b border-lp-border pb-6"
        >
          <div>
            <div className="mb-3 font-mono text-[11px] font-medium tracking-[0.15em] text-[#6C63FF]">
              § QUERIES / 05
            </div>
            <h2 className="font-display text-lp-text text-3xl font-bold tracking-tight md:text-5xl">
              Frequently asked.
            </h2>
          </div>
          <div className="text-lp-text-secondary hidden text-right font-mono text-[11px] leading-relaxed md:block">
            <div>{faqs.length} questions</div>
            <div>Updated Q2 2026</div>
          </div>
        </motion.div>

        {/* FAQ accordion — editorial left-right two-column on large screens */}
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="lg:pr-16"
          >
            <Accordion type="single" collapsible className="w-full">
              {faqs.slice(0, Math.ceil(faqs.length / 2)).map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-b border-lp-border"
                >
                  <AccordionTrigger className="py-5 text-left text-base font-semibold text-lp-text hover:text-[#6C63FF] hover:no-underline transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-sm leading-relaxed text-lp-text-secondary">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="lg:pl-16 lg:border-l lg:border-lp-border"
          >
            <Accordion type="single" collapsible className="w-full">
              {faqs.slice(Math.ceil(faqs.length / 2)).map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-right-${index}`}
                  className="border-b border-lp-border"
                >
                  <AccordionTrigger className="py-5 text-left text-base font-semibold text-lp-text hover:text-[#6C63FF] hover:no-underline transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-sm leading-relaxed text-lp-text-secondary">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
