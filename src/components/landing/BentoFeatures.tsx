"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { FileText, Bell, Users, Layout } from "lucide-react";

const BentoGrid = dynamic(() => import("@/components/ui/bento-grid").then(mod => mod.BentoGrid), { ssr: false });
const BentoCard = dynamic(() => import("@/components/ui/bento-grid").then(mod => mod.BentoCard), { ssr: false });

const features = [
  {
    name: "Client Portals",
    description: "Fully customizable client portals that match your brand identity.",
    href: "/",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-2",
    background: <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent transition-all duration-300 group-hover:scale-105" />,
    Icon: Layout,
  },
  {
    name: "Automated Invoices",
    description: "Generate and send invoices based on project milestones.",
    href: "/",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-1",
    background: <div className="absolute inset-0 bg-gradient-to-bl from-rose-500/10 to-transparent transition-all duration-300 group-hover:scale-105" />,
    Icon: FileText,
  },
  {
    name: "Real-time Notifications",
    description: "Keep everyone in the loop with instant Slack and email alerts.",
    href: "/",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-1",
    background: <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent transition-all duration-300 group-hover:scale-105" />,
    Icon: Bell,
  },
  {
    name: "Team Collaboration",
    description: "Internal discussions stay internal. Client feedback stays organized.",
    href: "/",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-2",
    background: <div className="absolute inset-0 bg-gradient-to-tl from-cyan-500/10 to-transparent transition-all duration-300 group-hover:scale-105" />,
    Icon: Users,
  },
];

export function BentoFeatures() {
  return (
    <section className="w-full py-24 md:py-32 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="text-center mb-16 md:mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-6"
          >
            Built for the modern agency
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Everything is designed to save you time and make you look professional to your clients.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <BentoGrid className="lg:grid-rows-2">
            {features.map((feature, idx) => (
              <BentoCard key={idx} {...feature} />
            ))}
          </BentoGrid>
        </motion.div>
      </div>
    </section>
  );
}
