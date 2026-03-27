import { cn } from "@/lib/utils";

type FileKind = "pdf" | "image" | "doc" | "archive" | "other";

const CONFIG: Record<FileKind, { label: string; classes: string }> = {
  pdf: {
    label: "PDF",
    classes:
      "bg-red-50 text-red-600 ring-red-100 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-900",
  },
  image: {
    label: "Image",
    classes:
      "bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-950/40 dark:text-violet-400 dark:ring-violet-900",
  },
  doc: {
    label: "Doc",
    classes:
      "bg-blue-50 text-blue-600 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-blue-900",
  },
  archive: {
    label: "Zip",
    classes:
      "bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900",
  },
  other: {
    label: "File",
    classes:
      "bg-neutral-50 text-neutral-500 ring-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-800",
  },
};

export function inferFileKind(mimeType: string): FileKind {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("zip") || mimeType.includes("rar")) return "archive";
  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("sheet") ||
    mimeType.includes("presentation")
  )
    return "doc";
  return "other";
}

export function FileTypeChip({
  mimeType,
  className,
}: {
  mimeType: string;
  className?: string;
}) {
  const kind = inferFileKind(mimeType);
  const { label, classes } = CONFIG[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase ring-1 ring-inset",
        classes,
        className,
      )}
    >
      {label}
    </span>
  );
}
