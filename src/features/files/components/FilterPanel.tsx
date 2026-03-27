"use client";

import { motion } from "framer-motion";
import {
  FileIcon,
  FileImage,
  FileText,
  FileSpreadsheet,
  Presentation,
  Film,
  Archive,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TypeFilter } from "../utils/file-filtering";

type FilterPanelProps = {
  selectedType: TypeFilter;
  onTypeChange: (type: TypeFilter) => void;
  typeCounts?: Record<TypeFilter, number>;
};

const typeFilters: {
  value: TypeFilter;
  label: string;
  icon: typeof FileIcon;
}[] = [
  { value: "all", label: "All Files", icon: Folder },
  { value: "image", label: "Images", icon: FileImage },
  { value: "pdf", label: "PDFs", icon: FileText },
  { value: "doc", label: "Documents", icon: FileText },
  { value: "spreadsheet", label: "Spreadsheets", icon: FileSpreadsheet },
  { value: "presentation", label: "Presentations", icon: Presentation },
  { value: "media", label: "Media", icon: Film },
  { value: "archive", label: "Archives", icon: Archive },
];

export function FilterPanel({
  selectedType,
  onTypeChange,
  typeCounts,
}: FilterPanelProps) {
  return (
    <div className="space-y-1">
      <h3 className="text-muted-foreground mb-2 px-1 text-xs font-medium tracking-wider uppercase">
        File Type
      </h3>
      {typeFilters.map((filter, index) => {
        const Icon = filter.icon;
        const count = typeCounts?.[filter.value];
        const isSelected = selectedType === filter.value;

        return (
          <motion.button
            key={filter.value}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.12, delay: index * 0.02 }}
            onClick={() => onTypeChange(filter.value)}
            className={cn(
              "group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer hover:bg-muted hover:text-foreground hover:border-r-2 hover:border-primary hover:border-l-2 hover:scale-105",
              isSelected
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={cn(
                  "h-4 w-4",
                  isSelected
                    ? "text-primary"
                    : "text-muted-foreground/70 group-hover:text-foreground",
                )}
              />
              <span>{filter.label}</span>
            </div>
            {count !== undefined && (
              <span
                className={cn(
                  "text-xs",
                  isSelected ? "text-primary/70" : "text-muted-foreground/50",
                )}
              >
                {count}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
