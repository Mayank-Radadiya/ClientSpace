"use client";

import React, { useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Mail, FileText, MessagesSquare } from "lucide-react";

const AnimatedBeam = dynamic(() => import("@/components/ui/animated-beam").then(mod => mod.AnimatedBeam), { ssr: false });

export function ProblemSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fromRef1 = useRef<HTMLDivElement>(null);
  const fromRef2 = useRef<HTMLDivElement>(null);
  const fromRef3 = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  return (
    <section className="w-full py-24 md:py-32 bg-muted/30 text-foreground relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 md:px-12 relative z-10">
        <div className="max-w-2xl mx-auto text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
          >
            The old way is broken
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Sending invoices via email, sharing deliverables in Slack, and requesting feedback in Google Docs. It's a mess.
          </motion.p>
        </div>

        <div 
          className="relative flex h-[400px] w-full max-w-4xl mx-auto items-center justify-center overflow-hidden rounded-2xl border border-border bg-card p-10 md:shadow-xl"
          ref={containerRef}
        >
          <div className="flex h-full w-full flex-col items-stretch justify-between gap-10">
            <div className="flex flex-row items-center justify-between h-full">
              <div className="flex flex-col justify-between h-full">
                <div ref={fromRef1} className="z-10 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background shadow-md">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div ref={fromRef2} className="z-10 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background shadow-md">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div ref={fromRef3} className="z-10 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background shadow-md">
                  <MessagesSquare className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <div ref={toRef} className="z-10 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-primary/20 bg-primary text-primary-foreground shadow-lg">
                <span className="font-bold text-xl">C</span>
              </div>
            </div>
          </div>

          <AnimatedBeam
            containerRef={containerRef}
            fromRef={fromRef1}
            toRef={toRef}
            curvature={-75}
            endYOffset={-10}
            pathColor="gray"
            pathOpacity={0.2}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={fromRef2}
            toRef={toRef}
            pathColor="gray"
            pathOpacity={0.2}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={fromRef3}
            toRef={toRef}
            curvature={75}
            endYOffset={10}
            pathColor="gray"
            pathOpacity={0.2}
          />
        </div>
      </div>
    </section>
  );
}
