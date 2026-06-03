"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowDown } from "lucide-react";

const BorderBeam = dynamic(() => import("@/components/ui/border-beam").then(mod => mod.BorderBeam), { ssr: false });

const steps = [
  {
    title: "Client Approves Proposal",
    description: "Client reviews and signs the proposal directly in the portal.",
  },
  {
    title: "Invoice Automatically Generated",
    description: "A 50% deposit invoice is created and sent to the client.",
  },
  {
    title: "Project Kicks Off",
    description: "Tasks are created and team is notified in Slack.",
  }
];

export function WorkflowSection() {
  return (
    <section className="w-full py-24 md:py-32 bg-background relative overflow-hidden" id="workflow">
      <div className="mx-auto max-w-7xl px-6 md:px-12 flex flex-col md:flex-row items-center gap-16">
        <div className="w-full md:w-1/2">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-6"
          >
            Automate the busywork
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground mb-8"
          >
            Stop copying and pasting between tools. ClientSpace connects your proposals, invoices, and project management in one seamless flow.
          </motion.p>
        </div>

        <div className="w-full md:w-1/2 relative">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative flex w-full flex-col items-start justify-center overflow-hidden rounded-2xl border border-border/50 bg-background p-8 shadow-2xl"
          >
            <div className="space-y-8 w-full relative z-10">
              {steps.map((step, idx) => (
                <div key={idx} className="relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">{step.title}</h4>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="absolute left-4 top-10 flex h-8 w-8 items-center justify-center text-muted-foreground/30">
                      <ArrowDown className="h-5 w-5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <BorderBeam size={250} duration={12} delay={9} colorFrom="hsl(var(--primary))" colorTo="hsl(var(--primary)/0.2)" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
