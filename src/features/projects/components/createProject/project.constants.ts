import { STATUS_LABELS, PRIORITY_LABELS } from "../../schemas";

export const ACTIVE_STATUS_OPTIONS = Object.entries(STATUS_LABELS)
  .filter(([key]) => key !== "completed" && key !== "archived")
  .map(([value, label]) => ({ value, label }));

export const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export { STATUS_LABELS, PRIORITY_LABELS };
