import { motion, AnimatePresence } from "motion/react";
import { Mail, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClientListItem } from "../client.types";
import { STATUS_DOT, CUBIC_BEZIER } from "../constants";
import { statusLabel, formatCents, formatRelative } from "../utils/formatters";
import { PaddedNumber } from "./PaddedNumber";

type ClientsGridProps = {
  visibleClients: ClientListItem[];
  openClient: (id: string) => void;
};

export function ClientsGrid({ visibleClients, openClient }: ClientsGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <AnimatePresence mode="popLayout">
        {visibleClients.map((client, idx) => (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{
              duration: 0.3,
              delay: idx * 0.03,
              ease: CUBIC_BEZIER,
            }}
            key={client.id}
            onClick={() => openClient(client.id)}
            className="group border-border bg-card relative cursor-pointer overflow-hidden rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300 hover:border-[primary]/60 hover:shadow-md"
          >
            {/* Status Pip */}
            <div className="absolute top-5 right-5 flex items-center gap-2">
              <span className="font-data)] text-muted-foreground text-[9px] tracking-widest uppercase">
                {statusLabel(client.displayStatus)}
              </span>
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  STATUS_DOT[client.displayStatus],
                )}
              />
            </div>

            {/* Header */}
            <div className="mb-6 pr-16">
              <h3 className="font-display)] text-foreground group-hover:text-primary line-clamp-1 text-xl font-bold transition-colors">
                {client.companyName ?? client.contactName ?? client.email}
              </h3>
              <p className="font-data)] text-muted-foreground mt-1.5 line-clamp-1 text-[11px] tracking-widest uppercase">
                {client.contactName ?? "None"}
              </p>
            </div>

            <div className="font-data)] text-muted-foreground mb-6 flex items-center gap-2 text-[11px] tracking-wide transition-colors group-hover:text-blue-500">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{client.email}</span>
            </div>

            {/* KPI Mini-cells */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="border-border bg-muted/50 group-hover:border-border rounded-xl border p-3 transition-colors">
                <p className="font-data)] text-muted-foreground text-[9px] tracking-widest uppercase">
                  Projects
                </p>
                <p className="text-foreground mt-1 text-3xl">
                  <PaddedNumber value={client.activeProjectCount} />
                </p>
              </div>
              <div className="border-border bg-muted/50 group-hover:border-border rounded-xl border p-3 transition-colors">
                <p className="font-data)] text-muted-foreground text-[9px] tracking-widest uppercase">
                  Outstanding
                </p>
                <p className="text-primary mt-1 truncate text-[22px] leading-tight">
                  {formatCents(client.outstandingAmountCents)}
                </p>
              </div>
            </div>

            <div className="font-data)] text-muted-foreground flex items-center gap-2 text-[10px] tracking-widest uppercase">
              <Clock3 className="h-3 w-3 opacity-60" />
              <span>Active {formatRelative(client.lastActivityAt)}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
