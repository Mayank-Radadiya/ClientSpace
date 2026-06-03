"use client";

import dynamic from "next/dynamic";
import { Mountain, Layers, Hexagon, Triangle, Circle, Square } from "lucide-react";

const Marquee = dynamic(() => import("@/components/ui/marquee").then(mod => mod.Marquee), { ssr: false });

const companies = [
  { name: "Acme Corp", icon: Mountain },
  { name: "Quantum", icon: Hexagon },
  { name: "Nexus", icon: Triangle },
  { name: "Horizon", icon: Circle },
  { name: "Vertex", icon: Layers },
  { name: "Pinnacle", icon: Square },
];

export function LogoCloud() {
  return (
    <section className="w-full py-12 md:py-24 bg-background border-t border-border/40 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 md:px-12 text-center">
        <p className="text-sm font-medium text-muted-foreground mb-8">
          Trusted by top-tier agencies and freelancers
        </p>
        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
          <Marquee pauseOnHover className="[--duration:20s]">
            {companies.map((company, i) => (
              <div key={i} className="mx-12 flex items-center gap-2 grayscale opacity-50 hover:opacity-100 hover:grayscale-0 transition-all duration-300">
                <company.icon className="h-6 w-6" />
                <span className="text-xl font-bold tracking-tight">{company.name}</span>
              </div>
            ))}
          </Marquee>
          
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-background dark:from-background"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-background dark:from-background"></div>
        </div>
      </div>
    </section>
  );
}
