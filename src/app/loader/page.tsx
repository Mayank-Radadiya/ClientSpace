import { PageLoader } from "@/components/global/PageLoader";

export default function LoaderPage() {
  return (
    <div className="flex items-center justify-center pt-80">
      <PageLoader message="Loading..." />
    </div>
  );
}
