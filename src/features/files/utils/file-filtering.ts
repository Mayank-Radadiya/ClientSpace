import { inferFileKind } from "./file-helpers";
import type { ProjectFile } from "../types";

export type TypeFilter =
  | "all"
  | "image"
  | "pdf"
  | "doc"
  | "spreadsheet"
  | "presentation"
  | "media"
  | "archive"
  | "other";

export function filterFilesByType(
  files: ProjectFile[],
  typeFilter: TypeFilter,
): ProjectFile[] {
  if (typeFilter === "all") return files;

  return files.filter((file) => {
    const kind = inferFileKind(file.mimeType);

    switch (typeFilter) {
      case "image":
        return kind === "image";
      case "pdf":
        return kind === "pdf";
      case "doc":
        return kind === "doc";
      case "spreadsheet":
        return kind === "xls" || kind === "xlsx" || kind === "csv";
      case "presentation":
        return kind === "ppt" || kind === "pptx";
      case "media":
        return kind === "video" || kind === "audio";
      case "archive":
        return kind === "archive" || kind === "zip" || kind === "rar";
      case "other":
        return kind === "other";
      default:
        return true;
    }
  });
}

export function filterFilesByQuery(
  files: ProjectFile[],
  query: string,
): ProjectFile[] {
  if (!query.trim()) return files;

  const lowerQuery = query.toLowerCase().trim();
  return files.filter((file) => file.name.toLowerCase().includes(lowerQuery));
}

export function filterFilesByStatus(
  files: ProjectFile[],
  statusFilter: string, // Accept generic string, but will cast to StatusFilter context
): ProjectFile[] {
  if (statusFilter === "all") return files;

  return files.filter((file) => file.approvalStatus === statusFilter);
}

export function applyFilters(
  files: ProjectFile[],
  query: string,
  typeFilter: TypeFilter,
  statusFilter: string = "all",
): ProjectFile[] {
  let result = files;
  result = filterFilesByQuery(result, query);
  result = filterFilesByType(result, typeFilter);
  result = filterFilesByStatus(result, statusFilter);
  return result;
}
