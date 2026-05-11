import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./AnimatedCounter";
import { CUBIC_BEZIER } from "../constants";
import { formatCents } from "../utils/formatters";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type ClientsPremiumStatsProps = {
  stats: {
    totalClients: number;
    activeProjects: number;
    outstandingInvoicesCents: number;
  };
  statFilter: string;
  setStatFilter: (filter: "all" | "has_projects" | "has_outstanding") => void;
};

export function ClientsPremiumStats({
  stats,
  statFilter,
  setStatFilter,
}: ClientsPremiumStatsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {[
        {
          id: "all",
          label: "TOTAL CLIENTS",
          stat: stats.totalClients,
          isMoney: false,
          color: "#4F7FFF",
          trend: { value: 2, type: "up" as const },
        },
        {
          id: "has_projects",
          label: "ACTIVE PROJECTS",
          stat: stats.activeProjects,
          isMoney: false,
          color: "#22C55E",
          trend: { value: 1, type: "up" as const },
        },
        {
          id: "has_outstanding",
          label: "OUTSTANDING",
          stat: stats.outstandingInvoicesCents,
          isMoney: true,
          color: "#F59E0B",
          trend: { value: 0, type: "neutral" as const },
        },
      ].map((card, idx) => {
        const isActive = statFilter === card.id;
        return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.25,
                delay: idx * 0.02,
                ease: CUBIC_BEZIER,
              }}
              onClick={() =>
                setStatFilter(
                  card.id as "all" | "has_projects" | "has_outstanding",
                )
              }
              className={cn(
                "group relative cursor-pointer overflow-hidden rounded-[14px] border p-6 transition-all duration-180 ease-out",
                isActive
                  ? "border-[rgba(79,127,255,0.4)] shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] bg-white dark:bg-[#111118]"
                  : "border-[rgba(0,0,0,0.07)] dark:border-[rgba(255,255,255,0.06)] bg-white dark:bg-[#111118] hover:border-[rgba(79,127,255,0.4)] shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] hover:-translate-y-[2px]"
              )}
            >
              {/* 2px top line */}
              <div 
                className={cn(
                  "absolute top-0 left-0 h-[2px] w-full transition-opacity duration-180",
                  isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                )}
                style={{ backgroundColor: card.color }}
              />

              {/* SVG noise texture 2% */}
              <div 
                className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.02]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
              />

              <div className="relative z-10 flex items-start justify-between mb-4">
                <p className="text-[11px] font-[var(--font-data)] tracking-[0.08em] text-[#6B6B7E] uppercase">
                  {card.label}
                </p>
                
                {/* Trend Indicator */}
                <div className="flex items-center gap-1 font-[var(--font-data)] text-[11px]">
                  {card.trend.type === "up" && <TrendingUp className="h-3 w-3 text-[#22C55E]" />}
                  {card.trend.type === "down" && <TrendingDown className="h-3 w-3 text-[#EF4444]" />}
                  {card.trend.type === "neutral" && <Minus className="h-3 w-3 text-[#6B6B7E]" />}
                  <span className={cn(
                    card.trend.type === "up" ? "text-[#22C55E]" :
                    card.trend.type === "down" ? "text-[#EF4444]" : "text-[#6B6B7E]"
                  )}>
                    {card.trend.type !== "neutral" && "+"}{card.trend.value}
                  </span>
                </div>
              </div>

              <div className="relative z-10 flex items-baseline gap-2">
                <div className="text-[52px] leading-none font-[var(--font-metrics)] text-[#0D0D14] dark:text-[#F2F2F5]">
                  {card.isMoney ? (
                    <AnimatedCounter
                      value={formatCents(card.stat).replace("$", "")}
                      prefix="$"
                    />
                  ) : (
                    <AnimatedCounter value={card.stat} />
                  )}
                </div>
                <span className="text-[11px] font-[var(--font-data)] text-[#6B6B7E]">
                  this month
                </span>
              </div>
            </motion.div>
        );
      })}
    </section>
  );
}
