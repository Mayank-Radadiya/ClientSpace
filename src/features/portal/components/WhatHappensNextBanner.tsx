import Link from "next/link";
import { ArrowRight, BellRing } from "lucide-react";

interface WhatHappensNextBannerProps {
  projects: Array<{ id: string; name: string; status: string }>;
}

export function WhatHappensNextBanner({
  projects,
}: WhatHappensNextBannerProps) {
  const reviewProject = projects.find((project) => project.status === "review");

  if (!reviewProject) return null;

  return (
    <div className="bg-warning/10 border-warning/25 rounded-xl border p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <BellRing className="text-warning-foreground h-4 w-4" />
            <p className="text-sm font-semibold">Action needed</p>
          </div>
          <p className="text-sm">
            <span className="font-medium">{reviewProject.name}</span> is ready
            for your feedback.
          </p>
        </div>
        <Link
          href={`/portal/projects/${reviewProject.id}/files`}
          className="text-primary inline-flex items-center text-sm font-medium"
        >
          Review files
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
