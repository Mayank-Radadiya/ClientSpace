"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Upload, Download, Trash2, FileText, Image, FileSpreadsheet, File, Archive } from "lucide-react";
import type { Asset } from "../../types";

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["pdf"].includes(ext)) return { Icon: FileText, color: "#EF4444" };
  if (["doc", "docx"].includes(ext)) return { Icon: FileText, color: "#4F7FFF" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { Icon: FileSpreadsheet, color: "#22C55E" };
  if (["png", "jpg", "jpeg", "svg", "gif", "fig", "figma"].includes(ext)) return { Icon: Image, color: "#8B5CF6" };
  if (["zip", "rar", "7z"].includes(ext)) return { Icon: Archive, color: "#F59E0B" };
  return { Icon: File, color: "var(--pd-text-muted)" };
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface FilesAssetsTabProps {
  projectId: string;
  files: Asset[];
  onUpload: (file: File) => void;
  onDelete: (id: string) => void;
}

export function FilesAssetsTab({ projectId, files, onUpload, onDelete }: FilesAssetsTabProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) onUpload(f);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--pd-text-primary)" }}>Files & Assets</h2>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-all"
          style={{ background: "var(--pd-accent)", color: "#fff", fontFamily: "var(--font-data)", fontSize: 13, fontWeight: 500 }}>
          <Upload size={14} />Upload
          <input type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onUpload(e.target.files[0]); }} />
        </label>
      </div>

      {/* Upload zone */}
      <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
        className="mb-5 flex h-20 items-center justify-center rounded-xl transition-colors"
        style={{ border: `1px dashed ${dragOver ? "var(--pd-accent)" : "var(--pd-border)"}`,
          background: dragOver ? "var(--pd-accent-subtle)" : "transparent" }}>
        <span style={{ fontFamily: "var(--font-data)", fontSize: 13, color: "var(--pd-text-muted)" }}>
          Drop files or click to upload
        </span>
      </div>

      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <FileText size={32} style={{ color: "var(--pd-text-muted)", marginBottom: 12 }} />
          <p style={{ fontFamily: "var(--font-data)", fontSize: 14, color: "var(--pd-text-secondary)", marginBottom: 4 }}>No files yet</p>
          <p style={{ fontFamily: "var(--font-data)", fontSize: 12, color: "var(--pd-text-muted)" }}>Upload assets, contracts, or references</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {files.map((file) => {
            const { Icon, color } = fileIcon(file.name);
            return (
            <div key={file.id} className="group relative flex items-center gap-3 rounded-xl transition-colors"
                style={{ background: "var(--pd-surface)", border: "1px solid var(--pd-border)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--pd-accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--pd-border)"; }}>
                <Link
                  href={`/projects/${projectId}/files/${file.id}`}
                  prefetch={false}
                  className="flex flex-1 items-center gap-3 p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: `${color}15` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate" style={{ fontFamily: "var(--font-data)", fontSize: 13, color: "var(--pd-text-primary)" }}>{file.name}</p>
                    <p style={{ fontFamily: "var(--font-data)", fontSize: 11, color: "var(--pd-text-muted)" }}>
                      {formatFileSize(file.size)} · {formatDate(file.created_at)}
                    </p>
                  </div>
                </Link>
                <div className="flex gap-1 pr-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <button className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                    style={{ color: "var(--pd-text-muted)" }}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Download file"
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--pd-accent-subtle)"; e.currentTarget.style.color = "var(--pd-accent)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--pd-text-muted)"; }}>
                    <Download size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
                    aria-label="Delete file"
                    className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                    style={{ color: "var(--pd-text-muted)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "var(--pd-status-overdue)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--pd-text-muted)"; }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
