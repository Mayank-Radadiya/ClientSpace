export default async function ProjectDetailPage({
  params,
}: {
  params: { projectId: string };
}) {
  const projectId = await params.projectId;
  return (
    <div className="p-6">
      Project detail — coming in a future task. ID: {projectId}
    </div>
  );
}
