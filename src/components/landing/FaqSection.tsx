"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Can I use my own domain?",
    answer: "Yes, on the Pro Agency plan you can map your client portal to a custom domain like clients.youragency.com.",
  },
  {
    question: "How do clients pay invoices?",
    answer: "We integrate directly with Stripe. Your clients can pay via credit card, ACH, or Apple Pay directly from their portal.",
  },
  {
    question: "Do clients need to create an account?",
    answer: "No. Clients access their portal via secure magic links sent to their email. No passwords to remember or lose.",
  },
  {
    question: "Can I invite my whole team?",
    answer: "Yes, both plans allow unlimited team members. You only pay based on the number of active clients you're managing.",
  },
  {
    question: "What happens if I go over my client limit?",
    answer: "We'll gently notify you to upgrade to the Pro plan. Your clients will never be locked out or experience interruptions.",
  }
];

export function FaqSection() {
  return (
    <section className="w-full py-24 md:py-32 bg-background relative border-t border-border/40">
      <div className="mx-auto max-w-3xl px-6 md:px-12">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-6"
          >
            Frequently asked questions
          </motion.h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-lg font-medium hover:text-primary transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
