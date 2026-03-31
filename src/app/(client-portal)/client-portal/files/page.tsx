export const metadata = { title: "Files — Client Portal" };

export default function ClientFilesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Files</h1>
        <p className="text-muted-foreground text-sm">
          Access files shared with you by your team.
        </p>
      </header>

      <div className="rounded-lg border bg-white/50 p-8 backdrop-blur-sm dark:bg-neutral-900/50">
        <p className="text-muted-foreground text-center text-sm">
          No files to display. Files shared with you will appear here.
        </p>
      </div>
    </div>
  );
}
