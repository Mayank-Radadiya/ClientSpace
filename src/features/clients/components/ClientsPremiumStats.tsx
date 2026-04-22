import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./AnimatedCounter";
import { CUBIC_BEZIER } from "../constants";
import { formatCents } from "../utils/formatters";

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
    <section className="grid gap-6 md:grid-cols-3">
      {[
        {
          id: "all",
          label: "TOTAL CLIENTS",
          stat: stats.totalClients,
          isMoney: false,
        },
        {
          id: "has_projects",
          label: "ACTIVE PROJECTS",
          stat: stats.activeProjects,
          isMoney: false,
        },
        {
          id: "has_outstanding",
          label: "OUTSTANDING",
          stat: stats.outstandingInvoicesCents,
          isMoney: true,
        },
      ].map((card, idx) => {
        const isActive = statFilter === card.id;
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: idx * 0.05,
              ease: CUBIC_BEZIER,
            }}
            onClick={() =>
              setStatFilter(
                card.id as "all" | "has_projects" | "has_outstanding",
              )
            }
            className={cn(
              "group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card p-6 backdrop-blur-md transition-all duration-300",
              isActive
                ? "border-[primary]/50 shadow-md"
                : "hover:-translate-y-0.5 hover:border-border hover:shadow-md",
            )}
          >
            <div className="absolute top-0 left-0 h-[2px] w-full bg-[linear-gradient(90deg,transparent_0%,primary_50%,transparent_100%)] opacity-20 transition-opacity duration-300 group-hover:opacity-100" />
            <p className="mb-3 text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase transition-colors group-hover:text-foreground">
              {card.label}
            </p>
            <div className="text-[52px] leading-none tracking-tight text-foreground">
              {card.isMoney ? (
                <AnimatedCounter
                  value={formatCents(card.stat).replace("$", "")}
                  prefix="$"
                />
              ) : (
                <AnimatedCounter value={card.stat} />
              )}
            </div>
          </motion.div>
        );
      })}
    </section>
  );
}
