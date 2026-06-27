import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PortalNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
        <FileQuestion className="text-muted-foreground h-7 w-7" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Page not found</h2>
        <p className="text-muted-foreground mt-1 max-w-md text-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/portal">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>
    </div>
  );
}
