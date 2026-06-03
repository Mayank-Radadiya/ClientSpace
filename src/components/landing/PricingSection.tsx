"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const MagicCard = dynamic(() => import("@/components/ui/magic-card").then(mod => mod.MagicCard), { ssr: false });

export function PricingSection() {
  return (
    <section className="w-full py-24 md:py-32 bg-background text-foreground relative overflow-hidden" id="pricing">
      <div className="mx-auto max-w-7xl px-6 md:px-12 relative z-10">
        <div className="text-center mb-16 md:mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
          >
            Simple, transparent pricing
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            No hidden fees. No surprise limits. Just one clear plan that gives you everything you need to run your agency.
          </motion.p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="h-full"
          >
            <MagicCard className="h-full flex flex-col justify-between p-8 md:p-10 bg-card border-border">
              <div>
                <h3 className="text-2xl font-bold text-card-foreground mb-2">Starter</h3>
                <p className="text-muted-foreground mb-6">Perfect for freelancers getting started.</p>
                <div className="mb-8">
                  <span className="text-5xl font-bold tracking-tight text-foreground">$29</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {["Up to 5 active clients", "Basic client portal", "Standard invoicing", "Community support"].map((feature, i) => (
                    <li key={i} className="flex items-center text-muted-foreground">
                      <Check className="h-5 w-5 mr-3 text-muted-foreground/50" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <Button variant="outline" className="w-full">
                Start Free Trial
              </Button>
            </MagicCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="h-full"
          >
            <MagicCard className="h-full flex flex-col justify-between p-8 md:p-10 bg-gradient-to-b from-primary/10 to-background border-primary/30 relative">
              <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                <span className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full flex items-center gap-1 shadow-lg">
                  <Zap className="w-3 h-3" /> Most Popular
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-card-foreground mb-2">Pro Agency</h3>
                <p className="text-primary/80 mb-6">For agencies ready to scale operations.</p>
                <div className="mb-8">
                  <span className="text-5xl font-bold tracking-tight text-foreground">$99</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {["Unlimited active clients", "Custom domain portals", "Advanced automations", "Stripe integration", "Priority 24/7 support"].map((feature, i) => (
                    <li key={i} className="flex items-center text-muted-foreground">
                      <Check className="h-5 w-5 mr-3 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground border-0">
                Get Started
              </Button>
            </MagicCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
