"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const Particles = dynamic(() => import("@/components/ui/particles").then(mod => mod.Particles), { ssr: false });
const ShimmerButton = dynamic(() => import("@/components/ui/shimmer-button").then(mod => mod.ShimmerButton), { ssr: false });

export function CtaSection() {
  const { theme } = useTheme();
  const [color, setColor] = useState("#ffffff");

  useEffect(() => {
    setColor(theme === "dark" ? "#ffffff" : "#000000");
  }, [theme]);

  return (
    <section className="relative w-full py-32 md:py-48 overflow-hidden bg-background border-t border-border/40">
      <div className="absolute inset-0 z-0">
        <Particles
          className="absolute inset-0"
          quantity={100}
          ease={80}
          color={color}
          refresh
        />
      </div>
      
      <div className="relative z-10 mx-auto max-w-4xl px-6 md:px-12 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-8"
        >
          Ready to level up your client experience?
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto"
        >
          Join thousands of agencies delivering world-class service with ClientSpace.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4"
        >
          <ShimmerButton className="shadow-2xl" background="hsl(var(--primary))">
            <span className="whitespace-pre-wrap text-center text-lg font-medium leading-none tracking-tight text-primary-foreground flex items-center gap-2 px-4 py-2">
              Start your free trial <ArrowRight className="w-5 h-5" />
            </span>
          </ShimmerButton>
        </motion.div>
      </div>
    </section>
  );
}
