import { differenceInDays, format, isToday } from "date-fns";
import {
  DEADLINE_ICONS,
  PRIORITY_CONFIG,
  STATUS_PROGRESS,
  STATUS_CONFIG,
  type ProjectCardData,
  type ProjectPriority,
  type ProjectStatus,
} from "./ProjectCard.constants";
import {
  PROJECT_CARD_COPY,
  PROJECT_CARD_CURRENCY,
  PROJECT_CARD_FORMATS,
} from "./ProjectCard.content";
import { PRIORITY_LABELS, STATUS_LABELS } from "../../schemas";

type DeadlineInfo = {
  text: string;
  className: string;
  bgClassName: string;
  icon: (typeof DEADLINE_ICONS)[keyof typeof DEADLINE_ICONS];
};

function getDeadlineInfo(
  deadline: Date | null,
  isOverdue: boolean,
): DeadlineInfo | null {
  if (!deadline) return null;

  if (isOverdue) {
    const daysOverdue = Math.abs(differenceInDays(new Date(), deadline));
    return {
      text: `${daysOverdue}d overdue`,
      className: "text-red-700 dark:text-red-300 font-semibold",
      bgClassName: "bg-red-500/10 border border-red-500/20",
      icon: DEADLINE_ICONS.overdue,
    };
  }

  if (isToday(deadline)) {
    return {
      text: PROJECT_CARD_COPY.dueToday,
      className: "text-amber-700 dark:text-amber-300 font-semibold",
      bgClassName: "bg-amber-500/10 border border-amber-500/20",
      icon: DEADLINE_ICONS.overdue,
    };
  }

  const daysUntil = differenceInDays(deadline, new Date());
  if (daysUntil <= 7 && daysUntil > 0) {
    return {
      text: `${daysUntil}d left`,
      className: "text-amber-700 dark:text-amber-300",
      bgClassName: "bg-amber-500/10 border border-amber-500/20",
      icon: DEADLINE_ICONS.soon,
    };
  }

  return {
    text: format(deadline, PROJECT_CARD_FORMATS.longDate),
    className: "text-muted-foreground",
    bgClassName: "",
    icon: DEADLINE_ICONS.date,
  };
}

/**
 * Parse a raw name string that may contain comma-separated junk (e.g. "Jon,,,,,").
 * Returns the display name.
 */
function cleanName(raw: string): string {
  const cleaned = raw
    .split(",")
    .map((s) => s.trim())
    .find((s) => s.length > 0);
  return cleaned || "Unassigned";
}

function getClientInitials(name: string) {
  if (name === "Unassigned" || !name) return "--";

  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (
      (words[0]?.charAt(0) ?? "") + (words[words.length - 1]?.charAt(0) ?? "")
    ).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getFormattedClientName(project: ProjectCardData): string {
  const raw = project.clientCompanyName ?? project.clientEmail ?? "";
  if (!raw) return "Unassigned";
  return cleanName(raw);
}

function getClientAvatarColor(name: string) {
  if (name === "Unassigned")
    return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
  const colors = [
    "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
    "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
    "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
    "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
    "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300",
    "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
    "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatBudget(budget: number | null) {
  if (budget == null) return null;

  return new Intl.NumberFormat(PROJECT_CARD_CURRENCY.locale, {
    style: "currency",
    currency: PROJECT_CARD_CURRENCY.currency,
    maximumFractionDigits: PROJECT_CARD_CURRENCY.maximumFractionDigits,
  }).format(budget);
}

function getStatusLabel(status: ProjectStatus) {
  return STATUS_LABELS[status]?.toUpperCase() ?? status.toUpperCase();
}

function getPriorityLabel(priority: ProjectPriority) {
  return PRIORITY_LABELS[priority]?.toUpperCase() ?? priority.toUpperCase();
}

function getTimelineLabel(startDate: Date | null, deadlineDate: Date | null) {
  if (!startDate && !deadlineDate) {
    return PROJECT_CARD_COPY.noTimeline;
  }

  if (startDate && deadlineDate) {
    return `${format(startDate, PROJECT_CARD_FORMATS.shortDate)}${PROJECT_CARD_COPY.timelineSeparator}${format(deadlineDate, PROJECT_CARD_FORMATS.shortDate)}`;
  }

  if (startDate) {
    return format(startDate, PROJECT_CARD_FORMATS.shortDate);
  }

  return deadlineDate
    ? format(deadlineDate, PROJECT_CARD_FORMATS.shortDate)
    : PROJECT_CARD_COPY.noTimeline;
}

export function getProjectCardViewModel(project: ProjectCardData) {
  const deadlineDate = project.deadline ? new Date(project.deadline) : null;
  const startDate = project.startDate ? new Date(project.startDate) : null;
  const statusCfg = STATUS_CONFIG[project.status];
  const priorityCfg = PRIORITY_CONFIG[project.priority];

  const clientName = getFormattedClientName(project);

  return {
    project,
    statusCfg,
    priorityCfg,
    statusLabel: getStatusLabel(project.status),
    priorityLabel: getPriorityLabel(project.priority),
    deadlineDate,
    startDate,
    progressValue: STATUS_PROGRESS[project.status],
    deadlineInfo: getDeadlineInfo(deadlineDate, project.isOverdue),
    timelineLabel: getTimelineLabel(startDate, deadlineDate),
    createdAtLabel: format(
      new Date(project.createdAt),
      PROJECT_CARD_FORMATS.shortDate,
    ),
    clientInitials: getClientInitials(clientName),
    clientAvatarColor: getClientAvatarColor(clientName),
    budgetFormatted: formatBudget(project.budget),
    clientName: clientName,
  };
}
