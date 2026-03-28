import { PageLoader } from "@/components/global/PageLoader";

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center p-8">
      <PageLoader message="Loading dashboard..." />
    </div>
  );
}
