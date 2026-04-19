import Link from "next/link";
import { Home, LayoutDashboard, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <span className="bg-muted flex h-20 w-20 items-center justify-center rounded-2xl border">
            <SearchX className="text-muted-foreground h-10 w-10" />
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
            404
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you are looking for does not exist or may have been moved.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-3 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 sm:w-auto"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-input bg-popover px-3 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-accent/50 sm:w-auto"
          >
            <Home className="mr-2 h-4 w-4" />
            Go to Home
          </Link>
        </div>

        <p className="text-muted-foreground text-xs">Powered by ClientSpace</p>
      </div>
    </main>
  );
}
