"use client";

import { motion } from "framer-motion";
import {
  Milestone as MilestoneIcon,
  FolderOpen,
  Receipt,
  Activity,
  User,
  Signal,
  Flag,
  Calendar,
  DollarSign,
  Tag,
  Clock,
  ArchiveX,
  Trash2,
} from "lucide-react";
import { ActiveSection, Project } from "../../types";
import { ProjectPermissions } from "../../hooks/useProjectPermissions";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import {
  formatStatus,
  formatCurrency,
  getPriorityStyle,
} from "../../../utils/formatters";
import { format } from "date-fns";

interface NavRailProps {
  project: Project;
  permissions: ProjectPermissions;
  activeSection: ActiveSection;
  onSectionChange: (section: ActiveSection) => void;
  onUpdate: (updates: Partial<Project>) => void;
  onArchive: () => void;
  onDelete: () => void;
}

const VIEW_ITEMS: {
  key: ActiveSection;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "milestones", label: "Milestones", icon: MilestoneIcon },
  { key: "files", label: "Files & Assets", icon: FolderOpen },
  { key: "invoices", label: "Invoices", icon: Receipt },
  { key: "activity", label: "Activity Log", icon: Activity },
];

function NavItem({
  label,
  icon: Icon,
  active,
  onClick,
  accent,
  index,
  reduced,
}: {
  label: string;
  icon: React.ElementType;
  active?: boolean;
  onClick: () => void;
  accent?: string;
  index: number;
  reduced: boolean;
}) {
  return (
    <motion.button
      initial={reduced ? false : { opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={
        reduced ? { duration: 0 } : { duration: 0.25, delay: index * 0.03 }
      }
      onClick={onClick}
      className={`group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
        active
          ? "text-foreground font-medium"
          : "text-foreground/45 hover:text-foreground/70"
      }`}
      style={accent ? { color: accent } : undefined}
    >
      {/* Active indicator */}
      {active && (
        <motion.div
          layoutId="nav-active-indicator"
          className="bg-primary absolute top-1 bottom-1 left-0 w-[3px] rounded-full"
        />
      )}

      {/* Hover bg */}
      <span className="bg-muted/50 pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity group-hover:opacity-100" />

      {active && (
        <span className="bg-primary/10 pointer-events-none absolute inset-0 rounded-lg" />
      )}

      <Icon className="relative h-4 w-4 shrink-0" />
      <span className="relative">{label}</span>
    </motion.button>
  );
}

function InfoRow({
  label,
  value,
  icon: Icon,
  index,
  reduced,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  index: number;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={
        reduced
          ? { duration: 0 }
          : { duration: 0.25, delay: 0.15 + index * 0.03 }
      }
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px]"
    >
      <Icon className="text-muted-foreground h-4 w-4 shrink-0" />
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span className="text-foreground/45">{label}</span>
        <span className="text-foreground/70 truncate text-right">{value}</span>
      </div>
    </motion.div>
  );
}

export function NavRail({
  project,
  permissions,
  activeSection,
  onSectionChange,
  onUpdate,
  onArchive,
  onDelete,
}: NavRailProps) {
  const reduced = useReducedMotion();

  const clientName =
    project.client?.company_name || project.client?.contact_name || "No Client";
  const priorityStyle = getPriorityStyle(project.priority);

  return (
    <>
      {/* Desktop nav rail */}
      <nav
        className="border-border bg-muted/30 sticky top-16 hidden h-[calc(100vh-64px)] w-[220px] shrink-0 flex-col overflow-y-auto border-r md:flex"
        role="navigation"
        aria-label="Project navigation"
      >
        <div className="flex flex-1 flex-col gap-1 p-3">
          {/* Section 1 — Views */}
          {VIEW_ITEMS.map((item, i) => {
            if (item.key === "invoices" && !permissions.canViewInvoices)
              return null;
            return (
              <NavItem
                key={item.key}
                label={item.label}
                icon={item.icon}
                active={activeSection === item.key}
                onClick={() => onSectionChange(item.key)}
                index={i}
                reduced={reduced}
              />
            );
          })}

          {/* Section 2 — Project info */}
          <div className="mt-6 mb-1 px-3">
            <span className="text-muted-foreground text-[10px] font-medium tracking-[0.06em] uppercase">
              Project Info
            </span>
          </div>

          <InfoRow
            label="Client"
            value={clientName}
            icon={User}
            index={0}
            reduced={reduced}
          />
          <InfoRow
            label="Status"
            value={formatStatus(project.status)}
            icon={Signal}
            index={1}
            reduced={reduced}
          />
          {permissions.canViewPriority && (
            <InfoRow
              label="Priority"
              value={
                <span className={priorityStyle.text}>
                  {priorityStyle.label}
                </span>
              }
              icon={Flag}
              index={2}
              reduced={reduced}
            />
          )}
          <InfoRow
            label="Deadline"
            value={
              project.deadline
                ? format(new Date(project.deadline), "MMM d, yyyy")
                : "—"
            }
            icon={Calendar}
            index={3}
            reduced={reduced}
          />
          {permissions.canViewBudget && (
            <InfoRow
              label="Budget"
              value={formatCurrency(project.budget)}
              icon={DollarSign}
              index={4}
              reduced={reduced}
            />
          )}
          {project.tags && project.tags.length > 0 && (
            <InfoRow
              label="Tags"
              value={
                <div className="flex flex-wrap gap-1">
                  {project.tags.map((t) => (
                    <span
                      key={t}
                      className="bg-muted text-foreground/70 rounded px-1.5 py-0.5 text-[10px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              }
              icon={Tag}
              index={5}
              reduced={reduced}
            />
          )}
          <InfoRow
            label="Created"
            value={format(new Date(project.created_at), "MMM d, yyyy")}
            icon={Clock}
            index={6}
            reduced={reduced}
          />
        </div>

        {/* Section 3 — Danger */}
        {permissions.canArchiveDelete && (
          <div className="border-border border-t p-3">
            <button
              onClick={onArchive}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-amber-400/70 transition-colors hover:bg-amber-500/10 hover:text-amber-400"
            >
              <ArchiveX className="h-4 w-4" />
              Archive project
            </button>
            <button
              onClick={onDelete}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-red-400/70 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              Delete project
            </button>
          </div>
        )}
      </nav>

      {/* Mobile bottom tab bar */}
      <nav
        className="border-border bg-muted/30 fixed right-0 bottom-0 left-0 z-50 flex items-center justify-around border-t py-2 md:hidden"
        role="navigation"
        aria-label="Project navigation"
      >
        {VIEW_ITEMS.map((item) => {
          if (item.key === "invoices" && !permissions.canViewInvoices)
            return null;
          const active = activeSection === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSectionChange(item.key)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <item.icon className="h-5 w-5" />
              {item.label.split(" ")[0]}
            </button>
          );
        })}
      </nav>
    </>
  );
}
