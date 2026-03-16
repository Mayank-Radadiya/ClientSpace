import { FolderOpen } from "lucide-react";

export function EmptyProjects() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted mb-4 rounded-full p-4">
        <FolderOpen className="text-muted-foreground h-8 w-8" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">No projects yet</h3>
      <p className="text-muted-foreground max-w-sm text-sm">
        Create your first project to start managing files, approvals, and
        invoices for your clients.
      </p>
    </div>
  );
}
