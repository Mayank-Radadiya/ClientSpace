import Link from "next/link";

interface ProjectDetailPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { projectId } = await params;

  console.log(projectId);

  return (
    <div className="flex p-6">
      Project detail — coming in a future task. ID: {projectId}
      <Link className="text-blue-500" href={`/projects/${projectId}/files`}>
        Files
      </Link>
    </div>
  );
}
