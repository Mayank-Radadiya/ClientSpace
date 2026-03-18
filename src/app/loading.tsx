import { PageLoader } from "@/components/global/PageLoader";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <PageLoader message="Loading..." />
    </div>
  );
}
