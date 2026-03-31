export const metadata = { title: "Projects — Client Portal" };

export default function ClientProjectsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-muted-foreground text-sm">
          View all projects you're involved in.
        </p>
      </header>

      <div className="rounded-lg border bg-white/50 p-8 backdrop-blur-sm dark:bg-neutral-900/50">
        <p className="text-muted-foreground text-center text-sm">
          No projects to display. Your projects will appear here once your team
          adds you to them.
        </p>
      </div>
    </div>
  );
}
