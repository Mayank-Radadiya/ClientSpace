"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, FileIcon, FolderKanban, Image, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Milestone = { id: string; completed: boolean; title: string | null };
type Project = {
  id: string;
  name: string;
  status: string;
  deadline: string | Date;
  description?: string | null;
  milestones: Milestone[];
};

interface DocCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  fileTypes: string[];
}

function projectDocs(project: Project): DocCategory[] {
  return [
    {
      id: `${project.id}-briefs`,
      name: "Briefs & Scope",
      icon: FileText,
      count: 2,
      fileTypes: ["PDF", "DOC"],
    },
    {
      id: `${project.id}-designs`,
      name: "Design Assets",
      icon: Image,
      count: 5,
      fileTypes: ["AI", "PSD", "PNG"],
    },
    {
      id: `${project.id}-reports`,
      name: "Reports",
      icon: FileIcon,
      count: 1,
      fileTypes: ["PDF"],
    },
    {
      id: `${project.id}-contracts`,
      name: "Contracts",
      icon: FileText,
      count: 1,
      fileTypes: ["PDF"],
    },
  ];
}

// ponytail: static categories, replace with folder query when documents table exists

export function DocumentsPageClient({ projects }: { projects: Project[] }) {
  const [search, setSearch] = useState("");

  const allDocs = projects.flatMap((p) =>
    projectDocs(p).map((cat) => ({
      ...cat,
      projectName: p.name,
      projectId: p.id,
      projectStatus: p.status,
    })),
  );

  const filtered = allDocs.filter(
    (d) =>
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.projectName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Browse project files, briefs, and deliverables.
        </p>
      </div>

      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-muted-foreground bg-card rounded-xl border p-8 text-center text-sm">
          {projects.length === 0
            ? "No projects yet. Documents will appear here once projects are created."
            : "No documents match your search."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => {
            const Icon = doc.icon;
            return (
              <Link
                key={doc.id}
                href={`/portal/projects/${doc.projectId}/files`}
                className="group bg-card hover:border-primary/40 block rounded-xl border p-4 transition-colors"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <Icon className="text-primary h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{doc.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {doc.projectName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <FolderKanban className="h-3 w-3" />
                    <span>
                      {doc.count} file{doc.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {doc.projectStatus.replace(/_/g, " ")}
                  </Badge>
                </div>
                {doc.fileTypes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {doc.fileTypes.map((ft) => (
                      <span
                        key={ft}
                        className="bg-muted rounded px-1.5 py-0.5 text-[10px] font-medium"
                      >
                        {ft}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
