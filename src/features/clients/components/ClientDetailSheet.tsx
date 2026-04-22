import { Mail, MoreHorizontal, List, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { ClientListItem } from "../client.types";
import { STATUS_DOT, CUBIC_BEZIER } from "../constants";
import { statusLabel, formatCents, formatRelative } from "../utils/formatters";
import { AnimatedCounter } from "./AnimatedCounter";

export type ClientSheetTab = "overview" | "projects" | "invoices" | "activity";

type DetailSheetProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedClient: ClientListItem | null;
  tab: ClientSheetTab;
  setTab: (tab: ClientSheetTab) => void;
  projectsQuery: any;
  invoicesQuery: any;
  activityQuery: any;
};

export function ClientDetailSheet({
  isOpen,
  setIsOpen,
  selectedClient,
  tab,
  setTab,
  projectsQuery,
  invoicesQuery,
  activityQuery,
}: DetailSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="right"
        className="border-border bg-background w-full max-w-[520px] border-l p-0 shadow-2xl focus-visible:outline-none"
      >
        <div className="flex h-full w-full flex-col overflow-y-auto pt-12">
          {selectedClient ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05, delayChildren: 0.1 },
                },
              }}
              className="px-8 pb-12"
            >
              <motion.div
                variants={{
                  hidden: { y: 20, opacity: 0 },
                  visible: {
                    y: 0,
                    opacity: 1,
                    transition: { ease: CUBIC_BEZIER },
                  },
                }}
                className="mb-10 flex items-start gap-6"
              >
                {/* Typographic Avatar */}
                <div className="border-border bg-muted relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border shadow-xl">
                  <div className="absolute inset-0" />
                  <span className="text-3xl font-bold text-(--obs-gold)">
                    {(
                      selectedClient.companyName ||
                      selectedClient.contactName ||
                      selectedClient.email ||
                      "?"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-col justify-center">
                  <h2 className="text-foreground text-3xl leading-tight font-extrabold">
                    {selectedClient.companyName ??
                      selectedClient.contactName ??
                      selectedClient.email}
                  </h2>
                  <p className="text-muted-foreground hover:text-foreground mt-2 flex max-w-max cursor-pointer items-center gap-2 text-[11px] tracking-widest uppercase transition-colors">
                    <Mail className="h-3 w-3" />
                    {selectedClient.email}
                  </p>
                </div>
              </motion.div>

              <motion.div
                variants={{
                  hidden: { y: 20, opacity: 0 },
                  visible: {
                    y: 0,
                    opacity: 1,
                    transition: { ease: CUBIC_BEZIER },
                  },
                }}
                className="mb-10 grid grid-cols-2 gap-4"
              >
                <div className="border-border bg-muted/30 rounded-2xl border p-5 backdrop-blur-sm">
                  <p className="text-muted-foreground mb-2 text-[10px] tracking-[0.2em] uppercase">
                    Projects
                  </p>
                  <p className="text-foreground text-[40px] leading-none font-(--font-metrics)">
                    <AnimatedCounter
                      value={selectedClient.activeProjectCount}
                    />
                  </p>
                </div>
                <div className="border-border bg-muted/30 relative overflow-hidden rounded-2xl border p-5 backdrop-blur-sm">
                  <div className="via-primary absolute top-0 right-0 h-full w-1 bg-linear-to-b from-transparent to-transparent opacity-30" />
                  <p className="text-muted-foreground mb-2 text-[10px] tracking-[0.2em] uppercase">
                    Outstanding
                  </p>
                  <p className="text-primary text-[34px] leading-none font-(--font-metrics)">
                    {formatCents(selectedClient.outstandingAmountCents)}
                  </p>
                </div>
              </motion.div>

              {/* Custom Tabs */}
              <motion.div
                variants={{
                  hidden: { y: 20, opacity: 0 },
                  visible: {
                    y: 0,
                    opacity: 1,
                    transition: { ease: CUBIC_BEZIER },
                  },
                }}
                className="border-border mb-8 flex w-full items-center gap-6 border-b"
              >
                {(
                  [
                    "overview",
                    "projects",
                    "invoices",
                    "activity",
                  ] as ClientSheetTab[]
                ).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "relative pb-4 text-[11px] font-bold tracking-[0.15em] uppercase transition-colors",
                      tab === t
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t}
                    {tab === t && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="bg-primary absolute bottom-0 left-0 h-[2px] w-full shadow-sm"
                      />
                    )}
                  </button>
                ))}
              </motion.div>

              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: CUBIC_BEZIER }}
                className="space-y-6"
              >
                {tab === "overview" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border-border bg-muted/30 rounded-xl border p-4">
                        <p className="text-muted-foreground mb-3 text-[9px] tracking-[0.2em] uppercase">
                          Status
                        </p>
                        <div className="border-border bg-muted inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
                          <div
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              STATUS_DOT[selectedClient.displayStatus],
                            )}
                          />
                          <span className="text-foreground text-[10px] tracking-widest uppercase">
                            {statusLabel(selectedClient.displayStatus)}
                          </span>
                        </div>
                      </div>
                      <div className="border-border bg-muted/30 rounded-xl border p-4">
                        <p className="text-muted-foreground mb-2 text-[9px] tracking-[0.2em] uppercase">
                          Total Revenue
                        </p>
                        <p className="text-foreground text-2xl font-(--font-metrics) tracking-wide">
                          {formatCents(selectedClient.totalRevenueCents)}
                        </p>
                      </div>
                    </div>

                    <div className="border-border bg-popover rounded-xl border p-5">
                      <h4 className="text-muted-foreground mb-4 text-[9px] tracking-[0.2em] uppercase">
                        Quick Actions
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <button className="border-border bg-muted/30 hover:bg-primary/5 hover:text-primary flex flex-col items-center justify-center gap-2 rounded-lg border py-4 transition-colors hover:border-[primary]/40">
                          <div className="bg-muted/50 flex h-8 w-8 items-center justify-center rounded-full">
                            <MoreHorizontal className="h-4 w-4" />
                          </div>
                          <span className="text-muted-foreground text-[10px] tracking-widest uppercase">
                            Edit
                          </span>
                        </button>
                        <button className="border-border bg-muted/30 hover:bg-muted/50 flex flex-col items-center justify-center gap-2 rounded-lg border py-4 transition-colors hover:border-white/20">
                          <div className="bg-muted/50 flex h-8 w-8 items-center justify-center rounded-full">
                            <List className="h-4 w-4" />
                          </div>
                          <span className="text-muted-foreground text-[10px] tracking-widest uppercase">
                            Archive
                          </span>
                        </button>
                        <button className="group border-border bg-muted/30 flex flex-col items-center justify-center gap-2 rounded-lg border py-4 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400">
                          <div className="bg-muted/50 flex h-8 w-8 items-center justify-center rounded-full group-hover:bg-red-500/20">
                            <div className="h-1.5 w-1.5 rounded-full bg-[muted-foreground] group-hover:bg-red-400" />
                          </div>
                          <span className="text-muted-foreground text-[10px] tracking-widest uppercase group-hover:text-red-400">
                            Delete
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Recent Activity limited view */}
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="text-muted-foreground text-[9px] tracking-[0.2em] uppercase">
                          Recent Activity
                        </h4>
                        <button
                          onClick={() => setTab("activity")}
                          className="text-[9px] tracking-widest text-blue-500 uppercase hover:underline"
                        >
                          View All
                        </button>
                      </div>
                      <div className="space-y-2">
                        {activityQuery.isLoading ? (
                          <div className="border-border flex h-16 items-center justify-center rounded-xl border">
                            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          (activityQuery.data ?? [])
                            .slice(0, 3)
                            .map((act: any) => (
                              <div
                                key={act.id}
                                className="border-border hover:bg-muted/40 flex items-center justify-between rounded-xl border bg-white/1 p-4 transition-colors"
                              >
                                <span className="text-foreground text-sm font-medium">
                                  {act.eventType.replace("_", " ")}
                                </span>
                                <span className="text-muted-foreground text-[9px] tracking-widest uppercase">
                                  {formatRelative(act.createdAt)}
                                </span>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {tab === "projects" && (
                  <div className="space-y-3">
                    {projectsQuery.isLoading ? (
                      <div className="border-border flex h-32 items-center justify-center rounded-xl border">
                        <Loader2 className="text-primary h-5 w-5 animate-spin" />
                      </div>
                    ) : (projectsQuery.data ?? []).length === 0 ? (
                      <div className="border-border rounded-xl border border-dashed p-8 text-center">
                        <p className="text-muted-foreground text-[10px] tracking-widest uppercase">
                          No Projects Found
                        </p>
                      </div>
                    ) : (
                      (projectsQuery.data ?? []).map((project: any) => (
                        <div
                          key={project.id}
                          className="border-border bg-muted/30 hover:border-border flex items-center justify-between rounded-xl border p-5 transition-colors"
                        >
                          <p className="text-foreground text-base font-bold">
                            {project.name}
                          </p>
                          <Badge
                            variant="outline"
                            className="border-border text-foreground text-[9px] tracking-widest uppercase"
                          >
                            {project.status.replace("_", " ")}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {tab === "invoices" && (
                  <div className="space-y-3">
                    {invoicesQuery.isLoading ? (
                      <div className="border-border flex h-32 items-center justify-center rounded-xl border">
                        <Loader2 className="text-primary h-5 w-5 animate-spin" />
                      </div>
                    ) : (invoicesQuery.data ?? []).length === 0 ? (
                      <div className="border-border rounded-xl border border-dashed p-8 text-center">
                        <p className="text-muted-foreground text-[10px] tracking-widest uppercase">
                          No Invoices Found
                        </p>
                      </div>
                    ) : (
                      (invoicesQuery.data ?? []).map((invoice: any) => (
                        <div
                          key={invoice.id}
                          className="border-border bg-muted/30 hover:border-border flex items-center justify-between rounded-xl border p-5 transition-colors"
                        >
                          <div>
                            <p className="text-foreground text-sm font-bold">
                              INV-{invoice.number}
                            </p>
                            <p className="text-primary mt-1 text-xl font-(--font-metrics)">
                              {formatCents(invoice.amountCents)}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="border-border text-muted-foreground text-[9px] tracking-widest uppercase"
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {tab === "activity" && (
                  <div className="relative ml-4 space-y-3 border-l border-white/5 pl-4">
                    {activityQuery.isLoading ? (
                      <div className="flex h-32 items-center justify-center">
                        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
                      </div>
                    ) : (activityQuery.data ?? []).length === 0 ? (
                      <p className="text-muted-foreground text-[10px] tracking-widest uppercase">
                        No timeline events recorded.
                      </p>
                    ) : (
                      (activityQuery.data ?? []).map((act: any) => (
                        <div key={act.id} className="relative mb-6">
                          <div className="border-border bg-popover absolute top-1.5 left-[-21px] h-2 w-2 rounded-full border" />
                          <p className="text-foreground text-sm font-bold">
                            {act.eventType.replace(/_/g, " ")}
                          </p>
                          <p className="text-muted-foreground mt-1.5 text-[9px] tracking-widest uppercase">
                            {new Date(act.createdAt).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          ) : (
            <div className="flex h-full items-center justify-center p-8">
              <p className="text-muted-foreground text-[10px] tracking-[0.2em] uppercase">
                No Target Selected
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
