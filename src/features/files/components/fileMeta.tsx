import {
  Archive,
  FileImage,
  FileText,
  FileType,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  Presentation,
  File as GenericFile,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FileKind, ProjectFile } from "@/features/files/types";

// --- Configuration Maps ---

const FILE_KIND_LABELS: Record<string, string> = {
  pdf: "PDF",
  image: "Image",
  doc: "Doc",
  archive: "Archive",
  video: "Video",
  audio: "Audio",
  zip: "Zip",
  rar: "Rar",
  ppt: "Ppt",
  pptx: "Pptx",
  xls: "Xls",
  xlsx: "Xlsx",
  csv: "Csv",
};

const FILE_KIND_COLORS: Record<string, string> = {
  pdf: "bg-rose-500/10 text-rose-600 dark:text-rose-500 border-rose-500/20",
  image: "bg-sky-500/10 text-sky-600 dark:text-sky-500 border-sky-500/20",
  doc: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20",
  archive:
    "bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20",
  zip: "bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20",
  rar: "bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20",
  video: "bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20",
  audio:
    "bg-purple-500/10 text-purple-600 dark:text-purple-500 border-purple-500/20",
  ppt: "bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20",
  pptx: "bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20",
  xls: "bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20",
  xlsx: "bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20",
  csv: "bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20",
};

const FILE_ICON_CONFIG: Record<
  string,
  { Icon: React.ElementType; color: string }
> = {
  pdf: { Icon: FileType, color: "text-rose-500" },
  image: { Icon: FileImage, color: "text-sky-500" },
  doc: { Icon: FileText, color: "text-emerald-500" },
  archive: { Icon: Archive, color: "text-amber-500" },
  video: { Icon: FileVideo, color: "text-blue-500" },
  audio: { Icon: FileAudio, color: "text-purple-500" },
  zip: { Icon: Archive, color: "text-orange-500" },
  rar: { Icon: Archive, color: "text-orange-500" },
  ppt: { Icon: Presentation, color: "text-red-500" },
  pptx: { Icon: Presentation, color: "text-red-500" },
  xls: { Icon: FileSpreadsheet, color: "text-green-500" },
  xlsx: { Icon: FileSpreadsheet, color: "text-green-500" },
  csv: { Icon: FileSpreadsheet, color: "text-green-500" },
};

const APPROVAL_CONFIG = {
  approved: { label: "Approved", variant: "success" },
  changes_requested: { label: "Changes Requested", variant: "destructive" },
  pending_review: { label: "Pending", variant: "outline" },
} as const;

// --- Utility Functions ---

export function inferFileKind(mimeType: string): FileKind {
  const mime = mimeType.toLowerCase();

  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";

  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("csv")) return "csv";
  if (mime.includes("zip")) return "zip";
  if (mime.includes("rar")) return "rar";

  if (/presentation|powerpoint|ppt/.test(mime))
    return mime.includes("pptx") ? "pptx" : "ppt";
  if (/spreadsheet|excel|xls/.test(mime))
    return mime.includes("xlsx") ? "xlsx" : "xls";
  if (/word|document|doc/.test(mime)) return "doc";
  if (/tar|archive/.test(mime)) return "archive";

  return "other";
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function fileKindLabel(kind: FileKind): string {
  return FILE_KIND_LABELS[kind] || "File";
}

export function fileKindColor(kind: FileKind): string {
  return (
    FILE_KIND_COLORS[kind] || "bg-muted text-muted-foreground border-border"
  );
}

// --- Components ---

export function FileTypeIcon({ kind }: { kind: FileKind }) {
  const config = FILE_ICON_CONFIG[kind];

  if (!config) {
    return <GenericFile className="text-muted-foreground h-4 w-4" />;
  }

  const { Icon, color } = config;
  return <Icon className={cn("h-4 w-4", color)} />;
}

export function FileTypeBadge({ kind }: { kind: FileKind }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 rounded-md px-2 text-[11px] font-medium",
        fileKindColor(kind),
      )}
    >
      {fileKindLabel(kind)}
    </Badge>
  );
}

export function ApprovalBadge({
  status,
}: {
  status: ProjectFile["approvalStatus"];
}) {
  const config = APPROVAL_CONFIG[status] || APPROVAL_CONFIG.pending_review;

  return (
    <Badge variant={config.variant} className="h-6 rounded-md px-2 text-[11px]">
      {config.label}
    </Badge>
  );
}
