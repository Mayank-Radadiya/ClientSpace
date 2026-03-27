import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileSpreadsheet,
  Presentation,
  File,
} from "lucide-react";
import type { FileKind } from "../types";

type FileTypeIconProps = {
  kind: FileKind;
  className?: string;
};

export function FileTypeIcon({
  kind,
  className = "h-5 w-5",
}: FileTypeIconProps) {
  const iconProps = { className, strokeWidth: 1.5 };

  switch (kind) {
    case "pdf":
      return (
        <FileText {...iconProps} className={`${className} text-red-600`} />
      );
    case "doc":
      return (
        <FileText {...iconProps} className={`${className} text-blue-600`} />
      );
    case "image":
      return (
        <FileImage {...iconProps} className={`${className} text-purple-600`} />
      );
    case "video":
      return (
        <FileVideo {...iconProps} className={`${className} text-pink-600`} />
      );
    case "audio":
      return (
        <FileAudio {...iconProps} className={`${className} text-indigo-600`} />
      );
    case "xls":
    case "xlsx":
    case "csv":
      return (
        <FileSpreadsheet
          {...iconProps}
          className={`${className} text-green-600`}
        />
      );
    case "ppt":
    case "pptx":
      return (
        <Presentation
          {...iconProps}
          className={`${className} text-orange-600`}
        />
      );
    case "zip":
    case "rar":
    case "archive":
      return (
        <FileArchive {...iconProps} className={`${className} text-amber-600`} />
      );
    default:
      return <File {...iconProps} className={`${className} text-gray-600`} />;
  }
}
