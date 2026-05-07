"use client";

import { useState, useRef } from "react";
import { Upload, File, Trash2 } from "lucide-react";

type FileItem = {
  id: string;
  name: string;
  size: number;
  type: string;
  addedAt: string;
  url: string;
};

export function FilesTab({ clientId: _ }: { clientId: string }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const newFiles: FileItem[] = Array.from(fileList).map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      size: f.size,
      type: f.type,
      addedAt: new Date().toISOString(),
      url: URL.createObjectURL(f),
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 transition-all duration-200 cursor-pointer ${
          dragging ? "border-[#4F7FFF] bg-[rgba(79,127,255,0.06)]" : "border-[rgba(79,127,255,0.25)] hover:border-[#4F7FFF] hover:bg-[rgba(79,127,255,0.03)]"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(79,127,255,0.1)] text-[#4F7FFF]">
          <Upload className="h-6 w-6" />
        </div>
        <div className="text-center">
          <p className="text-[14px] font-medium text-foreground font-[var(--font-display)]">Drop files here</p>
          <p className="text-[12px] text-muted-foreground font-[var(--font-data)]">or click to browse · any file type · max 10MB</p>
        </div>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-4 border-b border-[rgba(255,255,255,0.03)] px-5 py-3 last:border-b-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-[rgba(79,127,255,0.08)] text-[#4F7FFF]">
                <File className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <a href={f.url} download={f.name} className="truncate text-[13px] font-medium text-foreground hover:text-[#4F7FFF] transition-colors font-[var(--font-data)]">
                  {f.name}
                </a>
                <p className="text-[11px] text-muted-foreground font-[var(--font-data)]">{formatSize(f.size)}</p>
              </div>
              <button onClick={() => removeFile(f.id)} className="text-muted-foreground hover:text-[#EF4444] transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-[10px] text-muted-foreground font-[var(--font-data)]">
        Files are stored locally — cloud upload coming in a future update
      </p>
    </div>
  );
}
