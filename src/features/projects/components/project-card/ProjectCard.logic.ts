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

function getClientInitials(project: ProjectCardData) {
  if (project.clientCompanyName) {
    return project.clientCompanyName
      .split(" ")
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return project.clientEmail?.slice(0, 2).toUpperCase() ?? "--";
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
    clientInitials: getClientInitials(project),
    budgetFormatted: formatBudget(project.budget),
    clientName:
      project.clientCompanyName ??
      project.clientEmail ??
      PROJECT_CARD_COPY.noClient,
  };
}
