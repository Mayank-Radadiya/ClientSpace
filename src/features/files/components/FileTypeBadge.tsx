import {
  FileType,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  Presentation,
  FileArchive,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { FileKind } from "../types";

type FileTypeBadgeProps = {
  kind: FileKind;
};

const badgeConfig: Record<
  FileKind,
  {
    label: string;
    icon: React.ElementType;
    className: string;
  }
> = {
  pdf: {
    label: "PDF",
    icon: FileType,
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  doc: {
    label: "DOC",
    icon: FileText,
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  image: {
    label: "IMG",
    icon: FileImage,
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  video: {
    label: "VID",
    icon: FileVideo,
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  audio: {
    label: "AUD",
    icon: FileAudio,
    className: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
  xls: {
    label: "XLS",
    icon: FileSpreadsheet,
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  xlsx: {
    label: "XLS",
    icon: FileSpreadsheet,
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  csv: {
    label: "CSV",
    icon: FileSpreadsheet,
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  ppt: {
    label: "PPT",
    icon: Presentation,
    className: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
  pptx: {
    label: "PPT",
    icon: Presentation,
    className: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
  zip: {
    label: "ZIP",
    icon: FileArchive,
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  rar: {
    label: "RAR",
    icon: FileArchive,
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  archive: {
    label: "ARC",
    icon: FileArchive,
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  other: {
    label: "FILE",
    icon: FileType,
    className: "bg-muted text-muted-foreground border",
  },
};

export function FileTypeBadge({ kind }: FileTypeBadgeProps) {
  const config = badgeConfig[kind] ?? badgeConfig.other;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1 px-2 py-3 text-sm font-medium ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
