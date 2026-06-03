"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, Receipt, Workflow } from "lucide-react";

const MagicCard = dynamic(() => import("@/components/ui/magic-card").then(mod => mod.MagicCard), { ssr: false });

const features = [
  {
    title: "Client Dashboard",
    description: "A centralized hub where your clients can view project progress, outstanding tasks, and recent files without ever asking 'what's the status?'",
    icon: LayoutDashboard
  },
  {
    title: "Collaborative Feedback",
    description: "Leave comments directly on deliverables. Turn vague feedback into actionable tasks instantly.",
    icon: Users
  },
  {
    title: "Seamless Invoicing",
    description: "Create, send, and track invoices in the same place you manage the work. Get paid faster with integrated Stripe payments.",
    icon: Receipt
  },
  {
    title: "Automated Workflows",
    description: "Set up triggers for when a client approves a milestone. We'll automatically generate the next invoice and notify the team.",
    icon: Workflow
  }
];

export function FeatureShowcase() {
  return (
    <section className="w-full py-24 md:py-32 bg-background relative" id="features">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 md:mb-24 gap-6">
          <div className="max-w-2xl">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
            >
              Everything you need.<br/>Nothing you don't.
            </motion.h2>
          </div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-md"
          >
            We stripped away the complexity of traditional project management tools to give you exactly what matters for client work.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * idx }}
              className="h-full"
            >
              <MagicCard className="p-8 md:p-10 h-full flex flex-col items-start gap-6 cursor-pointer bg-muted/30">
                <div className="p-4 rounded-2xl bg-background border border-border/50 shadow-sm">
                  <feature.icon className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </MagicCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
