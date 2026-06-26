// src/features/dashboard/components/DashboardPageClient.tsx
// Premium ClientSpace Dashboard — rebuilt with rich data, animations, and charts

"use client";

import { motion } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  BriefcaseBusiness,
  Users,
  ReceiptText,
  Plus,
  UserPlus,
  FileText,
  Zap,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PageLayout } from "@/app/(dashboard)/_components/PageLayout";

// ─── Animation Variants ───────────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 35 },
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCents(cents: number): string {
  if (cents === 0) return "$0";
  if (cents >= 100_000_00) return `$${(cents / 100_000_00).toFixed(1)}M`;
  if (cents >= 1_000_00) return `$${(cents / 1_000_00).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function timeAgo(dateStr: string | Date): string {
  const date = new Date(dateStr);
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function eventLabel(
  eventType: string,
  metadata: Record<string, unknown>,
): string {
  const map: Record<string, string> = {
    project_created: `Created project "${metadata.projectName ?? "Untitled"}"`,
    project_updated: `Updated project "${metadata.projectName ?? "Untitled"}"`,
    project_status_changed: `Project status → ${metadata.newStatus ?? "updated"}`,
    invoice_created: `New invoice for ${metadata.clientName ?? "client"}`,
    invoice_paid: `Invoice marked as paid`,
    invoice_sent: `Invoice sent to ${metadata.clientName ?? "client"}`,
    task_created: `Task added: "${metadata.taskName ?? "Untitled"}"`,
    task_completed: `Task completed: "${metadata.taskName ?? "Untitled"}"`,
    comment_added: `Comment posted on ${metadata.projectName ?? "project"}`,
    file_uploaded: `File uploaded: "${metadata.fileName ?? "file"}"`,
    client_created: `New client: "${metadata.clientName ?? "Untitled"}"`,
  };
  return map[eventType] ?? eventType.replace(/_/g, " ");
}

function eventIcon(eventType: string) {
  if (eventType.includes("invoice"))
    return {
      Icon: ReceiptText,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    };
  if (eventType.includes("project"))
    return { Icon: FolderOpen, color: "text-blue-500", bg: "bg-blue-500/10" };
  if (eventType.includes("task") && eventType.includes("complete"))
    return {
      Icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    };
  if (eventType.includes("task"))
    return { Icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" };
  if (eventType.includes("file"))
    return { Icon: FileText, color: "text-cyan-500", bg: "bg-cyan-500/10" };
  if (eventType.includes("client"))
    return { Icon: Users, color: "text-rose-500", bg: "bg-rose-500/10" };
  return { Icon: Activity, color: "text-neutral-400", bg: "bg-neutral-500/10" };
}

const STATUS_COLORS: Record<string, string> = {
  in_progress: "#6C63FF",
  not_started: "#8B85FF",
  review: "#00F5D4",
  completed: "#34d399",
  on_hold: "#f59e0b",
  archived: "#6b7280",
};

const STATUS_LABEL: Record<string, string> = {
  in_progress: "In Progress",
  not_started: "Not Started",
  review: "In Review",
  completed: "Completed",
  on_hold: "On Hold",
  archived: "Archived",
};

// ─── Skeleton Components ──────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-neutral-100 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-12 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-8 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-3 w-32 rounded bg-neutral-100 dark:bg-neutral-800/60" />
      </div>
    </div>
  );
}

function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl border border-neutral-100 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900",
        height,
      )}
    >
      <div className="mb-4 h-5 w-40 rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="h-full rounded-lg bg-neutral-100 dark:bg-neutral-800/40" />
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  trend?: number;
  delay?: number;
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  gradient,
  trend,
  delay = 0,
}: KpiCardProps) {
  return (
    <motion.div
      variants={item}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: gradient }}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        {typeof trend === "number" && (
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
              trend >= 0
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"
                : "bg-red-50 text-red-500 dark:bg-red-950/40",
            )}
          >
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          {value}
        </p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {label}
        </p>
        <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
          {sub}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Revenue Tooltip ─────────────────────────────────────────────────────────

function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-neutral-100 bg-white px-3 py-2 text-xs shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
      <p className="font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </p>
      <p className="mt-0.5 font-bold text-[#6C63FF]">
        {formatCents((payload[0]?.value ?? 0) * 100)}
      </p>
    </div>
  );
}

// ─── Project Donut Tooltip ────────────────────────────────────────────────────

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-neutral-100 bg-white px-3 py-2 text-xs shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
      <p className="font-medium text-neutral-700 capitalize dark:text-neutral-300">
        {STATUS_LABEL[payload[0]?.name ?? ""] ?? payload[0]?.name}
      </p>
      <p className="font-bold text-[#6C63FF]">{payload[0]?.value} projects</p>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    in_progress:
      "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
    not_started:
      "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
    review: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300",
    completed:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    on_hold:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    archived:
      "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[status] ?? styles.not_started,
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardPageClientProps {
  userName: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardPageClient({ userName }: DashboardPageClientProps) {
  // ── Data Fetching ──────────────────────────────────────────────────────────
  const { data: stats, isLoading: statsLoading } =
    trpc.analytics.getDashboardStats.useQuery();

  const { data: revenueData, isLoading: revenueLoading } =
    trpc.analytics.getRevenueChart.useQuery();

  const { data: recentProjects, isLoading: projectsLoading } =
    trpc.dashboard.getRecentProjects.useQuery();

  const { data: activityData, isLoading: activityLoading } =
    trpc.activity.getActivityLogs.useQuery({ limit: 8 }, { staleTime: 30_000 });

  // ── Derived ────────────────────────────────────────────────────────────────

  const chartData = (revenueData ?? []).map(
    (r: { month: string; amountCents: number }) => ({
      month: r.month,
      revenue: r.amountCents / 100,
    }),
  );

  // Build donut data from recent projects status distribution
  const statusCounts = (recentProjects ?? []).reduce(
    (acc: Record<string, number>, p: { status: string }) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const donutData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const firstName = userName.split(" ")[0] ?? userName;
  const activities = activityData?.logs ?? [];

  // ── KPI config ────────────────────────────────────────────────────────────
  const kpis = [
    {
      label: "Total Revenue",
      value: statsLoading ? "—" : formatCents(stats?.revenueTotalCents ?? 0),
      sub: "All paid invoices",
      icon: DollarSign,
      gradient: "linear-gradient(135deg, #6C63FF 0%, #8B85FF 100%)",
      trend: 12,
    },
    {
      label: "Outstanding",
      value: statsLoading ? "—" : formatCents(stats?.outstandingCents ?? 0),
      sub: "Draft + sent invoices",
      icon: ReceiptText,
      gradient: "linear-gradient(135deg, #00F5D4 0%, #00C4B0 100%)",
      trend: -4,
    },
    {
      label: "Active Projects",
      value: statsLoading ? "—" : (stats?.activeProjects ?? 0),
      sub: "Non-archived projects",
      icon: BriefcaseBusiness,
      gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
      trend: 8,
    },
    {
      label: "Active Clients",
      value: statsLoading ? "—" : (stats?.activeClients ?? 0),
      sub: "Current organization",
      icon: Users,
      gradient: "linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)",
      trend: 5,
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <PageLayout bleed>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="font-brand text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl dark:text-white">
            Welcome back, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Here&apos;s your business at a glance.
          </p>
        </div>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </motion.div>

      {/* ── Section 1: KPI Cards ─────────────────────────────────────────── */}
      {statsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {kpis.map((kpi, i) => (
            <KpiCard key={kpi.label} {...kpi} delay={i * 0.08} />
          ))}
        </motion.div>
      )}

      {/* ── Section 2: Quick Actions ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="flex flex-wrap items-center gap-3"
      >
        <Link
          href="/projects"
          className="flex items-center gap-2 rounded-xl border border-[#6C63FF]/30 bg-[#6C63FF]/10 px-4 py-2.5 text-sm font-semibold text-[#6C63FF] transition-all duration-150 hover:bg-[#6C63FF]/20 hover:shadow-sm dark:border-[#6C63FF]/20 dark:bg-[#6C63FF]/10"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
        <Link
          href="/clients"
          className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-all duration-150 hover:bg-neutral-50 hover:shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          <UserPlus className="h-4 w-4" />
          Add Client
        </Link>
        <Link
          href="/invoices"
          className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-all duration-150 hover:bg-neutral-50 hover:shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          <FileText className="h-4 w-4" />
          Create Invoice
        </Link>
      </motion.div>

      {/* ── Section 3: Two-column charts ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.4 }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-5"
      >
        {/* Revenue Area Chart — 3/5 width */}
        <div className="lg:col-span-3">
          {revenueLoading ? (
            <ChartSkeleton height="h-72" />
          ) : (
            <div className="h-full rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                  Revenue (Last 12 Months)
                </h2>
                <span className="flex items-center gap-1 rounded-full bg-[#6C63FF]/10 px-2.5 py-1 text-xs font-semibold text-[#6C63FF]">
                  <Zap className="h-3 w-3" />
                  Monthly
                </span>
              </div>
              {chartData.length === 0 ? (
                <div className="flex h-52 items-center justify-center text-sm text-neutral-400">
                  No revenue data yet 📊
                </div>
              ) : (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="csRevGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#6C63FF"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor="#6C63FF"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(0,0,0,0.05)"
                        className="dark:stroke-white/5"
                      />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickFormatter={(v: number) =>
                          v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                        }
                        width={48}
                      />
                      <Tooltip content={<RevenueTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#6C63FF"
                        strokeWidth={2.5}
                        fill="url(#csRevGrad)"
                        dot={false}
                        activeDot={{ r: 5, fill: "#6C63FF", strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Project Status Donut — 2/5 width */}
        <div className="lg:col-span-2">
          {projectsLoading ? (
            <ChartSkeleton height="h-72" />
          ) : (
            <div className="h-full rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                  Project Status
                </h2>
                <Link
                  href="/projects"
                  className="flex items-center gap-0.5 text-xs text-neutral-400 hover:text-[#6C63FF]"
                >
                  View all <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              {donutData.length === 0 ? (
                <div className="flex h-52 items-center justify-center text-sm text-neutral-400">
                  No projects yet
                </div>
              ) : (
                <div className="flex h-52 flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {donutData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={STATUS_COLORS[entry.name] ?? "#6b7280"}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<DonutTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
                    {donutData.map((entry) => (
                      <div
                        key={entry.name}
                        className="flex items-center gap-1.5"
                      >
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            background: STATUS_COLORS[entry.name] ?? "#6b7280",
                          }}
                        />
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {STATUS_LABEL[entry.name] ?? entry.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Section 4+5: Activity Feed + Top Projects ────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.52, duration: 0.4 }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-5"
      >
        {/* Recent Activity Feed — 2/5 width */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm lg:col-span-2 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Recent Activity
            </h2>
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              Last 8 events
            </span>
          </div>
          {activityLoading ? (
            <ActivitySkeleton />
          ) : activities.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-neutral-400">
              No recent activity
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map(
                (act: {
                  id: string;
                  eventType: string;
                  metadata: Record<string, unknown>;
                  createdAt: Date;
                }) => {
                  const { Icon, color, bg } = eventIcon(act.eventType);
                  return (
                    <div key={act.id} className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          bg,
                        )}
                      >
                        <Icon className={cn("h-4 w-4", color)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-neutral-700 dark:text-neutral-300">
                          {eventLabel(act.eventType, act.metadata ?? {})}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                          {timeAgo(act.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>

        {/* Top Projects Table — 3/5 width */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm lg:col-span-3 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Recent Projects
            </h2>
            <Link
              href="/projects"
              className="flex items-center gap-0.5 text-xs font-medium text-[#6C63FF] hover:underline"
            >
              All projects <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {projectsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex animate-pulse items-center gap-3">
                  <div className="h-4 flex-1 rounded bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-6 w-20 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                </div>
              ))}
            </div>
          ) : !recentProjects || recentProjects.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-neutral-400">
              No projects yet
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <th className="pb-3 text-left text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                      Project
                    </th>
                    <th className="pb-3 text-left text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                      Client
                    </th>
                    <th className="pb-3 text-right text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/60">
                  {recentProjects.map(
                    (proj: {
                      id: string;
                      name: string;
                      clientName: string;
                      status: string;
                      priority?: string;
                    }) => (
                      <tr
                        key={proj.id}
                        className="group transition-colors duration-100 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30"
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{
                                background:
                                  STATUS_COLORS[proj.status] ?? "#6b7280",
                              }}
                            />
                            <span className="max-w-[160px] truncate font-medium text-neutral-800 dark:text-neutral-200">
                              {proj.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="max-w-[120px] truncate text-neutral-500 dark:text-neutral-400">
                            {proj.clientName}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <StatusBadge status={proj.status} />
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      {/* Footer hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center text-xs text-neutral-400 dark:text-neutral-600"
      >
        ClientSpace · Data refreshes every 60s
      </motion.p>
    </PageLayout>
  );
}
