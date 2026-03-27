import type { ProjectFile } from "../types";

export type SortBy = "name" | "date" | "size";

export function sortFiles(files: ProjectFile[], sortBy: SortBy): ProjectFile[] {
  const sorted = [...files];

  switch (sortBy) {
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case "size":
      return sorted.sort((a, b) => {
        const aSize = a.sizeBytes ?? 0;
        const bSize = b.sizeBytes ?? 0;
        return bSize - aSize;
      });

    case "date":
    default:
      return sorted.sort((a, b) => {
        const aDate = new Date(a.updatedAt);
        const bDate = new Date(b.updatedAt);
        return bDate.getTime() - aDate.getTime();
      });
  }
}
